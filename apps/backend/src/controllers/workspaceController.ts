import type { Request, Response } from "express";

import {
  createWorkspace,
  deleteWorkspace,
  getWorkspaceById,
  listUserWorkspaces,
  updateWorkspace
} from "../services/workspaceService";
import { asyncHandler } from "../utils/asyncHandler";
import { assertString, assertUuid } from "../utils/validation";

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
