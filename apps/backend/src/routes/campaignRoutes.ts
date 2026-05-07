import { Router } from "express";

import {
  createCampaignHandler,
  generateCampaignMessagesHandler,
  listCampaignsHandler,
  updateCampaignHandler
} from "../controllers/campaignController";

export const campaignRouter = Router();

campaignRouter.get("/", listCampaignsHandler);
campaignRouter.post("/", createCampaignHandler);
campaignRouter.patch("/:id", updateCampaignHandler);
campaignRouter.post("/:id/generate-messages", generateCampaignMessagesHandler);
