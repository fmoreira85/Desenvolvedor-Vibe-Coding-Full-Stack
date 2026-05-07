import { Router } from "express";

import { listActivityLogsHandler } from "../controllers/activityLogsController";

export const activityLogsRouter = Router();

activityLogsRouter.get("/", listActivityLogsHandler);
