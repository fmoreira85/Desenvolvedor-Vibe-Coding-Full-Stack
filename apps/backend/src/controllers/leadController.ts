import type { Request, Response } from "express";

import {
  createLead,
  deleteLead,
  getLeadById,
  getLeadMessages,
  listLeads,
  moveLeadToStage,
  updateLead
} from "../services/leadService";
import { asyncHandler } from "../utils/asyncHandler";
import { assertString, assertUuid } from "../utils/validation";

const readNullableBodyValue = (value: unknown) => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  return String(value).trim();
};

export const listLeadsHandler = asyncHandler(async (request: Request, response: Response) => {
  const leads = await listLeads(request.auth!.userId, {
    workspaceId: assertUuid(
      request.query.workspace_id ?? request.query.workspaceId,
      "workspace_id"
    ),
    stageId:
      typeof request.query.stage_id === "string"
        ? request.query.stage_id
        : typeof request.query.stageId === "string"
          ? request.query.stageId
          : undefined,
    search:
      typeof request.query.search === "string" ? request.query.search : undefined,
    assignedTo:
      typeof request.query.assigned_to === "string"
        ? request.query.assigned_to
        : typeof request.query.assignedTo === "string"
          ? request.query.assignedTo
          : undefined
  });

  response.json({ items: leads });
});

export const createLeadHandler = asyncHandler(async (request: Request, response: Response) => {
  const lead = await createLead(request.auth!.userId, {
    workspaceId: assertUuid(request.body.workspaceId ?? request.body.workspace_id, "workspaceId"),
    stageId: readNullableBodyValue(request.body.stageId ?? request.body.stage_id),
    assignedUserId: readNullableBodyValue(
      request.body.assignedUserId ?? request.body.assigned_user_id
    ),
    name: assertString(request.body.name, "name"),
    email: readNullableBodyValue(request.body.email),
    phone: readNullableBodyValue(request.body.phone),
    company: readNullableBodyValue(request.body.company),
    role: readNullableBodyValue(request.body.role),
    leadSource: readNullableBodyValue(request.body.leadSource ?? request.body.lead_source),
    notes: readNullableBodyValue(request.body.notes),
    customFieldValues: request.body.customFieldValues ?? request.body.custom_field_values
  });

  response.status(201).json(lead);
});

export const getLeadHandler = asyncHandler(async (request: Request, response: Response) => {
  const lead = await getLeadById(request.auth!.userId, assertUuid(request.params.id, "id"));
  response.json(lead);
});

export const updateLeadHandler = asyncHandler(async (request: Request, response: Response) => {
  const body = request.body as Record<string, unknown>;
  const lead = await updateLead(request.auth!.userId, assertUuid(request.params.id, "id"), {
    stageId: readNullableBodyValue(body.stageId ?? body.stage_id),
    assignedUserId: readNullableBodyValue(body.assignedUserId ?? body.assigned_user_id),
    name: typeof body.name === "string" ? body.name.trim() : undefined,
    email: readNullableBodyValue(body.email),
    phone: readNullableBodyValue(body.phone),
    company: readNullableBodyValue(body.company),
    role: readNullableBodyValue(body.role),
    leadSource: readNullableBodyValue(body.leadSource ?? body.lead_source),
    notes: readNullableBodyValue(body.notes),
    customFieldValues: body.customFieldValues ?? body.custom_field_values
  });

  response.json(lead);
});

export const moveLeadToStageHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const lead = await moveLeadToStage(
      request.auth!.userId,
      assertUuid(request.params.id, "id"),
      assertUuid(request.body.stageId ?? request.body.stage_id, "stageId")
    );

    response.json(lead);
  }
);

export const deleteLeadHandler = asyncHandler(async (request: Request, response: Response) => {
  await deleteLead(request.auth!.userId, assertUuid(request.params.id, "id"));
  response.status(204).send();
});

export const getLeadMessagesHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const payload = await getLeadMessages(request.auth!.userId, assertUuid(request.params.id, "id"));
    response.json(payload);
  }
);
