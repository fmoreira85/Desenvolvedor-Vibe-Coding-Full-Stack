import { Router } from "express";

import { getDashboardHandler } from "../controllers/dashboardController";

export const dashboardRouter = Router();

dashboardRouter.get("/", getDashboardHandler);
