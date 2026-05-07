import { withTransaction } from "../db/helpers";
import { AppError } from "../errors/AppError";
import { logActivity } from "./activityLogService";
import { ensureDefaultStagesForWorkspace } from "./defaultStagesService";
import {
  assertWorkspaceAdminMembership,
  assertWorkspaceMembership
} from "./workspaceMembershipService";

type WorkspaceRow = {
  id: string;
  name: string;
  created_at: string;
  role: "admin" | "member";
};

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
