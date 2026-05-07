import type { DatabaseExecutor } from "../db/helpers";

type LogActivityInput = {
  action: string;
  workspaceId: string;
  leadId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

export const logActivity = async (executor: DatabaseExecutor, input: LogActivityInput) => {
  await executor.query(
    `
      INSERT INTO activity_logs (lead_id, workspace_id, user_id, action, metadata)
      VALUES ($1, $2, $3, $4, $5::jsonb)
    `,
    [
      input.leadId ?? null,
      input.workspaceId,
      input.userId ?? null,
      input.action,
      JSON.stringify(input.metadata ?? {})
    ]
  );
};
