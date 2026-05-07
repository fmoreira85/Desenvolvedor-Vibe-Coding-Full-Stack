import { Router } from "express";

import {
  createFunnelStageHandler,
  listFunnelStagesHandler,
  replaceStageRequiredFieldsHandler,
  updateFunnelStageHandler
} from "../controllers/funnelStageController";

export const funnelStageRouter = Router();

funnelStageRouter.get("/", listFunnelStagesHandler);
funnelStageRouter.post("/", createFunnelStageHandler);
funnelStageRouter.patch("/:id", updateFunnelStageHandler);
funnelStageRouter.patch("/:id/required-fields", replaceStageRequiredFieldsHandler);
