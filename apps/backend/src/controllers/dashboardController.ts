import type { Request, Response } from "express";

import { getDashboardMetrics } from "../services/dashboardService";
import { asyncHandler } from "../utils/asyncHandler";
import { assertUuid } from "../utils/validation";

export const getDashboardHandler = asyncHandler(async (request: Request, response: Response) => {
  const workspaceId = assertUuid(
    request.query.workspace_id ?? request.query.workspaceId,
    "workspace_id"
  );
  const dashboard = await getDashboardMetrics(request.auth!.userId, workspaceId);
  response.json(dashboard);
});
