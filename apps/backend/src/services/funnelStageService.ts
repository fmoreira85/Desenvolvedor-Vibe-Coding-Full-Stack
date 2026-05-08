import { withTransaction } from "../db/helpers";
import { getSupabaseAdminClient, isSupabaseDataEnabled, throwIfSupabaseError } from "../db/supabase";
import { AppError } from "../errors/AppError";
import { logActivity } from "./activityLogService";
import {
  assertWorkspaceAdminMembership,
  assertWorkspaceMembership
} from "./workspaceMembershipService";

type StageRow = {
  id: string;
  workspace_id: string;
  name: string;
  order: number;
  color: string;
  created_at: string;
};

type RequiredFieldRow = {
  id: string;
  stage_id: string;
  field_name: string;
  is_custom_field: boolean;
};

const mapRequiredField = (field: RequiredFieldRow) => ({
  id: field.id,
  stageId: field.stage_id,
  fieldName: field.field_name,
  isCustomField: field.is_custom_field
});

const attachRequiredFields = (stages: StageRow[], requiredFields: RequiredFieldRow[]) => {
  return stages.map((stage) => ({
    id: stage.id,
    workspaceId: stage.workspace_id,
    name: stage.name,
    order: stage.order,
    color: stage.color,
    createdAt: stage.created_at,
    requiredFields: requiredFields
      .filter((requiredField) => requiredField.stage_id === stage.id)
      .map(mapRequiredField)
  }));
};

const supabaseExecutorStub = { query: async () => ({ rows: [] } as never) };

export const listFunnelStages = async (userId: string, workspaceId: string) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    await assertWorkspaceMembership(supabaseExecutorStub, userId, workspaceId);

    const { data: stages, error: stagesError } = await supabase
      .from("funnel_stages")
      .select("id, workspace_id, name, order, color, created_at")
      .eq("workspace_id", workspaceId)
      .order("order", { ascending: true });

    throwIfSupabaseError(stagesError, "Funnel stage lookup failed.");

    const stageIds = (stages ?? []).map((stage) => stage.id);
    let requiredFields: RequiredFieldRow[] = [];

    if (stageIds.length > 0) {
      const { data, error } = await supabase
        .from("stage_required_fields")
        .select("id, stage_id, field_name, is_custom_field")
        .in("stage_id", stageIds);

      throwIfSupabaseError(error, "Required field lookup for stages failed.");
      requiredFields = data ?? [];
    }

    return attachRequiredFields((stages ?? []) as StageRow[], requiredFields);
  }

  return withTransaction(async (client) => {
    await assertWorkspaceMembership(client, userId, workspaceId);

    const [stagesResult, requiredFieldsResult] = await Promise.all([
      client.query<StageRow>(
        `
          SELECT id, workspace_id, name, "order", color, created_at
          FROM funnel_stages
          WHERE workspace_id = $1
          ORDER BY "order" ASC
        `,
        [workspaceId]
      ),
      client.query<RequiredFieldRow>(
        `
          SELECT id, stage_id, field_name, is_custom_field
          FROM stage_required_fields
          WHERE stage_id IN (
            SELECT id
            FROM funnel_stages
            WHERE workspace_id = $1
          )
        `,
        [workspaceId]
      )
    ]);

    return attachRequiredFields(stagesResult.rows, requiredFieldsResult.rows);
  });
};

export const createFunnelStage = async (
  userId: string,
  input: { workspaceId: string; name: string; order: number; color: string }
) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    await assertWorkspaceAdminMembership(supabaseExecutorStub, userId, input.workspaceId);

    const { data: stage, error } = await supabase
      .from("funnel_stages")
      .insert({
        workspace_id: input.workspaceId,
        name: input.name,
        order: input.order,
        color: input.color
      })
      .select("id, workspace_id, name, order, color, created_at")
      .single<StageRow>();

    throwIfSupabaseError(error, "Funnel stage creation failed.");

    if (!stage) {
      throw new AppError("Funnel stage creation did not return a record.", 500);
    }

    await logActivity(supabaseExecutorStub, {
      workspaceId: input.workspaceId,
      userId,
      action: "funnel_stage.created",
      metadata: {
        stageId: stage.id,
        name: stage.name
      }
    });

    return {
      id: stage.id,
      workspaceId: stage.workspace_id,
      name: stage.name,
      order: stage.order,
      color: stage.color,
      createdAt: stage.created_at,
      requiredFields: []
    };
  }

  return withTransaction(async (client) => {
    await assertWorkspaceAdminMembership(client, userId, input.workspaceId);

    const result = await client.query<StageRow>(
      `
        INSERT INTO funnel_stages (workspace_id, name, "order", color)
        VALUES ($1, $2, $3, $4)
        RETURNING id, workspace_id, name, "order", color, created_at
      `,
      [input.workspaceId, input.name, input.order, input.color]
    );

    const stage = result.rows[0];

    await logActivity(client, {
      workspaceId: input.workspaceId,
      userId,
      action: "funnel_stage.created",
      metadata: {
        stageId: stage.id,
        name: stage.name
      }
    });

    return {
      id: stage.id,
      workspaceId: stage.workspace_id,
      name: stage.name,
      order: stage.order,
      color: stage.color,
      createdAt: stage.created_at,
      requiredFields: []
    };
  });
};

export const updateFunnelStage = async (
  userId: string,
  stageId: string,
  input: Partial<{ name: string; order: number; color: string }>
) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data: current, error: currentError } = await supabase
      .from("funnel_stages")
      .select("id, workspace_id, name, order, color, created_at")
      .eq("id", stageId)
      .maybeSingle<StageRow>();

    throwIfSupabaseError(currentError, "Funnel stage lookup failed.");

    if (!current) {
      throw new AppError("Funnel stage not found.", 404);
    }

    await assertWorkspaceAdminMembership(supabaseExecutorStub, userId, current.workspace_id);

    const updates: Partial<{ name: string; order: number; color: string }> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.order !== undefined) updates.order = input.order;
    if (input.color !== undefined) updates.color = input.color;

    const { data: updated, error: updateError } = await supabase
      .from("funnel_stages")
      .update(updates)
      .eq("id", stageId)
      .select("id, workspace_id, name, order, color, created_at")
      .single<StageRow>();

    throwIfSupabaseError(updateError, "Funnel stage update failed.");

    if (!updated) {
      throw new AppError("Funnel stage update did not return a record.", 500);
    }

    const { data: requiredFields, error: requiredError } = await supabase
      .from("stage_required_fields")
      .select("id, stage_id, field_name, is_custom_field")
      .eq("stage_id", stageId);

    throwIfSupabaseError(requiredError, "Required field lookup failed.");

    await logActivity(supabaseExecutorStub, {
      workspaceId: updated.workspace_id,
      userId,
      action: "funnel_stage.updated",
      metadata: {
        stageId,
        updates: input
      }
    });

    return {
      id: updated.id,
      workspaceId: updated.workspace_id,
      name: updated.name,
      order: updated.order,
      color: updated.color,
      createdAt: updated.created_at,
      requiredFields: (requiredFields ?? []).map(mapRequiredField)
    };
  }

  return withTransaction(async (client) => {
    const currentResult = await client.query<StageRow>(
      `
        SELECT id, workspace_id, name, "order", color, created_at
        FROM funnel_stages
        WHERE id = $1
      `,
      [stageId]
    );

    const current = currentResult.rows[0];

    if (!current) {
      throw new AppError("Funnel stage not found.", 404);
    }

    await assertWorkspaceAdminMembership(client, userId, current.workspace_id);

    const result = await client.query<StageRow>(
      `
        UPDATE funnel_stages
        SET
          name = COALESCE($2, name),
          "order" = COALESCE($3, "order"),
          color = COALESCE($4, color)
        WHERE id = $1
        RETURNING id, workspace_id, name, "order", color, created_at
      `,
      [stageId, input.name ?? null, input.order ?? null, input.color ?? null]
    );

    const updated = result.rows[0];

    const requiredFieldsResult = await client.query<RequiredFieldRow>(
      `
        SELECT id, stage_id, field_name, is_custom_field
        FROM stage_required_fields
        WHERE stage_id = $1
      `,
      [stageId]
    );

    await logActivity(client, {
      workspaceId: updated.workspace_id,
      userId,
      action: "funnel_stage.updated",
      metadata: {
        stageId,
        updates: input
      }
    });

    return {
      id: updated.id,
      workspaceId: updated.workspace_id,
      name: updated.name,
      order: updated.order,
      color: updated.color,
      createdAt: updated.created_at,
      requiredFields: requiredFieldsResult.rows.map(mapRequiredField)
    };
  });
};

export const replaceStageRequiredFields = async (
  userId: string,
  stageId: string,
  requiredFields: Array<{ fieldName: string; isCustomField: boolean }>
) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data: stage, error: stageError } = await supabase
      .from("funnel_stages")
      .select("id, workspace_id, name, order, color, created_at")
      .eq("id", stageId)
      .maybeSingle<StageRow>();

    throwIfSupabaseError(stageError, "Funnel stage lookup failed.");

    if (!stage) {
      throw new AppError("Funnel stage not found.", 404);
    }

    await assertWorkspaceAdminMembership(supabaseExecutorStub, userId, stage.workspace_id);

    const { error: deleteError } = await supabase
      .from("stage_required_fields")
      .delete()
      .eq("stage_id", stageId);

    throwIfSupabaseError(deleteError, "Required field reset failed.");

    if (requiredFields.length > 0) {
      const { error: insertError } = await supabase.from("stage_required_fields").insert(
        requiredFields.map((field) => ({
          stage_id: stageId,
          field_name: field.fieldName,
          is_custom_field: field.isCustomField
        }))
      );

      throwIfSupabaseError(insertError, "Required field update failed.");
    }

    const { data: refreshed, error: refreshedError } = await supabase
      .from("stage_required_fields")
      .select("id, stage_id, field_name, is_custom_field")
      .eq("stage_id", stageId)
      .order("field_name", { ascending: true });

    throwIfSupabaseError(refreshedError, "Required field refresh failed.");

    await logActivity(supabaseExecutorStub, {
      workspaceId: stage.workspace_id,
      userId,
      action: "funnel_stage.required_fields_updated",
      metadata: {
        stageId,
        requiredFields
      }
    });

    return {
      id: stage.id,
      workspaceId: stage.workspace_id,
      name: stage.name,
      order: stage.order,
      color: stage.color,
      createdAt: stage.created_at,
      requiredFields: (refreshed ?? []).map(mapRequiredField)
    };
  }

  return withTransaction(async (client) => {
    const stageResult = await client.query<StageRow>(
      `
        SELECT id, workspace_id, name, "order", color, created_at
        FROM funnel_stages
        WHERE id = $1
      `,
      [stageId]
    );

    const stage = stageResult.rows[0];

    if (!stage) {
      throw new AppError("Funnel stage not found.", 404);
    }

    await assertWorkspaceAdminMembership(client, userId, stage.workspace_id);

    await client.query("DELETE FROM stage_required_fields WHERE stage_id = $1", [stageId]);

    for (const field of requiredFields) {
      await client.query(
        `
          INSERT INTO stage_required_fields (stage_id, field_name, is_custom_field)
          VALUES ($1, $2, $3)
        `,
        [stageId, field.fieldName, field.isCustomField]
      );
    }

    const refreshed = await client.query<RequiredFieldRow>(
      `
        SELECT id, stage_id, field_name, is_custom_field
        FROM stage_required_fields
        WHERE stage_id = $1
        ORDER BY field_name ASC
      `,
      [stageId]
    );

    await logActivity(client, {
      workspaceId: stage.workspace_id,
      userId,
      action: "funnel_stage.required_fields_updated",
      metadata: {
        stageId,
        requiredFields
      }
    });

    return {
      id: stage.id,
      workspaceId: stage.workspace_id,
      name: stage.name,
      order: stage.order,
      color: stage.color,
      createdAt: stage.created_at,
      requiredFields: refreshed.rows.map(mapRequiredField)
    };
  });
};
