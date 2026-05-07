import { withTransaction } from "../db/helpers";
import { AppError } from "../errors/AppError";
import { logActivity } from "./activityLogService";
import { ensureDefaultStagesForWorkspace } from "./defaultStagesService";
import {
  assertWorkspaceAdminMembership,
  assertWorkspaceMembership
} from "./workspaceMembershipService";
import type { WorkspaceRole } from "../types/domain";

type WorkspaceRow = {
  id: string;
  name: string;
  created_at: string;
  role: "admin" | "member";
};

type WorkspaceMemberRow = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
  user_name: string;
  user_email: string;
};

const mapWorkspaceMember = (member: WorkspaceMemberRow) => ({
  id: member.id,
  workspaceId: member.workspace_id,
  userId: member.user_id,
  role: member.role,
  createdAt: member.created_at,
  name: member.user_name,
  email: member.user_email
});

export const listUserWorkspaces = async (userId: string) => {
  const result = await withTransaction(async (client) => {
    return client.query<WorkspaceRow>(
      `
        SELECT w.id, w.name, w.created_at, wm.role
        FROM workspaces w
        INNER JOIN workspace_members wm ON wm.workspace_id = w.id
        WHERE wm.user_id = $1
        ORDER BY w.created_at ASC
      `,
      [userId]
    );
  });

  return result.rows.map((workspace) => ({
    id: workspace.id,
    name: workspace.name,
    createdAt: workspace.created_at,
    role: workspace.role
  }));
};

export const createWorkspace = async (userId: string, name: string) => {
  return withTransaction(async (client) => {
    const workspaceResult = await client.query<Pick<WorkspaceRow, "id" | "name" | "created_at">>(
      `
        INSERT INTO workspaces (name)
        VALUES ($1)
        RETURNING id, name, created_at
      `,
      [name]
    );

    const workspace = workspaceResult.rows[0];

    await client.query(
      `
        INSERT INTO workspace_members (workspace_id, user_id, role)
        VALUES ($1, $2, 'admin')
      `,
      [workspace.id, userId]
    );

    await ensureDefaultStagesForWorkspace(client, workspace.id);

    await logActivity(client, {
      workspaceId: workspace.id,
      userId,
      action: "workspace.created",
      metadata: {
        name: workspace.name
      }
    });

    return {
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.created_at,
      role: "admin" as const
    };
  });
};

export const getWorkspaceById = async (userId: string, workspaceId: string) => {
  return withTransaction(async (client) => {
    await assertWorkspaceMembership(client, userId, workspaceId);

    const result = await client.query<Pick<WorkspaceRow, "id" | "name" | "created_at">>(
      `
        SELECT id, name, created_at
        FROM workspaces
        WHERE id = $1
      `,
      [workspaceId]
    );

    const workspace = result.rows[0];

    if (!workspace) {
      throw new AppError("Workspace not found.", 404);
    }

    return {
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.created_at
    };
  });
};

export const listWorkspaceMembers = async (userId: string, workspaceId: string) => {
  return withTransaction(async (client) => {
    await assertWorkspaceMembership(client, userId, workspaceId);

    const result = await client.query<WorkspaceMemberRow>(
      `
        SELECT
          wm.id,
          wm.workspace_id,
          wm.user_id,
          wm.role,
          wm.created_at,
          u.name AS user_name,
          u.email AS user_email
        FROM workspace_members wm
        INNER JOIN users u ON u.id = wm.user_id
        WHERE wm.workspace_id = $1
        ORDER BY CASE WHEN wm.role = 'admin' THEN 0 ELSE 1 END, u.name ASC
      `,
      [workspaceId]
    );

    return result.rows.map(mapWorkspaceMember);
  });
};

export const inviteWorkspaceMember = async (
  userId: string,
  workspaceId: string,
  input: { email: string; role: WorkspaceRole }
) => {
  return withTransaction(async (client) => {
    await assertWorkspaceAdminMembership(client, userId, workspaceId);

    const userResult = await client.query<{ id: string; name: string; email: string }>(
      `
        SELECT id, name, email
        FROM users
        WHERE LOWER(email) = LOWER($1)
      `,
      [input.email]
    );

    const invitedUser = userResult.rows[0];

    if (!invitedUser) {
      throw new AppError(
        "User with this email was not found. Ask them to register first.",
        404
      );
    }

    const existingMembershipResult = await client.query<{ id: string; role: WorkspaceRole }>(
      `
        SELECT id, role
        FROM workspace_members
        WHERE workspace_id = $1 AND user_id = $2
      `,
      [workspaceId, invitedUser.id]
    );

    const existingMembership = existingMembershipResult.rows[0] ?? null;

    const membershipResult = await client.query<WorkspaceMemberRow>(
      `
        INSERT INTO workspace_members (workspace_id, user_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (workspace_id, user_id)
        DO UPDATE SET role = EXCLUDED.role
        RETURNING
          id,
          workspace_id,
          user_id,
          role,
          created_at,
          $4::text AS user_name,
          $5::text AS user_email
      `,
      [workspaceId, invitedUser.id, input.role, invitedUser.name, invitedUser.email]
    );

    await logActivity(client, {
      workspaceId,
      userId,
      action:
        existingMembership && existingMembership.role !== input.role
          ? "workspace.member_role_updated"
          : "workspace.member_invited",
      metadata: {
        invitedUserId: invitedUser.id,
        email: invitedUser.email,
        role: input.role,
        previousRole: existingMembership?.role ?? null
      }
    });

    return mapWorkspaceMember(membershipResult.rows[0]);
  });
};

export const updateWorkspace = async (userId: string, workspaceId: string, name: string) => {
  return withTransaction(async (client) => {
    await assertWorkspaceAdminMembership(client, userId, workspaceId);

    const result = await client.query<Pick<WorkspaceRow, "id" | "name" | "created_at">>(
      `
        UPDATE workspaces
        SET name = $2
        WHERE id = $1
        RETURNING id, name, created_at
      `,
      [workspaceId, name]
    );

    const workspace = result.rows[0];

    if (!workspace) {
      throw new AppError("Workspace not found.", 404);
    }

    await logActivity(client, {
      workspaceId,
      userId,
      action: "workspace.updated",
      metadata: { name }
    });

    return {
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.created_at
    };
  });
};

export const deleteWorkspace = async (userId: string, workspaceId: string) => {
  return withTransaction(async (client) => {
    await assertWorkspaceAdminMembership(client, userId, workspaceId);

    const result = await client.query(
      `
        DELETE FROM workspaces
        WHERE id = $1
      `,
      [workspaceId]
    );

    if (result.rowCount === 0) {
      throw new AppError("Workspace not found.", 404);
    }
  });
};
