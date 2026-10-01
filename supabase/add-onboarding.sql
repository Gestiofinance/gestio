-- Onboarding post-inscription (Google ou email) : l'organisation doit
-- compléter ses infos avant d'accéder au dashboard.
-- Les organisations déjà existantes sont marquées comme déjà complétées
-- pour ne pas interrompre les comptes actuels.
-- À exécuter dans le SQL Editor de Supabase.

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE organizations SET onboarding_completed = TRUE WHERE onboarding_completed = FALSE;
