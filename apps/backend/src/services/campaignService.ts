import { database, query, withTransaction } from "../db/helpers";
import { getSupabaseAdminClient, isSupabaseDataEnabled, throwIfSupabaseError } from "../db/supabase";
import { AppError } from "../errors/AppError";
import { logActivity } from "./activityLogService";
import { generateLeadMessages } from "./messageGenerationService";
import {
  assertWorkspaceAdminMembership,
  assertWorkspaceMembership
} from "./workspaceMembershipService";

type CampaignRow = {
  id: string;
  workspace_id: string;
  name: string;
  context: string;
  prompt: string;
  trigger_stage_id: string | null;
  is_active: boolean;
  created_at: string;
};

type LeadMessageContextRow = {
  id: string;
  workspace_id: string;
  name: string;
  company: string | null;
  role: string | null;
  phone: string | null;
  lead_source: string | null;
  notes: string | null;
};

type CustomFieldValueRow = {
  name: string;
  value: string | null;
};

const supabaseExecutorStub = { query: async () => ({ rows: [] } as never) };

const mapCampaign = (campaign: CampaignRow) => ({
  id: campaign.id,
  workspaceId: campaign.workspace_id,
  name: campaign.name,
  context: campaign.context,
  prompt: campaign.prompt,
  triggerStageId: campaign.trigger_stage_id,
  isActive: campaign.is_active,
  createdAt: campaign.created_at
});

const getCampaignByIdForUser = async (userId: string, campaignId: string) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select("id, workspace_id, name, context, prompt, trigger_stage_id, is_active, created_at")
      .eq("id", campaignId)
      .maybeSingle<CampaignRow>();

    throwIfSupabaseError(error, "Campaign lookup failed.");

    if (!campaign) {
      throw new AppError("Campaign not found.", 404);
    }

    await assertWorkspaceMembership(supabaseExecutorStub, userId, campaign.workspace_id);
    return campaign;
  }

  const result = await query<CampaignRow>(
    `
      SELECT id, workspace_id, name, context, prompt, trigger_stage_id, is_active, created_at
      FROM campaigns
      WHERE id = $1
    `,
    [campaignId]
  );

  const campaign = result.rows[0];

  if (!campaign) {
    throw new AppError("Campaign not found.", 404);
  }

  await assertWorkspaceMembership(database, userId, campaign.workspace_id);

  return campaign;
};

const getLeadContextForCampaign = async (leadId: string) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, workspace_id, name, company, role, phone, lead_source, notes")
      .eq("id", leadId)
      .maybeSingle<LeadMessageContextRow>();

    throwIfSupabaseError(leadError, "Lead lookup for campaign failed.");

    if (!lead) {
      throw new AppError("Lead not found.", 404);
    }

    const { data: customValueRows, error: valuesError } = await supabase
      .from("lead_custom_values")
      .select("custom_field_id, value")
      .eq("lead_id", leadId);

    throwIfSupabaseError(valuesError, "Lead custom value lookup failed.");

    const customFieldIds = Array.from(
      new Set((customValueRows ?? []).map((row) => row.custom_field_id))
    );

    let customFields: CustomFieldValueRow[] = [];

    if (customFieldIds.length > 0) {
      const { data: fields, error: fieldsError } = await supabase
        .from("custom_fields")
        .select("id, name")
        .in("id", customFieldIds)
        .order("name", { ascending: true });

      throwIfSupabaseError(fieldsError, "Campaign custom field lookup failed.");

      const fieldsById = new Map((fields ?? []).map((field) => [field.id, field]));
      customFields = (customValueRows ?? [])
        .map((row) => {
          const field = fieldsById.get(row.custom_field_id);

          if (!field) {
            return null;
          }

          return {
            name: field.name,
            value: row.value
          } satisfies CustomFieldValueRow;
        })
        .filter((row): row is CustomFieldValueRow => Boolean(row));
    }

    return { lead, customFields };
  }

  const leadResult = await query<LeadMessageContextRow>(
    `
      SELECT id, workspace_id, name, company, role, phone, lead_source, notes
      FROM leads
      WHERE id = $1
    `,
    [leadId]
  );

  const lead = leadResult.rows[0];

  if (!lead) {
    throw new AppError("Lead not found.", 404);
  }

  const customValuesResult = await query<CustomFieldValueRow>(
    `
      SELECT cf.name, lcv.value
      FROM lead_custom_values lcv
      INNER JOIN custom_fields cf ON cf.id = lcv.custom_field_id
      WHERE lcv.lead_id = $1
      ORDER BY cf.name ASC
    `,
    [leadId]
  );

  return {
    lead,
    customFields: customValuesResult.rows
  };
};

export const listCampaigns = async (userId: string, workspaceId: string) => {
  await assertWorkspaceMembership(database, userId, workspaceId);

  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("id, workspace_id, name, context, prompt, trigger_stage_id, is_active, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    throwIfSupabaseError(error, "Campaign list lookup failed.");
    return (data ?? []).map((campaign) => mapCampaign(campaign as CampaignRow));
  }

  const result = await query<CampaignRow>(
    `
      SELECT id, workspace_id, name, context, prompt, trigger_stage_id, is_active, created_at
      FROM campaigns
      WHERE workspace_id = $1
      ORDER BY created_at DESC
    `,
    [workspaceId]
  );

  return result.rows.map(mapCampaign);
};

export const createCampaign = async (
  userId: string,
  input: {
    workspaceId: string;
    name: string;
    context: string;
    prompt: string;
    triggerStageId?: string | null;
    isActive?: boolean;
  }
) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    await assertWorkspaceAdminMembership(supabaseExecutorStub, userId, input.workspaceId);

    if (input.triggerStageId) {
      const { data: stage, error: stageError } = await supabase
        .from("funnel_stages")
        .select("id")
        .eq("id", input.triggerStageId)
        .eq("workspace_id", input.workspaceId)
        .maybeSingle();

      throwIfSupabaseError(stageError, "Trigger stage lookup failed.");

      if (!stage) {
        throw new AppError("Trigger stage must belong to the workspace.", 400);
      }
    }

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        workspace_id: input.workspaceId,
        name: input.name,
        context: input.context,
        prompt: input.prompt,
        trigger_stage_id: input.triggerStageId ?? null,
        is_active: input.isActive ?? true
      })
      .select("id, workspace_id, name, context, prompt, trigger_stage_id, is_active, created_at")
      .single<CampaignRow>();

    throwIfSupabaseError(error, "Campaign creation failed.");

    if (!campaign) {
      throw new AppError("Campaign creation did not return a record.", 500);
    }

    await logActivity(supabaseExecutorStub, {
      workspaceId: input.workspaceId,
      userId,
      action: "campaign.created",
      metadata: {
        campaignId: campaign.id,
        name: campaign.name
      }
    });

    return mapCampaign(campaign);
  }

  return withTransaction(async (client) => {
    await assertWorkspaceAdminMembership(client, userId, input.workspaceId);

    if (input.triggerStageId) {
      const stageResult = await client.query(
        `
          SELECT 1
          FROM funnel_stages
          WHERE id = $1 AND workspace_id = $2
        `,
        [input.triggerStageId, input.workspaceId]
      );

      if (stageResult.rowCount === 0) {
        throw new AppError("Trigger stage must belong to the workspace.", 400);
      }
    }

    const result = await client.query<CampaignRow>(
      `
        INSERT INTO campaigns (workspace_id, name, context, prompt, trigger_stage_id, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, workspace_id, name, context, prompt, trigger_stage_id, is_active, created_at
      `,
      [
        input.workspaceId,
        input.name,
        input.context,
        input.prompt,
        input.triggerStageId ?? null,
        input.isActive ?? true
      ]
    );

    const campaign = result.rows[0];

    await logActivity(client, {
      workspaceId: input.workspaceId,
      userId,
      action: "campaign.created",
      metadata: {
        campaignId: campaign.id,
        name: campaign.name
      }
    });

    return mapCampaign(campaign);
  });
};

export const updateCampaign = async (
  userId: string,
  campaignId: string,
  input: Partial<{
    name: string;
    context: string;
    prompt: string;
    triggerStageId: string | null;
    isActive: boolean;
  }>
) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data: current, error: currentError } = await supabase
      .from("campaigns")
      .select("id, workspace_id, name, context, prompt, trigger_stage_id, is_active, created_at")
      .eq("id", campaignId)
      .maybeSingle<CampaignRow>();

    throwIfSupabaseError(currentError, "Campaign lookup failed.");

    if (!current) {
      throw new AppError("Campaign not found.", 404);
    }

    await assertWorkspaceAdminMembership(supabaseExecutorStub, userId, current.workspace_id);

    if (input.triggerStageId) {
      const { data: stage, error: stageError } = await supabase
        .from("funnel_stages")
        .select("id")
        .eq("id", input.triggerStageId)
        .eq("workspace_id", current.workspace_id)
        .maybeSingle();

      throwIfSupabaseError(stageError, "Trigger stage lookup failed.");

      if (!stage) {
        throw new AppError("Trigger stage must belong to the workspace.", 400);
      }
    }

    const updates: Record<string, unknown> = {};
    if (input.name !== undefined) updates.name = input.name;
    if (input.context !== undefined) updates.context = input.context;
    if (input.prompt !== undefined) updates.prompt = input.prompt;
    if (input.triggerStageId !== undefined) updates.trigger_stage_id = input.triggerStageId;
    if (input.isActive !== undefined) updates.is_active = input.isActive;

    const { data: updated, error: updateError } = await supabase
      .from("campaigns")
      .update(updates)
      .eq("id", campaignId)
      .select("id, workspace_id, name, context, prompt, trigger_stage_id, is_active, created_at")
      .single<CampaignRow>();

    throwIfSupabaseError(updateError, "Campaign update failed.");

    if (!updated) {
      throw new AppError("Campaign update did not return a record.", 500);
    }

    await logActivity(supabaseExecutorStub, {
      workspaceId: current.workspace_id,
      userId,
      action: "campaign.updated",
      metadata: {
        campaignId,
        updates: input
      }
    });

    return mapCampaign(updated);
  }

  return withTransaction(async (client) => {
    const currentResult = await client.query<CampaignRow>(
      `
        SELECT id, workspace_id, name, context, prompt, trigger_stage_id, is_active, created_at
        FROM campaigns
        WHERE id = $1
      `,
      [campaignId]
    );

    const current = currentResult.rows[0];

    if (!current) {
      throw new AppError("Campaign not found.", 404);
    }

    await assertWorkspaceAdminMembership(client, userId, current.workspace_id);

    if (input.triggerStageId) {
      const stageResult = await client.query(
        `
          SELECT 1
          FROM funnel_stages
          WHERE id = $1 AND workspace_id = $2
        `,
        [input.triggerStageId, current.workspace_id]
      );

      if (stageResult.rowCount === 0) {
        throw new AppError("Trigger stage must belong to the workspace.", 400);
      }
    }

    const result = await client.query<CampaignRow>(
      `
        UPDATE campaigns
        SET
          name = COALESCE($2, name),
          context = COALESCE($3, context),
          prompt = COALESCE($4, prompt),
          trigger_stage_id = $5,
          is_active = COALESCE($6, is_active)
        WHERE id = $1
        RETURNING id, workspace_id, name, context, prompt, trigger_stage_id, is_active, created_at
      `,
      [
        campaignId,
        input.name ?? null,
        input.context ?? null,
        input.prompt ?? null,
        input.triggerStageId === undefined ? current.trigger_stage_id : input.triggerStageId,
        input.isActive ?? null
      ]
    );

    await logActivity(client, {
      workspaceId: current.workspace_id,
      userId,
      action: "campaign.updated",
      metadata: {
        campaignId,
        updates: input
      }
    });

    return mapCampaign(result.rows[0]);
  });
};

export const generateCampaignMessages = async (
  userId: string,
  campaignId: string,
  leadId: string,
  reason: "manual" | "triggered" = "manual"
) => {
  const campaign = await getCampaignByIdForUser(userId, campaignId);
  const { lead, customFields } = await getLeadContextForCampaign(leadId);

  if (lead.workspace_id !== campaign.workspace_id) {
    throw new AppError("Lead and campaign must belong to the same workspace.", 400);
  }

  const generated = await generateLeadMessages({
    campaign: {
      context: campaign.context,
      prompt: campaign.prompt
    },
    lead: {
      name: lead.name,
      company: lead.company,
      role: lead.role,
      phone: lead.phone,
      leadSource: lead.lead_source,
      notes: lead.notes
    },
    customFields
  });

  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data: inserted, error: insertError } = await supabase
      .from("generated_messages")
      .insert({
        lead_id: leadId,
        campaign_id: campaignId,
        messages: generated.messages
      })
      .select("id, lead_id, campaign_id, messages, generated_at, sent_at")
      .single<{
        id: string;
        lead_id: string;
        campaign_id: string;
        messages: string[];
        generated_at: string;
        sent_at: string | null;
      }>();

    throwIfSupabaseError(insertError, "Generated message insert failed.");

    if (!inserted) {
      throw new AppError("Generated message insert did not return a record.", 500);
    }

    await logActivity(supabaseExecutorStub, {
      workspaceId: campaign.workspace_id,
      leadId,
      userId,
      action: "message.generated",
      metadata: {
        campaignId,
        provider: generated.provider,
        model: generated.model,
        reason
      }
    });

    return {
      id: inserted.id,
      leadId: inserted.lead_id,
      campaignId: inserted.campaign_id,
      messages: inserted.messages,
      generatedAt: inserted.generated_at,
      sentAt: inserted.sent_at,
      provider: generated.provider,
      model: generated.model
    };
  }

  const result = await withTransaction(async (client) => {
    const insertResult = await client.query<{
      id: string;
      lead_id: string;
      campaign_id: string;
      messages: string[];
      generated_at: string;
      sent_at: string | null;
    }>(
      `
        INSERT INTO generated_messages (lead_id, campaign_id, messages)
        VALUES ($1, $2, $3::jsonb)
        RETURNING id, lead_id, campaign_id, messages, generated_at, sent_at
      `,
      [leadId, campaignId, JSON.stringify(generated.messages)]
    );

    await logActivity(client, {
      workspaceId: campaign.workspace_id,
      leadId,
      userId,
      action: "message.generated",
      metadata: {
        campaignId,
        provider: generated.provider,
        model: generated.model,
        reason
      }
    });

    return insertResult.rows[0];
  });

  return {
    id: result.id,
    leadId: result.lead_id,
    campaignId: result.campaign_id,
    messages: result.messages,
    generatedAt: result.generated_at,
    sentAt: result.sent_at,
    provider: generated.provider,
    model: generated.model
  };
};

export const triggerCampaignsForLead = async (leadId: string, userId: string) => {
  let lead: { id: string; workspace_id: string; stage_id: string } | null = null;

  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("leads")
      .select("id, workspace_id, stage_id")
      .eq("id", leadId)
      .maybeSingle<{ id: string; workspace_id: string; stage_id: string }>();

    throwIfSupabaseError(error, "Lead lookup for trigger failed.");
    lead = data ?? null;
  } else {
    const leadResult = await query<{ id: string; workspace_id: string; stage_id: string }>(
      `
        SELECT id, workspace_id, stage_id
        FROM leads
        WHERE id = $1
      `,
      [leadId]
    );

    lead = leadResult.rows[0] ?? null;
  }

  if (!lead) {
    return;
  }

  let campaigns: CampaignRow[] = [];

  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("campaigns")
      .select("id, workspace_id, name, context, prompt, trigger_stage_id, is_active, created_at")
      .eq("workspace_id", lead.workspace_id)
      .eq("trigger_stage_id", lead.stage_id)
      .eq("is_active", true);

    throwIfSupabaseError(error, "Triggered campaign lookup failed.");
    campaigns = (data ?? []) as CampaignRow[];
  } else {
    const campaignsResult = await query<CampaignRow>(
      `
        SELECT id, workspace_id, name, context, prompt, trigger_stage_id, is_active, created_at
        FROM campaigns
        WHERE workspace_id = $1 AND trigger_stage_id = $2 AND is_active = TRUE
      `,
      [lead.workspace_id, lead.stage_id]
    );

    campaigns = campaignsResult.rows;
  }

  for (const campaign of campaigns) {
    try {
      await generateCampaignMessages(userId, campaign.id, leadId, "triggered");
    } catch (error) {
      await logActivity(supabaseExecutorStub, {
        workspaceId: lead.workspace_id,
        leadId,
        userId,
        action: "message.generation_failed",
        metadata: {
          campaignId: campaign.id,
          error: error instanceof Error ? error.message : "Unknown error"
        }
      });
    }
  }
};

export const sendLeadMessage = async (
  userId: string,
  leadId: string,
  generatedMessageId?: string | null
) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("id, workspace_id, stage_id")
      .eq("id", leadId)
      .maybeSingle<{ id: string; workspace_id: string; stage_id: string }>();

    throwIfSupabaseError(leadError, "Lead lookup for send failed.");

    if (!lead) {
      throw new AppError("Lead not found.", 404);
    }

    await assertWorkspaceMembership(supabaseExecutorStub, userId, lead.workspace_id);

    const messageQuery = supabase
      .from("generated_messages")
      .select("id, messages")
      .eq("lead_id", leadId);

    const { data: message, error: messageError } = generatedMessageId
      ? await messageQuery.eq("id", generatedMessageId).maybeSingle<{ id: string; messages: string[] }>()
      : await messageQuery
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle<{ id: string; messages: string[] }>();

    throwIfSupabaseError(messageError, "Generated message lookup failed.");

    if (!message) {
      throw new AppError("No generated message available for this lead.", 404);
    }

    const { error: sentError } = await supabase
      .from("generated_messages")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", message.id);

    throwIfSupabaseError(sentError, "Generated message send mark failed.");

    const { data: targetStage, error: stageError } = await supabase
      .from("funnel_stages")
      .select("id")
      .eq("workspace_id", lead.workspace_id)
      .eq("name", "Tentando Contato")
      .order("order", { ascending: true })
      .limit(1)
      .maybeSingle<{ id: string }>();

    throwIfSupabaseError(stageError, 'Target stage lookup failed for "Tentando Contato".');

    if (!targetStage) {
      throw new AppError('Stage "Tentando Contato" not found for this workspace.', 404);
    }

    const { error: leadUpdateError } = await supabase
      .from("leads")
      .update({ stage_id: targetStage.id, updated_at: new Date().toISOString() })
      .eq("id", leadId);

    throwIfSupabaseError(leadUpdateError, "Lead stage move after send failed.");

    await logActivity(supabaseExecutorStub, {
      workspaceId: lead.workspace_id,
      leadId,
      userId,
      action: "message.sent",
      metadata: {
        generatedMessageId: message.id,
        movedToStageId: targetStage.id
      }
    });

    return {
      generatedMessageId: message.id,
      movedToStageId: targetStage.id
    };
  }

  return withTransaction(async (client) => {
    const leadResult = await client.query<{
      id: string;
      workspace_id: string;
      stage_id: string;
    }>(
      `
        SELECT id, workspace_id, stage_id
        FROM leads
        WHERE id = $1
      `,
      [leadId]
    );

    const lead = leadResult.rows[0];

    if (!lead) {
      throw new AppError("Lead not found.", 404);
    }

    await assertWorkspaceMembership(client, userId, lead.workspace_id);

    const messageResult = generatedMessageId
      ? await client.query<{
          id: string;
          messages: string[];
        }>(
          `
            SELECT id, messages
            FROM generated_messages
            WHERE id = $1 AND lead_id = $2
          `,
          [generatedMessageId, leadId]
        )
      : await client.query<{
          id: string;
          messages: string[];
        }>(
          `
            SELECT id, messages
            FROM generated_messages
            WHERE lead_id = $1
            ORDER BY generated_at DESC
            LIMIT 1
          `,
          [leadId]
        );

    const message = messageResult.rows[0];

    if (!message) {
      throw new AppError("No generated message available for this lead.", 404);
    }

    await client.query(
      `
        UPDATE generated_messages
        SET sent_at = NOW()
        WHERE id = $1
      `,
      [message.id]
    );

    const stageResult = await client.query<{ id: string }>(
      `
        SELECT id
        FROM funnel_stages
        WHERE workspace_id = $1 AND name = 'Tentando Contato'
        ORDER BY "order" ASC
        LIMIT 1
      `,
      [lead.workspace_id]
    );

    const targetStage = stageResult.rows[0];

    if (!targetStage) {
      throw new AppError('Stage "Tentando Contato" not found for this workspace.', 404);
    }

    await client.query(
      `
        UPDATE leads
        SET stage_id = $2, updated_at = NOW()
        WHERE id = $1
      `,
      [leadId, targetStage.id]
    );

    await logActivity(client, {
      workspaceId: lead.workspace_id,
      leadId,
      userId,
      action: "message.sent",
      metadata: {
        generatedMessageId: message.id,
        movedToStageId: targetStage.id
      }
    });

    return {
      generatedMessageId: message.id,
      movedToStageId: targetStage.id
    };
  });
};
