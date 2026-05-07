import { database, query, withTransaction } from "../db/helpers";
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
  const leadResult = await query<{ id: string; workspace_id: string; stage_id: string }>(
    `
      SELECT id, workspace_id, stage_id
      FROM leads
      WHERE id = $1
    `,
    [leadId]
  );

  const lead = leadResult.rows[0];

  if (!lead) {
    return;
  }

  const campaignsResult = await query<CampaignRow>(
    `
      SELECT id, workspace_id, name, context, prompt, trigger_stage_id, is_active, created_at
      FROM campaigns
      WHERE workspace_id = $1 AND trigger_stage_id = $2 AND is_active = TRUE
    `,
    [lead.workspace_id, lead.stage_id]
  );

  for (const campaign of campaignsResult.rows) {
    try {
      await generateCampaignMessages(userId, campaign.id, leadId, "triggered");
    } catch (error) {
      await withTransaction(async (client) => {
        await logActivity(client, {
          workspaceId: lead.workspace_id,
          leadId,
          userId,
          action: "message.generation_failed",
          metadata: {
            campaignId: campaign.id,
            error: error instanceof Error ? error.message : "Unknown error"
          }
        });
      });
    }
  }
};

export const sendLeadMessage = async (
  userId: string,
  leadId: string,
  generatedMessageId?: string | null
) => {
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
