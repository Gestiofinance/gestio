-- Poste (titre) + modules autorisés par membre d'équipe
-- À exécuter dans le SQL Editor de Supabase

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS allowed_modules TEXT[] DEFAULT ARRAY[]::TEXT[];
