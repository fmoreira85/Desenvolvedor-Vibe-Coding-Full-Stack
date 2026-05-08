import { withTransaction } from "../db/helpers";
import { getSupabaseAdminClient, isSupabaseDataEnabled, throwIfSupabaseError } from "../db/supabase";
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

type WorkspaceBaseRow = Pick<WorkspaceRow, "id" | "name" | "created_at">;

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

const mapWorkspace = (workspace: WorkspaceBaseRow, role?: WorkspaceRole) => ({
  id: workspace.id,
  name: workspace.name,
  createdAt: workspace.created_at,
  ...(role ? { role } : {})
});

export const listUserWorkspaces = async (userId: string) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data: memberships, error: membershipError } = await supabase
      .from("workspace_members")
      .select("workspace_id, role, created_at")
      .eq("user_id", userId);

    throwIfSupabaseError(membershipError, "Workspace membership lookup failed.");

    if (!memberships || memberships.length === 0) {
      return [];
    }

    const workspaceIds = memberships.map((membership) => membership.workspace_id);
    const { data: workspaces, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id, name, created_at")
      .in("id", workspaceIds)
      .order("created_at", { ascending: true });

    throwIfSupabaseError(workspaceError, "Workspace lookup failed.");

    const workspacesById = new Map((workspaces ?? []).map((workspace) => [workspace.id, workspace]));

    return memberships
      .map((membership) => {
        const workspace = workspacesById.get(membership.workspace_id);

        if (!workspace) {
          return null;
        }

        return {
          id: workspace.id,
          name: workspace.name,
          createdAt: workspace.created_at,
          role: membership.role
        };
      })
      .filter((workspace): workspace is NonNullable<typeof workspace> => Boolean(workspace));
  }

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
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { data: workspace, error: workspaceError } = await supabase
      .from("workspaces")
      .insert({ name })
      .select("id, name, created_at")
      .single<WorkspaceBaseRow>();

    throwIfSupabaseError(workspaceError, "Workspace creation failed.");

    if (!workspace) {
      throw new AppError("Workspace creation did not return a record.", 500);
    }

    const { error: membershipError } = await supabase.from("workspace_members").insert({
      workspace_id: workspace.id,
      user_id: userId,
      role: "admin"
    });

    throwIfSupabaseError(membershipError, "Workspace membership creation failed.");

    await ensureDefaultStagesForWorkspace({ query: async () => ({ rows: [] } as never) }, workspace.id);
    await logActivity({ query: async () => ({ rows: [] } as never) }, {
      workspaceId: workspace.id,
      userId,
      action: "workspace.created",
      metadata: { name: workspace.name }
    });

    return {
      id: workspace.id,
      name: workspace.name,
      createdAt: workspace.created_at,
      role: "admin" as const
    };
  }

  return withTransaction(async (client) => {
    const workspaceResult = await client.query<WorkspaceBaseRow>(
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
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    await assertWorkspaceMembership({ query: async () => ({ rows: [] } as never) }, userId, workspaceId);

    const { data: workspace, error } = await supabase
      .from("workspaces")
      .select("id, name, created_at")
      .eq("id", workspaceId)
      .maybeSingle<WorkspaceBaseRow>();

    throwIfSupabaseError(error, "Workspace lookup failed.");

    if (!workspace) {
      throw new AppError("Workspace not found.", 404);
    }

    return mapWorkspace(workspace);
  }

  return withTransaction(async (client) => {
    await assertWorkspaceMembership(client, userId, workspaceId);

    const result = await client.query<WorkspaceBaseRow>(
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

    return mapWorkspace(workspace);
  });
};

export const listWorkspaceMembers = async (userId: string, workspaceId: string) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    await assertWorkspaceMembership({ query: async () => ({ rows: [] } as never) }, userId, workspaceId);

    const { data: memberships, error: membershipError } = await supabase
      .from("workspace_members")
      .select("id, workspace_id, user_id, role, created_at")
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: true });

    throwIfSupabaseError(membershipError, "Workspace member lookup failed.");

    const userIds = (memberships ?? []).map((member) => member.user_id);
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", userIds);

    throwIfSupabaseError(usersError, "User lookup for workspace members failed.");

    const usersById = new Map((users ?? []).map((memberUser) => [memberUser.id, memberUser]));

    return (memberships ?? [])
      .map((member) => {
        const mappedUser = usersById.get(member.user_id);

        if (!mappedUser) {
          return null;
        }

        return mapWorkspaceMember({
          ...member,
          user_name: mappedUser.name,
          user_email: mappedUser.email
        });
      })
      .filter((member): member is NonNullable<typeof member> => Boolean(member))
      .sort((a, b) => {
        if (a.role !== b.role) {
          return a.role === "admin" ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
      });
  }

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
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    await assertWorkspaceAdminMembership({ query: async () => ({ rows: [] } as never) }, userId, workspaceId);

    const { data: invitedUser, error: userError } = await supabase
      .from("users")
      .select("id, name, email")
      .ilike("email", input.email)
      .maybeSingle<{ id: string; name: string; email: string }>();

    throwIfSupabaseError(userError, "Invited user lookup failed.");

    if (!invitedUser) {
      throw new AppError("User with this email was not found. Ask them to register first.", 404);
    }

    const { data: existingMembership, error: existingError } = await supabase
      .from("workspace_members")
      .select("id, role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", invitedUser.id)
      .maybeSingle<{ id: string; role: WorkspaceRole }>();

    throwIfSupabaseError(existingError, "Existing membership lookup failed.");

    const { data: membership, error: membershipError } = await supabase
      .from("workspace_members")
      .upsert(
        {
          workspace_id: workspaceId,
          user_id: invitedUser.id,
          role: input.role
        },
        { onConflict: "workspace_id,user_id" }
      )
      .select("id, workspace_id, user_id, role, created_at")
      .single<{
        id: string;
        workspace_id: string;
        user_id: string;
        role: WorkspaceRole;
        created_at: string;
      }>();

    throwIfSupabaseError(membershipError, "Workspace member upsert failed.");

    if (!membership) {
      throw new AppError("Workspace member upsert did not return a record.", 500);
    }

    await logActivity({ query: async () => ({ rows: [] } as never) }, {
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

    return mapWorkspaceMember({
      ...membership,
      user_name: invitedUser.name,
      user_email: invitedUser.email
    } as WorkspaceMemberRow);
  }

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
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    await assertWorkspaceAdminMembership({ query: async () => ({ rows: [] } as never) }, userId, workspaceId);

    const { data: workspace, error } = await supabase
      .from("workspaces")
      .update({ name })
      .eq("id", workspaceId)
      .select("id, name, created_at")
      .maybeSingle<WorkspaceBaseRow>();

    throwIfSupabaseError(error, "Workspace update failed.");

    if (!workspace) {
      throw new AppError("Workspace not found.", 404);
    }

    await logActivity({ query: async () => ({ rows: [] } as never) }, {
      workspaceId,
      userId,
      action: "workspace.updated",
      metadata: { name }
    });

    return mapWorkspace(workspace);
  }

  return withTransaction(async (client) => {
    await assertWorkspaceAdminMembership(client, userId, workspaceId);

    const result = await client.query<WorkspaceBaseRow>(
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

    return mapWorkspace(workspace);
  });
};

export const deleteWorkspace = async (userId: string, workspaceId: string) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    await assertWorkspaceAdminMembership({ query: async () => ({ rows: [] } as never) }, userId, workspaceId);

    const { error, count } = await supabase
      .from("workspaces")
      .delete({ count: "exact" })
      .eq("id", workspaceId);

    throwIfSupabaseError(error, "Workspace deletion failed.");

    if (!count) {
      throw new AppError("Workspace not found.", 404);
    }

    return;
  }

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
