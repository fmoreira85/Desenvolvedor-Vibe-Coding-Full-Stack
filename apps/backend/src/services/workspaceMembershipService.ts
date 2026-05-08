import type { DatabaseExecutor } from "../db/helpers";
import { getSupabaseAdminClient, isSupabaseDataEnabled, throwIfSupabaseError } from "../db/supabase";
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
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("workspace_members")
      .select("workspace_id, role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle<WorkspaceMembershipRow>();

    throwIfSupabaseError(error, "Workspace access lookup failed.");

    if (!data) {
      throw new AppError("Workspace access denied.", 403);
    }

    return data;
  }

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
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();

    throwIfSupabaseError(error, "Assignable member lookup failed.");

    if (!data) {
      throw new AppError("Assigned user must belong to the same workspace.", 400);
    }

    return;
  }

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
