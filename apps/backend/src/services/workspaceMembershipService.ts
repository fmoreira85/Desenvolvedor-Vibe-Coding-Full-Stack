import type { DatabaseExecutor } from "../db/helpers";
import { AppError } from "../errors/AppError";
import type { WorkspaceRole } from "../types/domain";

type WorkspaceMembershipRow = {
  workspace_id: string;
  role: WorkspaceRole;
};

export const assertWorkspaceMembership = async (
  executor: DatabaseExecutor,
  userId: string,
  workspaceId: string
) => {
  const result = await executor.query<WorkspaceMembershipRow>(
    `
      SELECT workspace_id, role
      FROM workspace_members
      WHERE workspace_id = $1 AND user_id = $2
    `,
    [workspaceId, userId]
  );

  const membership = result.rows[0];

  if (!membership) {
    throw new AppError("Workspace access denied.", 403);
  }

  return membership;
};

export const assertWorkspaceAdminMembership = async (
  executor: DatabaseExecutor,
  userId: string,
  workspaceId: string
) => {
  const membership = await assertWorkspaceMembership(executor, userId, workspaceId);

  if (membership.role !== "admin") {
    throw new AppError("Admin access required for this workspace.", 403);
  }

  return membership;
};

export const assertAssignableWorkspaceMember = async (
  executor: DatabaseExecutor,
  workspaceId: string,
  userId: string
) => {
  const result = await executor.query(
    `
      SELECT 1
      FROM workspace_members
      WHERE workspace_id = $1 AND user_id = $2
    `,
    [workspaceId, userId]
  );

  if (result.rowCount === 0) {
    throw new AppError("Assigned user must belong to the same workspace.", 400);
  }
};
