-- Paramètres globaux éditables depuis le compte super admin (/admin/parametres).
-- Démarre avec trial_days = 7 (essai gratuit passé de 14 à 7 jours).
-- RLS activée sans policy permissive : lecture publique (landing page) et
-- écriture (super admin) passent toutes les deux par /api/admin/settings
-- avec le client admin, même principe que support_tickets.
-- À exécuter dans le SQL Editor de Supabase.

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO app_settings (key, value) VALUES ('trial_days', '7')
  ON CONFLICT (key) DO NOTHING;

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Le trigger de création de compte lit désormais trial_days au lieu de
-- coder "14 days" en dur, pour que les futures inscriptions suivent la
-- valeur configurée par le super admin.
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
  trial_days INT;
BEGIN
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  company := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    'Mon entreprise'
  );

  SELECT value::INT INTO trial_days FROM public.app_settings WHERE key = 'trial_days';
  trial_days := COALESCE(trial_days, 14);

  -- Créer l'organisation
  INSERT INTO public.organizations (name)
  VALUES (company)
  RETURNING id INTO org_id;

  -- Créer le profil
  INSERT INTO public.profiles (id, organization_id, full_name, email, role)
  VALUES (NEW.id, org_id, user_name, NEW.email, 'proprietaire');

  -- Créer un abonnement trial de trial_days jours
  INSERT INTO public.subscriptions (organization_id, plan_id, billing_cycle, status, trial_end, amount)
  VALUES (org_id, 'pro', 'monthly', 'trial', NOW() + (trial_days || ' days')::INTERVAL, 0);

  RETURN NEW;
END;
$$;
