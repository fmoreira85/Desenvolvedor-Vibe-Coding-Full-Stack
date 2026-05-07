import { Router } from "express";

import {
  createWorkspaceHandler,
  deleteWorkspaceHandler,
  getWorkspaceHandler,
  listWorkspacesHandler,
  updateWorkspaceHandler
} from "../controllers/workspaceController";

export const workspaceRouter = Router();

workspaceRouter.get("/", listWorkspacesHandler);
workspaceRouter.post("/", createWorkspaceHandler);
workspaceRouter.get("/:id", getWorkspaceHandler);
workspaceRouter.patch("/:id", updateWorkspaceHandler);
workspaceRouter.delete("/:id", deleteWorkspaceHandler);
