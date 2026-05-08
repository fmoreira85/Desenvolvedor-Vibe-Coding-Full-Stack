import { database, query, withTransaction } from "../db/helpers";
import type { DatabaseExecutor } from "../db/helpers";
import { getSupabaseAdminClient, isSupabaseDataEnabled, throwIfSupabaseError } from "../db/supabase";
import { AppError } from "../errors/AppError";
import type { CustomFieldInput } from "../types/domain";
import { logActivity } from "./activityLogService";
import { triggerCampaignsForLead } from "./campaignService";
import {
  assertAssignableWorkspaceMember,
  assertWorkspaceMembership
} from "./workspaceMembershipService";

type LeadBaseRow = {
  id: string;
  workspace_id: string;
  stage_id: string;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  assigned_user_email: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  lead_source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  stage_name: string;
  stage_order: number;
  stage_color: string;
};

type LeadRecord = {
  id: string;
  workspace_id: string;
  stage_id: string;
  assigned_user_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  lead_source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type StageRecord = {
  id: string;
  workspace_id: string;
  name: string;
  order: number;
  color: string;
  created_at: string;
};

type UserRecord = {
  id: string;
  name: string;
  email: string;
};

type LeadCustomValueRow = {
  lead_id: string;
  custom_field_id: string;
  custom_field_name: string;
  field_type: string;
  value: string | null;
};

type RequiredFieldRow = {
  field_name: string;
  is_custom_field: boolean;
};

const supabaseExecutorStub = { query: async () => ({ rows: [] } as never) };

const normalizeCustomFieldValues = (input: unknown): CustomFieldInput[] => {
  if (input === undefined) {
    return [];
  }

  if (Array.isArray(input)) {
    return input.map((item) => {
      const entry = item as { customFieldId?: unknown; value?: unknown };

      if (typeof entry.customFieldId !== "string" || entry.customFieldId.trim().length === 0) {
        throw new AppError("Each custom field value must include customFieldId.", 400);
      }

      return {
        customFieldId: entry.customFieldId,
        value:
          entry.value === undefined || entry.value === null ? null : String(entry.value).trim()
      };
    });
  }

  if (typeof input === "object" && input !== null) {
    return Object.entries(input).map(([customFieldId, value]) => ({
      customFieldId,
      value: value === undefined || value === null ? null : String(value).trim()
    }));
  }

  throw new AppError("customFieldValues must be an array or object.", 400);
};

const mapLead = (lead: LeadBaseRow, customValues: LeadCustomValueRow[]) => ({
  id: lead.id,
  workspaceId: lead.workspace_id,
  stageId: lead.stage_id,
  assignedUserId: lead.assigned_user_id,
  assignedUser:
    lead.assigned_user_id && lead.assigned_user_name && lead.assigned_user_email
      ? {
          id: lead.assigned_user_id,
          name: lead.assigned_user_name,
          email: lead.assigned_user_email
        }
      : null,
  name: lead.name,
  email: lead.email,
  phone: lead.phone,
  company: lead.company,
  role: lead.role,
  leadSource: lead.lead_source,
  notes: lead.notes,
  createdAt: lead.created_at,
  updatedAt: lead.updated_at,
  stage: {
    id: lead.stage_id,
    name: lead.stage_name,
    order: lead.stage_order,
    color: lead.stage_color
  },
  customFieldValues: customValues
    .filter((value) => value.lead_id === lead.id)
    .map((value) => ({
      customFieldId: value.custom_field_id,
      name: value.custom_field_name,
      fieldType: value.field_type,
      value: value.value
    }))
});

const mapSupabaseLeadRow = (
  lead: LeadRecord,
  stagesById: Map<string, StageRecord>,
  usersById: Map<string, UserRecord>,
  customValues: LeadCustomValueRow[]
): LeadBaseRow => {
  const stage = stagesById.get(lead.stage_id);

  if (!stage) {
    throw new AppError("Lead stage not found for workspace.", 500);
  }

  const assignedUser = lead.assigned_user_id ? usersById.get(lead.assigned_user_id) ?? null : null;

  return {
    ...lead,
    assigned_user_name: assignedUser?.name ?? null,
    assigned_user_email: assignedUser?.email ?? null,
    stage_name: stage.name,
    stage_order: stage.order,
    stage_color: stage.color
  };
};

const fetchCustomValues = async (executor: DatabaseExecutor, leadIds: string[]) => {
  if (leadIds.length === 0) {
    return [];
  }

  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data: valueRows, error: valuesError } = await supabase
      .from("lead_custom_values")
      .select("lead_id, custom_field_id, value")
      .in("lead_id", leadIds);

    throwIfSupabaseError(valuesError, "Lead custom value lookup failed.");

    const customFieldIds = Array.from(
      new Set((valueRows ?? []).map((row) => row.custom_field_id))
    );

    if (customFieldIds.length === 0) {
      return [];
    }

    const { data: customFields, error: fieldsError } = await supabase
      .from("custom_fields")
      .select("id, name, field_type")
      .in("id", customFieldIds);

    throwIfSupabaseError(fieldsError, "Custom field lookup failed.");

    const fieldsById = new Map((customFields ?? []).map((field) => [field.id, field]));

    return (valueRows ?? [])
      .map((row) => {
        const field = fieldsById.get(row.custom_field_id);

        if (!field) {
          return null;
        }

        return {
          lead_id: row.lead_id,
          custom_field_id: row.custom_field_id,
          custom_field_name: field.name,
          field_type: field.field_type,
          value: row.value
        } satisfies LeadCustomValueRow;
      })
      .filter((row): row is LeadCustomValueRow => Boolean(row));
  }

  const result = await executor.query<LeadCustomValueRow>(
    `
      SELECT
        lcv.lead_id,
        lcv.custom_field_id,
        cf.name AS custom_field_name,
        cf.field_type,
        lcv.value
      FROM lead_custom_values lcv
      INNER JOIN custom_fields cf ON cf.id = lcv.custom_field_id
      WHERE lcv.lead_id = ANY($1::uuid[])
    `,
    [leadIds]
  );

  return result.rows;
};

const fetchLeadRows = async (
  executor: DatabaseExecutor,
  filters: {
    leadId?: string;
    workspaceId?: string;
    stageId?: string;
    assignedTo?: string;
    search?: string;
  }
) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    if (filters.leadId) {
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select(
          "id, workspace_id, stage_id, assigned_user_id, name, email, phone, company, role, lead_source, notes, created_at, updated_at"
        )
        .eq("id", filters.leadId);

      throwIfSupabaseError(leadsError, "Lead lookup failed.");

      const leadRows = (leads ?? []) as LeadRecord[];
      const stageIds = Array.from(new Set(leadRows.map((lead) => lead.stage_id)));
      const assignedUserIds = Array.from(
        new Set(leadRows.map((lead) => lead.assigned_user_id).filter(Boolean) as string[])
      );

      const [{ data: stages, error: stagesError }, { data: users, error: usersError }] =
        await Promise.all([
          stageIds.length > 0
            ? supabase
                .from("funnel_stages")
                .select("id, workspace_id, name, order, color, created_at")
                .in("id", stageIds)
            : Promise.resolve({ data: [], error: null }),
          assignedUserIds.length > 0
            ? supabase.from("users").select("id, name, email").in("id", assignedUserIds)
            : Promise.resolve({ data: [], error: null })
        ]);

      throwIfSupabaseError(stagesError, "Lead stage lookup failed.");
      throwIfSupabaseError(usersError, "Assigned user lookup failed.");

      const stagesById = new Map((stages ?? []).map((stage) => [stage.id, stage as StageRecord]));
      const usersById = new Map((users ?? []).map((user) => [user.id, user as UserRecord]));

      return {
        rows: leadRows.map((lead) => mapSupabaseLeadRow(lead, stagesById, usersById, []))
      };
    }

    if (!filters.workspaceId) {
      throw new AppError("workspaceId is required to list leads.", 400);
    }

    let request = supabase
      .from("leads")
      .select(
        "id, workspace_id, stage_id, assigned_user_id, name, email, phone, company, role, lead_source, notes, created_at, updated_at"
      )
      .eq("workspace_id", filters.workspaceId)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.stageId) {
      request = request.eq("stage_id", filters.stageId);
    }

    if (filters.assignedTo) {
      request = request.eq("assigned_user_id", filters.assignedTo);
    }

    if (filters.search) {
      const normalizedSearch = filters.search.replace(/%/g, "");
      request = request.or(`name.ilike.%${normalizedSearch}%,company.ilike.%${normalizedSearch}%`);
    }

    const { data: leads, error: leadsError } = await request;
    throwIfSupabaseError(leadsError, "Lead lookup failed.");

    const leadRows = (leads ?? []) as LeadRecord[];
    const stageIds = Array.from(new Set(leadRows.map((lead) => lead.stage_id)));
    const assignedUserIds = Array.from(
      new Set(leadRows.map((lead) => lead.assigned_user_id).filter(Boolean) as string[])
    );

    const [{ data: stages, error: stagesError }, { data: users, error: usersError }] =
      await Promise.all([
        stageIds.length > 0
          ? supabase
              .from("funnel_stages")
              .select("id, workspace_id, name, order, color, created_at")
              .in("id", stageIds)
          : Promise.resolve({ data: [], error: null }),
        assignedUserIds.length > 0
          ? supabase.from("users").select("id, name, email").in("id", assignedUserIds)
          : Promise.resolve({ data: [], error: null })
      ]);

    throwIfSupabaseError(stagesError, "Lead stage lookup failed.");
    throwIfSupabaseError(usersError, "Assigned user lookup failed.");

    const stagesById = new Map((stages ?? []).map((stage) => [stage.id, stage as StageRecord]));
    const usersById = new Map((users ?? []).map((user) => [user.id, user as UserRecord]));

    return {
      rows: leadRows.map((lead) => mapSupabaseLeadRow(lead, stagesById, usersById, []))
    };
  }

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters.leadId) {
    values.push(filters.leadId);
    conditions.push(`l.id = $${values.length}`);
  }

  if (filters.workspaceId) {
    values.push(filters.workspaceId);
    conditions.push(`l.workspace_id = $${values.length}`);
  }

  if (filters.stageId) {
    values.push(filters.stageId);
    conditions.push(`l.stage_id = $${values.length}`);
  }

  if (filters.assignedTo) {
    values.push(filters.assignedTo);
    conditions.push(`l.assigned_user_id = $${values.length}`);
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    conditions.push(
      `(l.name ILIKE $${values.length} OR COALESCE(l.company, '') ILIKE $${values.length})`
    );
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return executor.query<LeadBaseRow>(
    `
      SELECT
        l.id,
        l.workspace_id,
        l.stage_id,
        l.assigned_user_id,
        assigned_user.name AS assigned_user_name,
        assigned_user.email AS assigned_user_email,
        l.name,
        l.email,
        l.phone,
        l.company,
        l.role,
        l.lead_source,
        l.notes,
        l.created_at,
        l.updated_at,
        fs.name AS stage_name,
        fs."order" AS stage_order,
        fs.color AS stage_color
      FROM leads l
      INNER JOIN funnel_stages fs ON fs.id = l.stage_id
      LEFT JOIN users assigned_user ON assigned_user.id = l.assigned_user_id
      ${whereClause}
      ORDER BY l.updated_at DESC, l.created_at DESC
    `,
    values
  );
};

const findWorkspaceStage = async (
  executor: DatabaseExecutor,
  workspaceId: string,
  stageId: string
) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("funnel_stages")
      .select("id")
      .eq("id", stageId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    throwIfSupabaseError(error, "Stage lookup failed.");

    if (!data) {
      throw new AppError("Stage does not belong to this workspace.", 400);
    }

    return;
  }

  const result = await executor.query<{ id: string }>(
    `
      SELECT id
      FROM funnel_stages
      WHERE id = $1 AND workspace_id = $2
    `,
    [stageId, workspaceId]
  );

  if (!result.rows[0]) {
    throw new AppError("Stage does not belong to this workspace.", 400);
  }
};

const findDefaultStageForWorkspace = async (executor: DatabaseExecutor, workspaceId: string) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("funnel_stages")
      .select("id")
      .eq("workspace_id", workspaceId)
      .order("order", { ascending: true })
      .limit(1)
      .maybeSingle<{ id: string }>();

    throwIfSupabaseError(error, "Default stage lookup failed.");

    if (!data) {
      throw new AppError("Workspace does not have funnel stages configured.", 400);
    }

    return data.id;
  }

  const result = await executor.query<{ id: string }>(
    `
      SELECT id
      FROM funnel_stages
      WHERE workspace_id = $1
      ORDER BY "order" ASC
      LIMIT 1
    `,
    [workspaceId]
  );

  const stage = result.rows[0];

  if (!stage) {
    throw new AppError("Workspace does not have funnel stages configured.", 400);
  }

  return stage.id;
};

const upsertCustomFieldValues = async (
  executor: DatabaseExecutor,
  workspaceId: string,
  leadId: string,
  customFieldValues: CustomFieldInput[]
) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();

    for (const item of customFieldValues) {
      const { data: fieldValidation, error: fieldError } = await supabase
        .from("custom_fields")
        .select("id")
        .eq("id", item.customFieldId)
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      throwIfSupabaseError(fieldError, "Custom field validation failed.");

      if (!fieldValidation) {
        throw new AppError("Custom field does not belong to the workspace.", 400);
      }

      if (item.value === null || item.value.length === 0) {
        const { error: deleteError } = await supabase
          .from("lead_custom_values")
          .delete()
          .eq("lead_id", leadId)
          .eq("custom_field_id", item.customFieldId);

        throwIfSupabaseError(deleteError, "Lead custom value deletion failed.");
      } else {
        const { error: upsertError } = await supabase.from("lead_custom_values").upsert(
          {
            lead_id: leadId,
            custom_field_id: item.customFieldId,
            value: item.value
          },
          { onConflict: "lead_id,custom_field_id" }
        );

        throwIfSupabaseError(upsertError, "Lead custom value upsert failed.");
      }
    }

    return;
  }

  for (const item of customFieldValues) {
    const fieldValidation = await executor.query(
      `
        SELECT id
        FROM custom_fields
        WHERE id = $1 AND workspace_id = $2
      `,
      [item.customFieldId, workspaceId]
    );

    if (fieldValidation.rowCount === 0) {
      throw new AppError("Custom field does not belong to the workspace.", 400);
    }

    if (item.value === null || item.value.length === 0) {
      await executor.query(
        `
          DELETE FROM lead_custom_values
          WHERE lead_id = $1 AND custom_field_id = $2
        `,
        [leadId, item.customFieldId]
      );
    } else {
      await executor.query(
        `
          INSERT INTO lead_custom_values (lead_id, custom_field_id, value)
          VALUES ($1, $2, $3)
          ON CONFLICT (lead_id, custom_field_id)
          DO UPDATE SET value = EXCLUDED.value
        `,
        [leadId, item.customFieldId, item.value]
      );
    }
  }
};

const fetchLeadForValidation = async (executor: DatabaseExecutor, leadId: string) => {
  const leadResult = await fetchLeadRows(executor, { leadId });
  const lead = leadResult.rows[0];

  if (!lead) {
    throw new AppError("Lead not found.", 404);
  }

  const customValues = await fetchCustomValues(executor, [leadId]);

  return {
    lead,
    customValues
  };
};

export const listLeads = async (
  userId: string,
  filters: {
    workspaceId: string;
    stageId?: string;
    search?: string;
    assignedTo?: string;
  }
) => {
  await assertWorkspaceMembership(database, userId, filters.workspaceId);
  const leadResult = await fetchLeadRows(database, filters);
  const customValues = await fetchCustomValues(database, leadResult.rows.map((lead) => lead.id));

  return leadResult.rows.map((lead) => mapLead(lead, customValues));
};

export const getLeadById = async (userId: string, leadId: string) => {
  const { lead, customValues } = await fetchLeadForValidation(database, leadId);
  await assertWorkspaceMembership(database, userId, lead.workspace_id);
  return mapLead(lead, customValues);
};

export const createLead = async (
  userId: string,
  input: {
    workspaceId: string;
    stageId?: string | null;
    assignedUserId?: string | null;
    name: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    role?: string | null;
    leadSource?: string | null;
    notes?: string | null;
    customFieldValues?: unknown;
  }
) => {
  const customFieldValues = normalizeCustomFieldValues(input.customFieldValues);

  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    await assertWorkspaceMembership(supabaseExecutorStub, userId, input.workspaceId);

    const stageId =
      input.stageId && input.stageId.length > 0
        ? input.stageId
        : await findDefaultStageForWorkspace(supabaseExecutorStub, input.workspaceId);

    await findWorkspaceStage(supabaseExecutorStub, input.workspaceId, stageId);

    if (input.assignedUserId) {
      await assertAssignableWorkspaceMember(supabaseExecutorStub, input.workspaceId, input.assignedUserId);
    }

    const { data: insertedLead, error: insertError } = await supabase
      .from("leads")
      .insert({
        workspace_id: input.workspaceId,
        stage_id: stageId,
        assigned_user_id: input.assignedUserId ?? null,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        company: input.company ?? null,
        role: input.role ?? null,
        lead_source: input.leadSource ?? null,
        notes: input.notes ?? null
      })
      .select("id")
      .single<{ id: string }>();

    throwIfSupabaseError(insertError, "Lead creation failed.");

    if (!insertedLead) {
      throw new AppError("Lead creation did not return a record.", 500);
    }

    await upsertCustomFieldValues(supabaseExecutorStub, input.workspaceId, insertedLead.id, customFieldValues);

    await logActivity(supabaseExecutorStub, {
      workspaceId: input.workspaceId,
      leadId: insertedLead.id,
      userId,
      action: "lead.created",
      metadata: {
        stageId
      }
    });

    void triggerCampaignsForLead(insertedLead.id, userId).catch(() => undefined);

    return getLeadById(userId, insertedLead.id);
  }

  const lead = await withTransaction(async (client) => {
    await assertWorkspaceMembership(client, userId, input.workspaceId);

    const stageId =
      input.stageId && input.stageId.length > 0
        ? input.stageId
        : await findDefaultStageForWorkspace(client, input.workspaceId);

    await findWorkspaceStage(client, input.workspaceId, stageId);

    if (input.assignedUserId) {
      await assertAssignableWorkspaceMember(client, input.workspaceId, input.assignedUserId);
    }

    const result = await client.query<{ id: string }>(
      `
        INSERT INTO leads (
          workspace_id,
          stage_id,
          assigned_user_id,
          name,
          email,
          phone,
          company,
          role,
          lead_source,
          notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `,
      [
        input.workspaceId,
        stageId,
        input.assignedUserId ?? null,
        input.name,
        input.email ?? null,
        input.phone ?? null,
        input.company ?? null,
        input.role ?? null,
        input.leadSource ?? null,
        input.notes ?? null
      ]
    );

    const leadId = result.rows[0].id;

    await upsertCustomFieldValues(client, input.workspaceId, leadId, customFieldValues);

    await logActivity(client, {
      workspaceId: input.workspaceId,
      leadId,
      userId,
      action: "lead.created",
      metadata: {
        stageId
      }
    });

    return { leadId, stageId };
  });

  void triggerCampaignsForLead(lead.leadId, userId).catch(() => undefined);

  return getLeadById(userId, lead.leadId);
};

export const updateLead = async (
  userId: string,
  leadId: string,
  input: Partial<{
    stageId: string | null;
    assignedUserId: string | null;
    name: string | null;
    email: string | null;
    phone: string | null;
    company: string | null;
    role: string | null;
    leadSource: string | null;
    notes: string | null;
    customFieldValues: unknown;
  }>
) => {
  const customFieldValues = normalizeCustomFieldValues(input.customFieldValues);

  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { lead } = await fetchLeadForValidation(supabaseExecutorStub, leadId);
    await assertWorkspaceMembership(supabaseExecutorStub, userId, lead.workspace_id);

    const stageId = input.stageId === undefined ? lead.stage_id : (input.stageId ?? lead.stage_id);
    const assignedUserId =
      input.assignedUserId === undefined ? lead.assigned_user_id : input.assignedUserId;
    const email = input.email === undefined ? lead.email : input.email;
    const phone = input.phone === undefined ? lead.phone : input.phone;
    const company = input.company === undefined ? lead.company : input.company;
    const role = input.role === undefined ? lead.role : input.role;
    const leadSource = input.leadSource === undefined ? lead.lead_source : input.leadSource;
    const notes = input.notes === undefined ? lead.notes : input.notes;

    if (stageId !== lead.stage_id) {
      await findWorkspaceStage(supabaseExecutorStub, lead.workspace_id, stageId);
    }

    if (assignedUserId) {
      await assertAssignableWorkspaceMember(supabaseExecutorStub, lead.workspace_id, assignedUserId);
    }

    const updates: Record<string, unknown> = {
      stage_id: stageId,
      assigned_user_id: assignedUserId,
      email,
      phone,
      company,
      role,
      lead_source: leadSource,
      notes,
      updated_at: new Date().toISOString()
    };

    if (input.name !== undefined) {
      updates.name = input.name ?? lead.name;
    }

    const { error: updateError } = await supabase.from("leads").update(updates).eq("id", leadId);
    throwIfSupabaseError(updateError, "Lead update failed.");

    await upsertCustomFieldValues(supabaseExecutorStub, lead.workspace_id, leadId, customFieldValues);

    await logActivity(supabaseExecutorStub, {
      workspaceId: lead.workspace_id,
      leadId,
      userId,
      action: "lead.updated",
      metadata: input
    });

    if (input.stageId && input.stageId !== lead.stage_id) {
      void triggerCampaignsForLead(leadId, userId).catch(() => undefined);
    }

    return getLeadById(userId, leadId);
  }

  const result = await withTransaction(async (client) => {
    const { lead } = await fetchLeadForValidation(client, leadId);
    await assertWorkspaceMembership(client, userId, lead.workspace_id);

    const stageId = input.stageId === undefined ? lead.stage_id : (input.stageId ?? lead.stage_id);
    const assignedUserId =
      input.assignedUserId === undefined ? lead.assigned_user_id : input.assignedUserId;
    const email = input.email === undefined ? lead.email : input.email;
    const phone = input.phone === undefined ? lead.phone : input.phone;
    const company = input.company === undefined ? lead.company : input.company;
    const role = input.role === undefined ? lead.role : input.role;
    const leadSource = input.leadSource === undefined ? lead.lead_source : input.leadSource;
    const notes = input.notes === undefined ? lead.notes : input.notes;

    if (stageId !== lead.stage_id) {
      await findWorkspaceStage(client, lead.workspace_id, stageId);
    }

    if (assignedUserId) {
      await assertAssignableWorkspaceMember(client, lead.workspace_id, assignedUserId);
    }

    await client.query(
      `
        UPDATE leads
        SET
          stage_id = $2,
          assigned_user_id = $3,
          name = COALESCE($4, name),
          email = $5,
          phone = $6,
          company = $7,
          role = $8,
          lead_source = $9,
          notes = $10,
          updated_at = NOW()
        WHERE id = $1
      `,
      [
        leadId,
        stageId,
        assignedUserId,
        input.name ?? null,
        email,
        phone,
        company,
        role,
        leadSource,
        notes
      ]
    );

    await upsertCustomFieldValues(client, lead.workspace_id, leadId, customFieldValues);

    await logActivity(client, {
      workspaceId: lead.workspace_id,
      leadId,
      userId,
      action: "lead.updated",
      metadata: input
    });

    return {
      workspaceId: lead.workspace_id,
      stageId,
      previousStageId: lead.stage_id
    };
  });

  if (input.stageId && input.stageId !== result.previousStageId) {
    void triggerCampaignsForLead(leadId, userId).catch(() => undefined);
  }

  return getLeadById(userId, leadId);
};

export const deleteLead = async (userId: string, leadId: string) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { lead } = await fetchLeadForValidation(supabaseExecutorStub, leadId);
    await assertWorkspaceMembership(supabaseExecutorStub, userId, lead.workspace_id);

    const { error: deleteError } = await supabase.from("leads").delete().eq("id", leadId);
    throwIfSupabaseError(deleteError, "Lead deletion failed.");

    await logActivity(supabaseExecutorStub, {
      workspaceId: lead.workspace_id,
      leadId,
      userId,
      action: "lead.deleted"
    });

    return;
  }

  await withTransaction(async (client) => {
    const { lead } = await fetchLeadForValidation(client, leadId);
    await assertWorkspaceMembership(client, userId, lead.workspace_id);

    await client.query("DELETE FROM leads WHERE id = $1", [leadId]);

    await logActivity(client, {
      workspaceId: lead.workspace_id,
      leadId,
      userId,
      action: "lead.deleted"
    });
  });
};

const resolveCustomRequirement = async (
  executor: DatabaseExecutor,
  workspaceId: string,
  fieldName: string
) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("custom_fields")
      .select("id, name")
      .eq("workspace_id", workspaceId)
      .or(`id.eq.${fieldName},name.eq.${fieldName}`)
      .limit(1)
      .maybeSingle<{ id: string; name: string }>();

    throwIfSupabaseError(error, "Custom requirement lookup failed.");
    return data ?? null;
  }

  const result = await executor.query<{ id: string; name: string }>(
    `
      SELECT id, name
      FROM custom_fields
      WHERE workspace_id = $1 AND (id::text = $2 OR name = $2)
      LIMIT 1
    `,
    [workspaceId, fieldName]
  );

  return result.rows[0] ?? null;
};

const isFilled = (value: string | null | undefined) => Boolean(value && value.trim().length > 0);

export const validateLeadStageRequirements = async (
  executor: DatabaseExecutor,
  leadId: string,
  stageId: string
) => {
  const { lead, customValues } = await fetchLeadForValidation(executor, leadId);

  let requiredFieldsRows: RequiredFieldRow[];

  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("stage_required_fields")
      .select("field_name, is_custom_field")
      .eq("stage_id", stageId);

    throwIfSupabaseError(error, "Stage requirement lookup failed.");
    requiredFieldsRows = (data ?? []) as RequiredFieldRow[];
  } else {
    const requiredFieldsResult = await executor.query<RequiredFieldRow>(
      `
        SELECT field_name, is_custom_field
        FROM stage_required_fields
        WHERE stage_id = $1
      `,
      [stageId]
    );

    requiredFieldsRows = requiredFieldsResult.rows;
  }

  const missingFields: string[] = [];

  for (const requiredField of requiredFieldsRows) {
    if (requiredField.is_custom_field) {
      const customField = await resolveCustomRequirement(
        executor,
        lead.workspace_id,
        requiredField.field_name
      );

      const customValue = customField
        ? customValues.find((value) => value.custom_field_id === customField.id)
        : undefined;

      if (!customField || !isFilled(customValue?.value)) {
        missingFields.push(customField?.name ?? requiredField.field_name);
      }
    } else {
      const leadFieldValueMap: Record<string, string | null> = {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        role: lead.role,
        lead_source: lead.lead_source,
        leadSource: lead.lead_source,
        notes: lead.notes,
        assigned_user_id: lead.assigned_user_id
      };

      if (!isFilled(leadFieldValueMap[requiredField.field_name])) {
        missingFields.push(requiredField.field_name);
      }
    }
  }

  if (missingFields.length > 0) {
    throw new AppError("Required fields missing for target stage.", 400, {
      missingFields
    });
  }

  return lead;
};

export const moveLeadToStage = async (userId: string, leadId: string, stageId: string) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { lead } = await fetchLeadForValidation(supabaseExecutorStub, leadId);
    await assertWorkspaceMembership(supabaseExecutorStub, userId, lead.workspace_id);
    await findWorkspaceStage(supabaseExecutorStub, lead.workspace_id, stageId);
    await validateLeadStageRequirements(supabaseExecutorStub, leadId, stageId);

    const { error: updateError } = await supabase
      .from("leads")
      .update({ stage_id: stageId, updated_at: new Date().toISOString() })
      .eq("id", leadId);

    throwIfSupabaseError(updateError, "Lead stage update failed.");

    await logActivity(supabaseExecutorStub, {
      workspaceId: lead.workspace_id,
      leadId,
      userId,
      action: "lead.stage_changed",
      metadata: {
        fromStageId: lead.stage_id,
        toStageId: stageId
      }
    });

    void triggerCampaignsForLead(leadId, userId).catch(() => undefined);
    return getLeadById(userId, leadId);
  }

  await withTransaction(async (client) => {
    const { lead } = await fetchLeadForValidation(client, leadId);
    await assertWorkspaceMembership(client, userId, lead.workspace_id);
    await findWorkspaceStage(client, lead.workspace_id, stageId);
    await validateLeadStageRequirements(client, leadId, stageId);

    await client.query(
      `
        UPDATE leads
        SET stage_id = $2, updated_at = NOW()
        WHERE id = $1
      `,
      [leadId, stageId]
    );

    await logActivity(client, {
      workspaceId: lead.workspace_id,
      leadId,
      userId,
      action: "lead.stage_changed",
      metadata: {
        fromStageId: lead.stage_id,
        toStageId: stageId
      }
    });
  });

  void triggerCampaignsForLead(leadId, userId).catch(() => undefined);

  return getLeadById(userId, leadId);
};

export const getLeadMessages = async (userId: string, leadId: string) => {
  const lead = await getLeadById(userId, leadId);

  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("generated_messages")
      .select("id, campaign_id, messages, generated_at, sent_at")
      .eq("lead_id", leadId)
      .order("generated_at", { ascending: false });

    throwIfSupabaseError(error, "Lead message lookup failed.");

    return {
      leadId: lead.id,
      items: (data ?? []).map((item) => ({
        id: item.id,
        campaignId: item.campaign_id,
        messages: item.messages,
        generatedAt: item.generated_at,
        sentAt: item.sent_at
      }))
    };
  }

  const result = await query<{
    id: string;
    campaign_id: string;
    messages: string[];
    generated_at: string;
    sent_at: string | null;
  }>(
    `
      SELECT id, campaign_id, messages, generated_at, sent_at
      FROM generated_messages
      WHERE lead_id = $1
      ORDER BY generated_at DESC
    `,
    [leadId]
  );

  return {
    leadId: lead.id,
    items: result.rows.map((item) => ({
      id: item.id,
      campaignId: item.campaign_id,
      messages: item.messages,
      generatedAt: item.generated_at,
      sentAt: item.sent_at
    }))
  };
};
