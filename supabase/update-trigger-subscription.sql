-- ============================================================
-- GESTIO — Mise à jour trigger + abonnements trial manquants
-- À exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Mise à jour du trigger : crée aussi un abonnement trial à l'inscription
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
  user_name TEXT;
  company TEXT;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  company := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    'Mon entreprise'
  );

  -- Créer l'organisation
  INSERT INTO public.organizations (name)
  VALUES (company)
  RETURNING id INTO org_id;

  -- Créer le profil
  INSERT INTO public.profiles (id, organization_id, full_name, email, role)
  VALUES (NEW.id, org_id, user_name, NEW.email, 'proprietaire');

  -- Créer un abonnement trial de 14 jours
  INSERT INTO public.subscriptions (organization_id, plan_id, billing_cycle, status, trial_end, amount)
  VALUES (org_id, 'pro', 'monthly', 'trial', NOW() + INTERVAL '14 days', 0);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Créer un abonnement trial pour les organisations existantes sans abonnement
INSERT INTO public.subscriptions (organization_id, plan_id, billing_cycle, status, trial_end, amount)
SELECT o.id, 'pro', 'monthly', 'trial', NOW() + INTERVAL '14 days', 0
FROM public.organizations o
WHERE o.id NOT IN (
  SELECT DISTINCT organization_id FROM public.subscriptions WHERE organization_id IS NOT NULL
)
ON CONFLICT DO NOTHING;

-- Vérification
SELECT
  o.name AS organisation,
  s.status,
  s.trial_end
FROM public.organizations o
LEFT JOIN public.subscriptions s ON s.organization_id = o.id
ORDER BY o.created_at DESC;
