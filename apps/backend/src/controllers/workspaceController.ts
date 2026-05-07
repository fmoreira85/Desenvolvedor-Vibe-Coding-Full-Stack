import type { Request, Response } from "express";

import { AppError } from "../errors/AppError";
import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaceById,
  inviteWorkspaceMember,
  listUserWorkspaces,
  listWorkspaceMembers,
  updateWorkspace
} from "../services/workspaceService";
import { asyncHandler } from "../utils/asyncHandler";
import { assertString, assertUuid } from "../utils/validation";
import type { WorkspaceRole } from "../types/domain";

const assertWorkspaceRole = (value: unknown): WorkspaceRole => {
  if (value !== "admin" && value !== "member") {
    throw new AppError('Field "role" must be either "admin" or "member".', 400);
  }

  return value;
};

export const listWorkspacesHandler = asyncHandler(async (request: Request, response: Response) => {
  const workspaces = await listUserWorkspaces(request.auth!.userId);
  response.json({ items: workspaces });
});

export const createWorkspaceHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const workspace = await createWorkspace(
      request.auth!.userId,
      assertString(request.body.name, "name")
    );

    response.status(201).json(workspace);
  }
);

export const getWorkspaceHandler = asyncHandler(async (request: Request, response: Response) => {
  const workspace = await getWorkspaceById(
    request.auth!.userId,
    assertUuid(request.params.id, "id")
  );

  response.json(workspace);
});

export const listWorkspaceMembersHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const items = await listWorkspaceMembers(
      request.auth!.userId,
      assertUuid(request.params.id, "id")
    );

    response.json({ items });
  }
);

export const inviteWorkspaceMemberHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const member = await inviteWorkspaceMember(
      request.auth!.userId,
      assertUuid(request.params.id, "id"),
      {
        email: assertString(request.body.email, "email"),
        role: assertWorkspaceRole(request.body.role)
      }
    );

    response.status(201).json(member);
  }
);

export const updateWorkspaceHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const workspace = await updateWorkspace(
      request.auth!.userId,
      assertUuid(request.params.id, "id"),
      assertString(request.body.name, "name")
    );

    response.json(workspace);
  }
);

export const deleteWorkspaceHandler = asyncHandler(
  async (request: Request, response: Response) => {
    await deleteWorkspace(request.auth!.userId, assertUuid(request.params.id, "id"));
    response.status(204).send();
  }
);
