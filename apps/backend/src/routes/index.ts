import { Router, type Request, type Response } from "express";

import type { HealthResponse } from "../types/api";
import { authMiddleware } from "../middlewares/authMiddleware";
import { activityLogsRouter } from "./activityLogsRoutes";
import { authRouter } from "./authRoutes";
import { campaignRouter } from "./campaignRoutes";
import { customFieldRouter } from "./customFieldRoutes";
import { dashboardRouter } from "./dashboardRoutes";
import { funnelStageRouter } from "./funnelStageRoutes";
import { leadRouter } from "./leadRoutes";
import { workspaceRouter } from "./workspaceRoutes";

export const apiRouter = Router();

apiRouter.get("/health", (_request: Request, response: Response) => {
  const payload: HealthResponse = {
    service: "backend",
    status: "ok",
    timestamp: new Date().toISOString()
  };

  response.json(payload);
});

apiRouter.use("/auth", authRouter);
apiRouter.use(authMiddleware);
apiRouter.use("/workspaces", workspaceRouter);
apiRouter.use("/leads", leadRouter);
apiRouter.use("/custom-fields", customFieldRouter);
apiRouter.use("/funnel-stages", funnelStageRouter);
apiRouter.use("/campaigns", campaignRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/activity-logs", activityLogsRouter);
