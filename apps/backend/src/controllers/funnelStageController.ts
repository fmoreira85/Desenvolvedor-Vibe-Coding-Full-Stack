import type { Request, Response } from "express";

import {
  createFunnelStage,
  listFunnelStages,
  replaceStageRequiredFields,
  updateFunnelStage
} from "../services/funnelStageService";
import { asyncHandler } from "../utils/asyncHandler";
import { assertArray, assertBoolean, assertString, assertUuid } from "../utils/validation";

export const listFunnelStagesHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const workspaceId = assertUuid(
      request.query.workspace_id ?? request.query.workspaceId,
      "workspace_id"
    );
    const stages = await listFunnelStages(request.auth!.userId, workspaceId);
    response.json({ items: stages });
  }
);

export const createFunnelStageHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const stage = await createFunnelStage(request.auth!.userId, {
      workspaceId: assertUuid(request.body.workspaceId ?? request.body.workspace_id, "workspaceId"),
      name: assertString(request.body.name, "name"),
      order: Number(request.body.order),
      color: assertString(request.body.color, "color")
    });

    response.status(201).json(stage);
  }
);

export const updateFunnelStageHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const body = request.body as Record<string, unknown>;
    const stage = await updateFunnelStage(request.auth!.userId, assertUuid(request.params.id, "id"), {
      name: typeof body.name === "string" ? body.name.trim() : undefined,
      order: typeof body.order === "number" ? body.order : undefined,
      color: typeof body.color === "string" ? body.color.trim() : undefined
    });

    response.json(stage);
  }
);

export const replaceStageRequiredFieldsHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const requiredFields = assertArray<Record<string, unknown>>(
      request.body.requiredFields,
      "requiredFields"
    ).map((field) => ({
      fieldName: assertString(field.fieldName ?? field.field_name, "fieldName"),
      isCustomField: assertBoolean(
        field.isCustomField ?? field.is_custom_field,
        "isCustomField"
      )
    }));

    const stage = await replaceStageRequiredFields(
      request.auth!.userId,
      assertUuid(request.params.id, "id"),
      requiredFields
    );

    response.json(stage);
  }
);
