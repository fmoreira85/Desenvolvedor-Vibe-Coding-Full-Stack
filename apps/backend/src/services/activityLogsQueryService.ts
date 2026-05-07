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
  }>(
    `
      SELECT id, lead_id, workspace_id, user_id, action, metadata, created_at
      FROM activity_logs
      WHERE ${conditions.join(" AND ")}
      ORDER BY created_at DESC
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
    createdAt: item.created_at
  }));
};
