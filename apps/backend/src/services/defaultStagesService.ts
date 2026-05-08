import type { DatabaseExecutor } from "../db/helpers";
import { getSupabaseAdminClient, isSupabaseDataEnabled, throwIfSupabaseError } from "../db/supabase";

const DEFAULT_STAGES = [
  { order: 1, name: "Base", color: "#64748b" },
  { order: 2, name: "Lead Mapeado", color: "#0ea5e9" },
  { order: 3, name: "Tentando Contato", color: "#f59e0b" },
  { order: 4, name: "Conexao Iniciada", color: "#8b5cf6" },
  { order: 5, name: "Desqualificado", color: "#ef4444" },
  { order: 6, name: "Qualificado", color: "#22c55e" },
  { order: 7, name: "Reuniao Agendada", color: "#14b8a6" }
];

export const ensureDefaultStagesForWorkspace = async (
  executor: DatabaseExecutor,
  workspaceId: string
) => {
  if (isSupabaseDataEnabled()) {
    const supabase = getSupabaseAdminClient();
    const payload = DEFAULT_STAGES.map((stage) => ({
      workspace_id: workspaceId,
      name: stage.name,
      order: stage.order,
      color: stage.color
    }));

    const { error } = await supabase
      .from("funnel_stages")
      .upsert(payload, { onConflict: "workspace_id,order", ignoreDuplicates: true });

    throwIfSupabaseError(error, "Default funnel stage provisioning failed.");
    return;
  }

  for (const stage of DEFAULT_STAGES) {
    await executor.query(
      `
        INSERT INTO funnel_stages (workspace_id, name, "order", color)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (workspace_id, "order") DO NOTHING
      `,
      [workspaceId, stage.name, stage.order, stage.color]
    );
  }
};
