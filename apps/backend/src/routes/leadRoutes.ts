import { Router } from "express";

import {
  createLeadHandler,
  deleteLeadHandler,
  getLeadHandler,
  getLeadMessagesHandler,
  listLeadsHandler,
  moveLeadToStageHandler,
  updateLeadHandler
} from "../controllers/leadController";
import { sendLeadMessageHandler } from "../controllers/campaignController";

export const leadRouter = Router();

leadRouter.get("/", listLeadsHandler);
leadRouter.post("/", createLeadHandler);
leadRouter.get("/:id/messages", getLeadMessagesHandler);
leadRouter.post("/:id/send-message", sendLeadMessageHandler);
leadRouter.get("/:id", getLeadHandler);
leadRouter.patch("/:id", updateLeadHandler);
leadRouter.patch("/:id/stage", moveLeadToStageHandler);
leadRouter.delete("/:id", deleteLeadHandler);
