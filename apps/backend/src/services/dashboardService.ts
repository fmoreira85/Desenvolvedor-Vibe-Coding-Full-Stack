import { database, query } from "../db/helpers";
import { getSupabaseAdminClient, isSupabaseDataEnabled, throwIfSupabaseError } from "../db/supabase";
import { assertWorkspaceMembership } from "./workspaceMembershipService";

const supabaseExecutorStub = { query: async () => ({ rows: [] } as never) };

export const getDashboardMetrics = async (userId: string, workspaceId: string) => {
  await assertWorkspaceMembership(database, userId, workspaceId);

  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();

    const [
      { count: totalLeads, error: totalLeadsError },
      { count: totalCampaigns, error: totalCampaignsError },
      { data: generatedMessages, error: generatedMessagesError },
      { data: stages, error: stagesError },
      { data: leads, error: leadsError }
    ] = await Promise.all([
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase
        .from("campaigns")
        .select("id", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      supabase
        .from("generated_messages")
        .select("id, sent_at, lead_id"),
      supabase
        .from("funnel_stages")
        .select("id, name, order, color")
        .eq("workspace_id", workspaceId)
        .order("order", { ascending: true }),
      supabase.from("leads").select("id, stage_id").eq("workspace_id", workspaceId)
    ]);

    throwIfSupabaseError(totalLeadsError, "Dashboard lead count failed.");
    throwIfSupabaseError(totalCampaignsError, "Dashboard campaign count failed.");
    throwIfSupabaseError(generatedMessagesError, "Dashboard generated message lookup failed.");
    throwIfSupabaseError(stagesError, "Dashboard stage lookup failed.");
    throwIfSupabaseError(leadsError, "Dashboard lead stage lookup failed.");

    const workspaceLeadIds = new Set((leads ?? []).map((lead) => lead.id));
    const filteredMessages = (generatedMessages ?? []).filter((message) =>
      workspaceLeadIds.has(message.lead_id)
    );
    const leadCountsByStage = new Map<string, number>();

    for (const lead of leads ?? []) {
      leadCountsByStage.set(lead.stage_id, (leadCountsByStage.get(lead.stage_id) ?? 0) + 1);
    }

    return {
      workspaceId,
      totalLeads: totalLeads ?? 0,
      totalCampaigns: totalCampaigns ?? 0,
      totalGeneratedMessages: filteredMessages.length,
      totalSentMessages: filteredMessages.filter((message) => Boolean(message.sent_at)).length,
      leadsByStage: (stages ?? []).map((stage) => ({
        stageId: stage.id,
        name: stage.name,
        order: stage.order,
        color: stage.color,
        count: leadCountsByStage.get(stage.id) ?? 0
      }))
    };
  }

  const [totalsResult, stagesResult] = await Promise.all([
    query<{
      total_leads: string;
      total_campaigns: string;
      total_generated_messages: string;
      total_sent_messages: string;
    }>(
      `
        SELECT
          (SELECT COUNT(*)::text FROM leads WHERE workspace_id = $1) AS total_leads,
          (SELECT COUNT(*)::text FROM campaigns WHERE workspace_id = $1) AS total_campaigns,
          (
            SELECT COUNT(*)::text
            FROM generated_messages gm
            INNER JOIN leads l ON l.id = gm.lead_id
            WHERE l.workspace_id = $1
          ) AS total_generated_messages,
          (
            SELECT COUNT(*)::text
            FROM generated_messages gm
            INNER JOIN leads l ON l.id = gm.lead_id
            WHERE l.workspace_id = $1 AND gm.sent_at IS NOT NULL
          ) AS total_sent_messages
      `,
      [workspaceId]
    ),
    query<{
      stage_id: string;
      stage_name: string;
      stage_order: number;
      color: string;
      leads_count: string;
    }>(
      `
        SELECT
          fs.id AS stage_id,
          fs.name AS stage_name,
          fs."order" AS stage_order,
          fs.color,
          COUNT(l.id)::text AS leads_count
        FROM funnel_stages fs
        LEFT JOIN leads l ON l.stage_id = fs.id
        WHERE fs.workspace_id = $1
        GROUP BY fs.id, fs.name, fs."order", fs.color
        ORDER BY fs."order" ASC
      `,
      [workspaceId]
    )
  ]);

  const totals = totalsResult.rows[0];

  return {
    workspaceId,
    totalLeads: Number(totals.total_leads),
    totalCampaigns: Number(totals.total_campaigns),
    totalGeneratedMessages: Number(totals.total_generated_messages),
    totalSentMessages: Number(totals.total_sent_messages),
    leadsByStage: stagesResult.rows.map((stage) => ({
      stageId: stage.stage_id,
      name: stage.stage_name,
      order: stage.stage_order,
      color: stage.color,
      count: Number(stage.leads_count)
    }))
  };
};
