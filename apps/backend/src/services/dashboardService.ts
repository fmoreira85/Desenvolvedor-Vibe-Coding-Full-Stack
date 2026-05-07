import { database, query } from "../db/helpers";
import { assertWorkspaceMembership } from "./workspaceMembershipService";

export const getDashboardMetrics = async (userId: string, workspaceId: string) => {
  await assertWorkspaceMembership(database, userId, workspaceId);

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
