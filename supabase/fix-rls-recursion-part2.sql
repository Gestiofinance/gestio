-- Suite du fix de récursion infinie RLS.
-- 7 policies (ajoutées par add-subscriptions.sql) contiennent un
-- EXISTS (SELECT 1 FROM profiles WHERE ... is_super_admin = TRUE) écrit
-- directement dans leur condition, sans passer par une fonction SECURITY
-- DEFINER. Celle posée sur "profiles" elle-même (admin_view_all_profiles)
-- se redéclenche donc à chaque lecture de profiles par un utilisateur
-- authentifié : récursion garantie (pas seulement un problème d'inlining
-- comme pour get_user_org_id()).
-- À exécuter une seule fois dans le SQL Editor de Supabase.

CREATE OR REPLACE FUNCTION is_current_user_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  result BOOLEAN;
BEGIN
  SELECT is_super_admin INTO result FROM profiles WHERE id = auth.uid();
  RETURN COALESCE(result, FALSE);
END;
$$;

DROP POLICY IF EXISTS "sub_select_own" ON subscriptions;
CREATE POLICY "sub_select_own" ON subscriptions FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org_id()
    OR is_current_user_super_admin()
  );

DROP POLICY IF EXISTS "sub_insert_own" ON subscriptions;
CREATE POLICY "sub_insert_own" ON subscriptions FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_org_id()
    OR is_current_user_super_admin()
  );

DROP POLICY IF EXISTS "sub_update_own" ON subscriptions;
CREATE POLICY "sub_update_own" ON subscriptions FOR UPDATE TO authenticated
  USING (
    organization_id = get_user_org_id()
    OR is_current_user_super_admin()
  );

DROP POLICY IF EXISTS "pay_select_own" ON subscription_payments;
CREATE POLICY "pay_select_own" ON subscription_payments FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org_id()
    OR is_current_user_super_admin()
  );

DROP POLICY IF EXISTS "pay_insert_own" ON subscription_payments;
CREATE POLICY "pay_insert_own" ON subscription_payments FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_org_id()
    OR is_current_user_super_admin()
  );

DROP POLICY IF EXISTS "admin_view_all_orgs" ON organizations;
CREATE POLICY "admin_view_all_orgs" ON organizations FOR SELECT TO authenticated
  USING (
    id = get_user_org_id()
    OR is_current_user_super_admin()
  );

DROP POLICY IF EXISTS "admin_view_all_profiles" ON profiles;
CREATE POLICY "admin_view_all_profiles" ON profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR organization_id = get_user_org_id()
    OR is_current_user_super_admin()
  );
