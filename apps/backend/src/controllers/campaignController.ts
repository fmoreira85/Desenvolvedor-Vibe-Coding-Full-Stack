import type { Request, Response } from "express";

import {
  createCampaign,
  generateCampaignMessages,
  listCampaigns,
  sendLeadMessage,
  updateCampaign
} from "../services/campaignService";
import { asyncHandler } from "../utils/asyncHandler";
import { assertBoolean, assertString, assertUuid } from "../utils/validation";

const readNullableBodyValue = (value: unknown) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  return String(value).trim();
};

export const listCampaignsHandler = asyncHandler(async (request: Request, response: Response) => {
  const workspaceId = assertUuid(
    request.query.workspace_id ?? request.query.workspaceId,
    "workspace_id"
  );
  const campaigns = await listCampaigns(request.auth!.userId, workspaceId);
  response.json({ items: campaigns });
});

export const createCampaignHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const campaign = await createCampaign(request.auth!.userId, {
      workspaceId: assertUuid(request.body.workspaceId ?? request.body.workspace_id, "workspaceId"),
      name: assertString(request.body.name, "name"),
      context: assertString(request.body.context, "context"),
      prompt: assertString(request.body.prompt, "prompt"),
      triggerStageId: readNullableBodyValue(request.body.triggerStageId ?? request.body.trigger_stage_id),
      isActive:
        request.body.isActive === undefined && request.body.is_active === undefined
          ? undefined
          : assertBoolean(request.body.isActive ?? request.body.is_active, "isActive")
    });

    response.status(201).json(campaign);
  }
);

export const updateCampaignHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const body = request.body as Record<string, unknown>;
    const campaign = await updateCampaign(request.auth!.userId, assertUuid(request.params.id, "id"), {
      name: typeof body.name === "string" ? body.name.trim() : undefined,
      context: typeof body.context === "string" ? body.context.trim() : undefined,
      prompt: typeof body.prompt === "string" ? body.prompt.trim() : undefined,
      triggerStageId: readNullableBodyValue(body.triggerStageId ?? body.trigger_stage_id),
      isActive:
        body.isActive === undefined && body.is_active === undefined
          ? undefined
          : assertBoolean(body.isActive ?? body.is_active, "isActive")
    });

    response.json(campaign);
  }
);

export const generateCampaignMessagesHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const result = await generateCampaignMessages(
      request.auth!.userId,
      assertUuid(request.params.id, "id"),
      assertUuid(request.body.leadId ?? request.body.lead_id, "leadId")
    );

    response.status(201).json(result);
  }
);

export const sendLeadMessageHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const result = await sendLeadMessage(
      request.auth!.userId,
      assertUuid(request.params.id, "id"),
      readNullableBodyValue(request.body.generatedMessageId ?? request.body.generated_message_id)
    );

    response.json(result);
  }
);
