import { Router } from "express";

import {
  createWorkspaceHandler,
  deleteWorkspaceHandler,
  getWorkspaceHandler,
  inviteWorkspaceMemberHandler,
  listWorkspacesHandler,
  listWorkspaceMembersHandler,
  updateWorkspaceHandler
} from "../controllers/workspaceController";

export const workspaceRouter = Router();

workspaceRouter.get("/", listWorkspacesHandler);
workspaceRouter.post("/", createWorkspaceHandler);
workspaceRouter.get("/:id", getWorkspaceHandler);
workspaceRouter.get("/:id/members", listWorkspaceMembersHandler);
workspaceRouter.post("/:id/members", inviteWorkspaceMemberHandler);
workspaceRouter.patch("/:id", updateWorkspaceHandler);
workspaceRouter.delete("/:id", deleteWorkspaceHandler);
