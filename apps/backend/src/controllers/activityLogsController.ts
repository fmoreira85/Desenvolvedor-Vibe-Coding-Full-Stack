import type { Request, Response } from "express";

import { listActivityLogs } from "../services/activityLogsQueryService";
import { asyncHandler } from "../utils/asyncHandler";

export const listActivityLogsHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const items = await listActivityLogs(request.auth!.userId, {
      workspaceId:
        typeof request.query.workspace_id === "string"
          ? request.query.workspace_id
          : typeof request.query.workspaceId === "string"
            ? request.query.workspaceId
            : undefined,
      leadId:
        typeof request.query.lead_id === "string"
          ? request.query.lead_id
          : typeof request.query.leadId === "string"
            ? request.query.leadId
            : undefined
    });

    response.json({ items });
  }
);
