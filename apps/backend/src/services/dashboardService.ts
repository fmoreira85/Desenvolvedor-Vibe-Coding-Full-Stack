import { database, query } from "../db/helpers";
import { getSupabaseAdminClient, isSupabaseDataEnabled, throwIfSupabaseError } from "../db/supabase";
import { assertWorkspaceMembership } from "./workspaceMembershipService";

const supabaseExecutorStub = { query: async () => ({ rows: [] } as never) };

type WeeklyLeadPoint = {
  weekLabel: string;
  count: number;
};

const startOfWeek = (value: Date) => {
  const date = new Date(value);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const buildWeeklyLeadSeries = (createdAtValues: string[]) => {
  const currentWeekStart = startOfWeek(new Date());
  const buckets = new Map<string, WeeklyLeadPoint>();

  for (let index = 7; index >= 0; index -= 1) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - index * 7);
    const key = weekStart.toISOString();
    buckets.set(key, {
      weekLabel: `Sem ${8 - index}`,
      count: 0
    });
  }

  for (const createdAt of createdAtValues) {
    const weekStart = startOfWeek(new Date(createdAt)).toISOString();
    const bucket = buckets.get(weekStart);
    if (bucket) {
      bucket.count += 1;
    }
  }

  return Array.from(buckets.values());
};

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
      supabase
        .from("leads")
        .select("id, stage_id, assigned_user_id, name, company, created_at")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
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

    const stageById = new Map((stages ?? []).map((stage) => [stage.id, stage]));
    const assignedUserIds = Array.from(
      new Set((leads ?? []).map((lead) => lead.assigned_user_id).filter(Boolean) as string[])
    );
    const { data: users, error: usersError } =
      assignedUserIds.length > 0
        ? await supabase.from("users").select("id, name, email").in("id", assignedUserIds)
        : { data: [], error: null };

    throwIfSupabaseError(usersError, "Dashboard assigned user lookup failed.");

    const usersById = new Map((users ?? []).map((user) => [user.id, user]));
    const leadsCreatedByWeek = buildWeeklyLeadSeries((leads ?? []).map((lead) => lead.created_at));
    const recentLeads = (leads ?? []).slice(0, 5).map((lead) => {
      const stage = stageById.get(lead.stage_id);
      const assignedUser = lead.assigned_user_id ? usersById.get(lead.assigned_user_id) ?? null : null;

      return {
        id: lead.id,
        name: lead.name,
        company: lead.company,
        createdAt: lead.created_at,
        stage: {
          id: lead.stage_id,
          name: stage?.name ?? "Etapa",
          color: stage?.color ?? "#94A3B8"
        },
        assignedUser: assignedUser
          ? {
              id: assignedUser.id,
              name: assignedUser.name,
              email: assignedUser.email
            }
          : null
      };
    });

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
      })),
      leadsCreatedByWeek,
      recentLeads
    };
  }

  const [totalsResult, stagesResult, weeklyLeadsResult, recentLeadsResult] = await Promise.all([
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
    ),
    query<{
      week_start: string;
      leads_count: string;
    }>(
      `
        WITH weeks AS (
          SELECT generate_series(
            date_trunc('week', CURRENT_DATE) - interval '7 weeks',
            date_trunc('week', CURRENT_DATE),
            interval '1 week'
          ) AS week_start
        )
        SELECT
          weeks.week_start::text,
          COUNT(l.id)::text AS leads_count
        FROM weeks
        LEFT JOIN leads l
          ON date_trunc('week', l.created_at) = weeks.week_start
         AND l.workspace_id = $1
        GROUP BY weeks.week_start
        ORDER BY weeks.week_start ASC
      `,
      [workspaceId]
    ),
    query<{
      id: string;
      name: string;
      company: string | null;
      created_at: string;
      stage_id: string;
      stage_name: string;
      stage_color: string;
      assigned_user_id: string | null;
      assigned_user_name: string | null;
      assigned_user_email: string | null;
    }>(
      `
        SELECT
          l.id,
          l.name,
          l.company,
          l.created_at,
          fs.id AS stage_id,
          fs.name AS stage_name,
          fs.color AS stage_color,
          assigned_user.id AS assigned_user_id,
          assigned_user.name AS assigned_user_name,
          assigned_user.email AS assigned_user_email
        FROM leads l
        INNER JOIN funnel_stages fs ON fs.id = l.stage_id
        LEFT JOIN users assigned_user ON assigned_user.id = l.assigned_user_id
        WHERE l.workspace_id = $1
        ORDER BY l.created_at DESC
        LIMIT 5
      `,
      [workspaceId]
    )
  ]);

  const totals = totalsResult.rows[0];
  const leadsCreatedByWeek = weeklyLeadsResult.rows.map((row, index) => ({
    weekLabel: `Sem ${index + 1}`,
    count: Number(row.leads_count)
  }));
  const recentLeads = recentLeadsResult.rows.map((lead) => ({
    id: lead.id,
    name: lead.name,
    company: lead.company,
    createdAt: lead.created_at,
    stage: {
      id: lead.stage_id,
      name: lead.stage_name,
      color: lead.stage_color
    },
    assignedUser:
      lead.assigned_user_id && lead.assigned_user_name && lead.assigned_user_email
        ? {
            id: lead.assigned_user_id,
            name: lead.assigned_user_name,
            email: lead.assigned_user_email
          }
        : null
  }));

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
    })),
    leadsCreatedByWeek,
    recentLeads
  };
};
