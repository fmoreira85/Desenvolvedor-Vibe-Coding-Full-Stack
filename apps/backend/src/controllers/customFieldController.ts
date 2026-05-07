import type { Request, Response } from "express";

import { AppError } from "../errors/AppError";
import { createCustomField, deleteCustomField, listCustomFields } from "../services/customFieldService";
import { asyncHandler } from "../utils/asyncHandler";
import { assertArray, assertString, assertUuid } from "../utils/validation";

const parseFieldType = (value: unknown) => {
  const fieldType = assertString(value, "fieldType");

  if (!["text", "number", "select"].includes(fieldType)) {
    throw new AppError('fieldType must be one of "text", "number" or "select".', 400);
  }

  return fieldType as "text" | "number" | "select";
};

export const listCustomFieldsHandler = asyncHandler(async (request: Request, response: Response) => {
  const workspaceId = assertUuid(
    request.query.workspace_id ?? request.query.workspaceId,
    "workspace_id"
  );

  const fields = await listCustomFields(request.auth!.userId, workspaceId);
  response.json({ items: fields });
});

export const createCustomFieldHandler = asyncHandler(
  async (request: Request, response: Response) => {
    const options =
      request.body.options === undefined
        ? undefined
        : assertArray<string>(request.body.options, "options").map((option) =>
            assertString(option, "option")
          );

    const field = await createCustomField(request.auth!.userId, {
      workspaceId: assertUuid(request.body.workspaceId ?? request.body.workspace_id, "workspaceId"),
      name: assertString(request.body.name, "name"),
      fieldType: parseFieldType(request.body.fieldType ?? request.body.field_type),
      options
    });

    response.status(201).json(field);
  }
);

export const deleteCustomFieldHandler = asyncHandler(
  async (request: Request, response: Response) => {
    await deleteCustomField(request.auth!.userId, assertUuid(request.params.id, "id"));
    response.status(204).send();
  }
);
