import type { DatabaseExecutor } from "../db/helpers";
import { getSupabaseAdminClient, isSupabaseDataEnabled, throwIfSupabaseError } from "../db/supabase";

type LogActivityInput = {
  action: string;
  workspaceId: string;
  leadId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

export const logActivity = async (executor: DatabaseExecutor, input: LogActivityInput) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("activity_logs").insert({
      lead_id: input.leadId ?? null,
      workspace_id: input.workspaceId,
      user_id: input.userId ?? null,
      action: input.action,
      metadata: input.metadata ?? {}
    });

    throwIfSupabaseError(error, "Activity log insert failed.");
    return;
  }

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
