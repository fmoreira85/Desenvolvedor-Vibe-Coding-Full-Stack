import { database, query, withTransaction } from "../db/helpers";
import type { DatabaseExecutor } from "../db/helpers";
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

const fetchLeadRows = async (
  executor: DatabaseExecutor,
  whereClause: string,
  values: unknown[]
) => {
  return executor.query<LeadBaseRow>(
    `
      SELECT
        l.id,
        l.workspace_id,
        l.stage_id,
        l.assigned_user_id,
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
      ${whereClause}
      ORDER BY l.updated_at DESC, l.created_at DESC
    `,
    values
  );
};

const fetchCustomValues = async (executor: DatabaseExecutor, leadIds: string[]) => {
  if (leadIds.length === 0) {
    return [];
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

const findWorkspaceStage = async (
  executor: DatabaseExecutor,
  workspaceId: string,
  stageId: string
) => {
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
  const leadResult = await fetchLeadRows(executor, "WHERE l.id = $1", [leadId]);
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

  const conditions = ["l.workspace_id = $1"];
  const values: unknown[] = [filters.workspaceId];

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

  const leadResult = await fetchLeadRows(database, `WHERE ${conditions.join(" AND ")}`, values);
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

  const nextStageId = await withTransaction(async (client) => {
    const { lead } = await fetchLeadForValidation(client, leadId);
    await assertWorkspaceMembership(client, userId, lead.workspace_id);

    if (input.stageId) {
      await findWorkspaceStage(client, lead.workspace_id, input.stageId);
    }

    if (input.assignedUserId) {
      await assertAssignableWorkspaceMember(client, lead.workspace_id, input.assignedUserId);
    }

    const stageId = input.stageId ?? lead.stage_id;

    await client.query(
      `
        UPDATE leads
        SET
          stage_id = COALESCE($2, stage_id),
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
        input.stageId ?? null,
        input.assignedUserId ?? lead.assigned_user_id,
        input.name ?? null,
        input.email ?? lead.email,
        input.phone ?? lead.phone,
        input.company ?? lead.company,
        input.role ?? lead.role,
        input.leadSource ?? lead.lead_source,
        input.notes ?? lead.notes
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
      stageId
    };
  });

  if (input.stageId) {
    void triggerCampaignsForLead(leadId, userId).catch(() => undefined);
  }

  return getLeadById(userId, leadId);
};

export const deleteLead = async (userId: string, leadId: string) => {
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

  const requiredFieldsResult = await executor.query<RequiredFieldRow>(
    `
      SELECT field_name, is_custom_field
      FROM stage_required_fields
      WHERE stage_id = $1
    `,
    [stageId]
  );

  const missingFields: string[] = [];

  for (const requiredField of requiredFieldsResult.rows) {
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
