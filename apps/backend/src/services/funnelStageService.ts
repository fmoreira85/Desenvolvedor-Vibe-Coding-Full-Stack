import { withTransaction } from "../db/helpers";
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

export const listFunnelStages = async (userId: string, workspaceId: string) => {
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
