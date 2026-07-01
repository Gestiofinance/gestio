-- ============================================================
-- GESTIO — Correction des profils sans organization_id
-- À exécuter dans Supabase SQL Editor
-- ============================================================
-- Ce script crée une organisation pour chaque profil qui n'en a pas,
-- puis lie le profil à cette organisation et crée un abonnement trial.

DO $$
DECLARE
  p RECORD;
  org_id UUID;
BEGIN
  FOR p IN
    SELECT id, full_name, email
    FROM public.profiles
    WHERE organization_id IS NULL
  LOOP
    -- Créer une organisation pour cet utilisateur
    INSERT INTO public.organizations (name)
    VALUES (COALESCE(NULLIF(TRIM(p.full_name), ''), split_part(p.email, '@', 1), 'Mon entreprise'))
    RETURNING id INTO org_id;

    -- Lier le profil à l'organisation
    UPDATE public.profiles
    SET organization_id = org_id
    WHERE id = p.id;

    -- Créer un abonnement trial de 14 jours si aucun n'existe
    INSERT INTO public.subscriptions (organization_id, plan_id, billing_cycle, status, trial_end, amount)
    VALUES (org_id, 'pro', 'monthly', 'trial', NOW() + INTERVAL '14 days', 0)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Profil % lié à org %', p.email, org_id;
  END LOOP;
END;
$$;

-- Vérification : tous les profils doivent maintenant avoir un organization_id
SELECT
  p.email,
  p.organization_id,
  o.name AS org_name,
  s.status AS subscription_status
FROM public.profiles p
LEFT JOIN public.organizations o ON o.id = p.organization_id
LEFT JOIN public.subscriptions s ON s.organization_id = p.organization_id
ORDER BY p.created_at DESC;
