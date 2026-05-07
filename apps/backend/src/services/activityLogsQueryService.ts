import { AppError } from "../errors/AppError";
import { database, query } from "../db/helpers";
import { assertWorkspaceMembership } from "./workspaceMembershipService";

export const listActivityLogs = async (
  userId: string,
  filters: { workspaceId?: string; leadId?: string }
) => {
  if (!filters.workspaceId && !filters.leadId) {
    throw new AppError("workspace_id or lead_id is required.", 400);
  }

  let workspaceId = filters.workspaceId ?? null;

  if (!workspaceId && filters.leadId) {
    const lookup = await query<{ workspace_id: string }>(
      `
        SELECT workspace_id
        FROM leads
        WHERE id = $1
      `,
      [filters.leadId]
    );

    workspaceId = lookup.rows[0]?.workspace_id ?? null;
  }

  if (!workspaceId) {
    throw new AppError("Workspace not found for activity log query.", 404);
  }

  await assertWorkspaceMembership(database, userId, workspaceId);

  const conditions = ["workspace_id = $1"];
  const values: unknown[] = [workspaceId];

  if (filters.leadId) {
    values.push(filters.leadId);
    conditions.push(`lead_id = $${values.length}`);
  }

  const result = await query<{
    id: string;
    lead_id: string | null;
    workspace_id: string;
    user_id: string | null;
    action: string;
    metadata: unknown;
    created_at: string;
    actor_name: string | null;
    actor_email: string | null;
  }>(
    `
      SELECT
        al.id,
        al.lead_id,
        al.workspace_id,
        al.user_id,
        al.action,
        al.metadata,
        al.created_at,
        u.name AS actor_name,
        u.email AS actor_email
      FROM activity_logs al
      LEFT JOIN users u ON u.id = al.user_id
      WHERE ${conditions.join(" AND ")}
      ORDER BY al.created_at DESC
    `,
    values
  );

  return result.rows.map((item) => ({
    id: item.id,
    leadId: item.lead_id,
    workspaceId: item.workspace_id,
    userId: item.user_id,
    action: item.action,
    metadata: item.metadata,
    createdAt: item.created_at,
    actor:
      item.user_id && item.actor_name && item.actor_email
        ? {
            id: item.user_id,
            name: item.actor_name,
            email: item.actor_email
          }
        : null
  }));
};
