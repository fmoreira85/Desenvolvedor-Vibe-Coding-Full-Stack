CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT workspace_members_workspace_user_unique UNIQUE (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'select')),
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT custom_fields_workspace_name_unique UNIQUE (workspace_id, name)
);

CREATE TABLE IF NOT EXISTS funnel_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT funnel_stages_workspace_name_unique UNIQUE (workspace_id, name),
  CONSTRAINT funnel_stages_workspace_order_unique UNIQUE (workspace_id, "order")
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES funnel_stages(id) ON DELETE RESTRICT,
  assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  role TEXT,
  lead_source TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lead_custom_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  custom_field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  CONSTRAINT lead_custom_values_lead_field_unique UNIQUE (lead_id, custom_field_id)
);

CREATE TABLE IF NOT EXISTS stage_required_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES funnel_stages(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  is_custom_field BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT stage_required_fields_stage_field_unique UNIQUE (stage_id, field_name, is_custom_field)
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  context TEXT NOT NULL,
  prompt TEXT NOT NULL,
  trigger_stage_id UUID REFERENCES funnel_stages(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  messages JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id
  ON workspace_members (workspace_id);

CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id
  ON workspace_members (user_id);

CREATE INDEX IF NOT EXISTS idx_custom_fields_workspace_id
  ON custom_fields (workspace_id);

CREATE INDEX IF NOT EXISTS idx_funnel_stages_workspace_id
  ON funnel_stages (workspace_id);

CREATE INDEX IF NOT EXISTS idx_leads_workspace_id
  ON leads (workspace_id);

CREATE INDEX IF NOT EXISTS idx_leads_stage_id
  ON leads (stage_id);

CREATE INDEX IF NOT EXISTS idx_leads_assigned_user_id
  ON leads (assigned_user_id);

CREATE INDEX IF NOT EXISTS idx_lead_custom_values_lead_id
  ON lead_custom_values (lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_custom_values_custom_field_id
  ON lead_custom_values (custom_field_id);

CREATE INDEX IF NOT EXISTS idx_stage_required_fields_stage_id
  ON stage_required_fields (stage_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_workspace_id
  ON campaigns (workspace_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_trigger_stage_id
  ON campaigns (trigger_stage_id);

CREATE INDEX IF NOT EXISTS idx_generated_messages_lead_id
  ON generated_messages (lead_id);

CREATE INDEX IF NOT EXISTS idx_generated_messages_campaign_id
  ON generated_messages (campaign_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_lead_id
  ON activity_logs (lead_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace_id
  ON activity_logs (workspace_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id
  ON activity_logs (user_id);
