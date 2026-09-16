-- Corrige "infinite recursion detected in policy for relation profiles".
-- get_user_org_id() était une fonction SQL simple ; Postgres peut l'inliner
-- directement dans la requête appelante, ce qui annule son SECURITY DEFINER
-- et fait réévaluer la policy RLS de profiles à l'intérieur d'elle-même.
-- Une fonction plpgsql n'est jamais inlinée par le planner : le problème
-- disparaît définitivement, au lieu de se reproduire de façon intermittente.
-- À exécuter une seule fois dans le SQL Editor de Supabase.

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  org_id UUID;
BEGIN
  SELECT organization_id INTO org_id FROM profiles WHERE id = auth.uid();
  RETURN org_id;
END;
$$;
