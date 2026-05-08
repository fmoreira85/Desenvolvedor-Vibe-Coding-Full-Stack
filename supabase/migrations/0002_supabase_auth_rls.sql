ALTER TABLE IF EXISTS public.users
  ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE IF EXISTS public.users
  ALTER COLUMN id DROP DEFAULT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_id_auth_users_fkey'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_id_auth_users_fkey
      FOREIGN KEY (id)
      REFERENCES auth.users(id)
      ON DELETE CASCADE;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.handle_auth_user_upsert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, password_hash)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'name', ''), split_part(NEW.email, '@', 1)),
    NULL
  )
  ON CONFLICT (id)
  DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_upsert();

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
AFTER UPDATE OF email, raw_user_meta_data ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_auth_user_upsert();

CREATE OR REPLACE FUNCTION public.is_workspace_member(target_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = target_workspace_id
      AND wm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_admin(target_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = target_workspace_id
      AND wm.user_id = auth.uid()
      AND wm.role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.workspace_id_for_stage(target_stage_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fs.workspace_id
  FROM public.funnel_stages fs
  WHERE fs.id = target_stage_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.workspace_id_for_lead(target_lead_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.workspace_id
  FROM public.leads l
  WHERE l.id = target_lead_id
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.workspace_id_for_campaign(target_campaign_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.workspace_id
  FROM public.campaigns c
  WHERE c.id = target_campaign_id
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_id_for_stage(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_id_for_lead(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_id_for_campaign(uuid) TO authenticated;

ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.stage_required_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lead_custom_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.generated_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_self" ON public.users;
CREATE POLICY "users_select_self"
ON public.users
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "users_update_self" ON public.users;
CREATE POLICY "users_update_self"
ON public.users
FOR UPDATE
TO authenticated
USING ((SELECT auth.uid()) = id)
WITH CHECK ((SELECT auth.uid()) = id);

DROP POLICY IF EXISTS "workspaces_select_member" ON public.workspaces;
CREATE POLICY "workspaces_select_member"
ON public.workspaces
FOR SELECT
TO authenticated
USING (public.is_workspace_member(id));

DROP POLICY IF EXISTS "workspaces_update_admin" ON public.workspaces;
CREATE POLICY "workspaces_update_admin"
ON public.workspaces
FOR UPDATE
TO authenticated
USING (public.is_workspace_admin(id))
WITH CHECK (public.is_workspace_admin(id));

DROP POLICY IF EXISTS "workspaces_delete_admin" ON public.workspaces;
CREATE POLICY "workspaces_delete_admin"
ON public.workspaces
FOR DELETE
TO authenticated
USING (public.is_workspace_admin(id));

DROP POLICY IF EXISTS "workspace_members_select_member" ON public.workspace_members;
CREATE POLICY "workspace_members_select_member"
ON public.workspace_members
FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "workspace_members_insert_admin" ON public.workspace_members;
CREATE POLICY "workspace_members_insert_admin"
ON public.workspace_members
FOR INSERT
TO authenticated
WITH CHECK (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "workspace_members_update_admin" ON public.workspace_members;
CREATE POLICY "workspace_members_update_admin"
ON public.workspace_members
FOR UPDATE
TO authenticated
USING (public.is_workspace_admin(workspace_id))
WITH CHECK (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "workspace_members_delete_admin" ON public.workspace_members;
CREATE POLICY "workspace_members_delete_admin"
ON public.workspace_members
FOR DELETE
TO authenticated
USING (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "custom_fields_select_member" ON public.custom_fields;
CREATE POLICY "custom_fields_select_member"
ON public.custom_fields
FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "custom_fields_modify_admin" ON public.custom_fields;
CREATE POLICY "custom_fields_modify_admin"
ON public.custom_fields
FOR ALL
TO authenticated
USING (public.is_workspace_admin(workspace_id))
WITH CHECK (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "funnel_stages_select_member" ON public.funnel_stages;
CREATE POLICY "funnel_stages_select_member"
ON public.funnel_stages
FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "funnel_stages_modify_admin" ON public.funnel_stages;
CREATE POLICY "funnel_stages_modify_admin"
ON public.funnel_stages
FOR ALL
TO authenticated
USING (public.is_workspace_admin(workspace_id))
WITH CHECK (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "stage_required_fields_select_member" ON public.stage_required_fields;
CREATE POLICY "stage_required_fields_select_member"
ON public.stage_required_fields
FOR SELECT
TO authenticated
USING (public.is_workspace_member(public.workspace_id_for_stage(stage_id)));

DROP POLICY IF EXISTS "stage_required_fields_modify_admin" ON public.stage_required_fields;
CREATE POLICY "stage_required_fields_modify_admin"
ON public.stage_required_fields
FOR ALL
TO authenticated
USING (public.is_workspace_admin(public.workspace_id_for_stage(stage_id)))
WITH CHECK (public.is_workspace_admin(public.workspace_id_for_stage(stage_id)));

DROP POLICY IF EXISTS "leads_select_member" ON public.leads;
CREATE POLICY "leads_select_member"
ON public.leads
FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "leads_insert_member" ON public.leads;
CREATE POLICY "leads_insert_member"
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "leads_update_member" ON public.leads;
CREATE POLICY "leads_update_member"
ON public.leads
FOR UPDATE
TO authenticated
USING (public.is_workspace_member(workspace_id))
WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "leads_delete_member" ON public.leads;
CREATE POLICY "leads_delete_member"
ON public.leads
FOR DELETE
TO authenticated
USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "lead_custom_values_select_member" ON public.lead_custom_values;
CREATE POLICY "lead_custom_values_select_member"
ON public.lead_custom_values
FOR SELECT
TO authenticated
USING (public.is_workspace_member(public.workspace_id_for_lead(lead_id)));

DROP POLICY IF EXISTS "lead_custom_values_modify_member" ON public.lead_custom_values;
CREATE POLICY "lead_custom_values_modify_member"
ON public.lead_custom_values
FOR ALL
TO authenticated
USING (public.is_workspace_member(public.workspace_id_for_lead(lead_id)))
WITH CHECK (public.is_workspace_member(public.workspace_id_for_lead(lead_id)));

DROP POLICY IF EXISTS "campaigns_select_member" ON public.campaigns;
CREATE POLICY "campaigns_select_member"
ON public.campaigns
FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "campaigns_modify_admin" ON public.campaigns;
CREATE POLICY "campaigns_modify_admin"
ON public.campaigns
FOR ALL
TO authenticated
USING (public.is_workspace_admin(workspace_id))
WITH CHECK (public.is_workspace_admin(workspace_id));

DROP POLICY IF EXISTS "generated_messages_select_member" ON public.generated_messages;
CREATE POLICY "generated_messages_select_member"
ON public.generated_messages
FOR SELECT
TO authenticated
USING (public.is_workspace_member(public.workspace_id_for_lead(lead_id)));

DROP POLICY IF EXISTS "generated_messages_modify_member" ON public.generated_messages;
CREATE POLICY "generated_messages_modify_member"
ON public.generated_messages
FOR ALL
TO authenticated
USING (public.is_workspace_member(public.workspace_id_for_lead(lead_id)))
WITH CHECK (public.is_workspace_member(public.workspace_id_for_lead(lead_id)));

DROP POLICY IF EXISTS "activity_logs_select_member" ON public.activity_logs;
CREATE POLICY "activity_logs_select_member"
ON public.activity_logs
FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "activity_logs_insert_member" ON public.activity_logs;
CREATE POLICY "activity_logs_insert_member"
ON public.activity_logs
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_workspace_member(workspace_id)
  AND (user_id IS NULL OR user_id = (SELECT auth.uid()))
);
