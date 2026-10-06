-- Renomme les statuts clients pour plus de cohérence avec le flux
-- Accueil -> Clients : "actif"/"inactif"/"prospect" -> "client"/"non_converti"/"prospect".
-- Recherche la contrainte CHECK existante par son contenu plutôt que par un
-- nom supposé, pour rester fiable quel que soit son nom réel.
-- À exécuter dans le SQL Editor de Supabase.

DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.clients'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.clients DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

UPDATE clients SET status = 'client' WHERE status = 'actif';
UPDATE clients SET status = 'non_converti' WHERE status = 'inactif';

ALTER TABLE clients ALTER COLUMN status SET DEFAULT 'prospect';
ALTER TABLE clients ADD CONSTRAINT clients_status_check
  CHECK (status IN ('client', 'prospect', 'non_converti'));
