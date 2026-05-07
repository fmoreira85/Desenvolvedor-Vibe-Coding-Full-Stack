import { withTransaction } from "../db/helpers";
import { AppError } from "../errors/AppError";
import { logActivity } from "./activityLogService";
import {
  assertWorkspaceAdminMembership,
  assertWorkspaceMembership
} from "./workspaceMembershipService";

type CustomFieldRow = {
  id: string;
  workspace_id: string;
  name: string;
  field_type: "text" | "number" | "select";
  options: unknown;
  created_at: string;
};

export const listCustomFields = async (userId: string, workspaceId: string) => {
  return withTransaction(async (client) => {
    await assertWorkspaceMembership(client, userId, workspaceId);

    const result = await client.query<CustomFieldRow>(
      `
        SELECT id, workspace_id, name, field_type, options, created_at
        FROM custom_fields
        WHERE workspace_id = $1
        ORDER BY created_at ASC
      `,
      [workspaceId]
    );

    return result.rows.map((field) => ({
      id: field.id,
      workspaceId: field.workspace_id,
      name: field.name,
      fieldType: field.field_type,
      options: field.options,
      createdAt: field.created_at
    }));
  });
};

export const createCustomField = async (
  userId: string,
  input: {
    workspaceId: string;
    name: string;
    fieldType: "text" | "number" | "select";
    options?: string[];
  }
) => {
  return withTransaction(async (client) => {
    await assertWorkspaceAdminMembership(client, userId, input.workspaceId);

    if (input.fieldType === "select" && (!input.options || input.options.length === 0)) {
      throw new AppError("Select fields require at least one option.", 400);
    }

    const result = await client.query<CustomFieldRow>(
      `
        INSERT INTO custom_fields (workspace_id, name, field_type, options)
        VALUES ($1, $2, $3, $4::jsonb)
        RETURNING id, workspace_id, name, field_type, options, created_at
      `,
      [
        input.workspaceId,
        input.name,
        input.fieldType,
        JSON.stringify(input.options ?? [])
      ]
    );

    await logActivity(client, {
      workspaceId: input.workspaceId,
      userId,
      action: "custom_field.created",
      metadata: {
        name: input.name,
        fieldType: input.fieldType
      }
    });

    const field = result.rows[0];

    return {
      id: field.id,
      workspaceId: field.workspace_id,
      name: field.name,
      fieldType: field.field_type,
      options: field.options,
      createdAt: field.created_at
    };
  });
};

export const deleteCustomField = async (userId: string, customFieldId: string) => {
  return withTransaction(async (client) => {
    const fieldResult = await client.query<Pick<CustomFieldRow, "workspace_id" | "name">>(
      `
        SELECT workspace_id, name
        FROM custom_fields
        WHERE id = $1
      `,
      [customFieldId]
    );

    const field = fieldResult.rows[0];

    if (!field) {
      throw new AppError("Custom field not found.", 404);
    }

    await assertWorkspaceAdminMembership(client, userId, field.workspace_id);

    await client.query("DELETE FROM custom_fields WHERE id = $1", [customFieldId]);

    await logActivity(client, {
      workspaceId: field.workspace_id,
      userId,
      action: "custom_field.deleted",
      metadata: {
        customFieldId,
        name: field.name
      }
    });
  });
};
