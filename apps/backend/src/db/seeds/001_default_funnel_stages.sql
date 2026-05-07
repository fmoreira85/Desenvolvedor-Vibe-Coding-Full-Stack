WITH default_stages AS (
  SELECT *
  FROM (
    VALUES
      (1, 'Base', '#64748b'),
      (2, 'Lead Mapeado', '#0ea5e9'),
      (3, 'Tentando Contato', '#f59e0b'),
      (4, 'Conexao Iniciada', '#8b5cf6'),
      (5, 'Desqualificado', '#ef4444'),
      (6, 'Qualificado', '#22c55e'),
      (7, 'Reuniao Agendada', '#14b8a6')
  ) AS stage_definitions(stage_order, stage_name, stage_color)
)
INSERT INTO funnel_stages (workspace_id, name, "order", color)
SELECT
  workspaces.id,
  default_stages.stage_name,
  default_stages.stage_order,
  default_stages.stage_color
FROM workspaces
CROSS JOIN default_stages
ON CONFLICT (workspace_id, "order") DO NOTHING;
