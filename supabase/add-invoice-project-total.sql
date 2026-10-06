-- Montant total du projet pour les factures d'acompte, afin de calculer
-- le reliquat (Montant du projet - Acompte reçu) côté formulaire.
-- À exécuter dans le SQL Editor de Supabase.

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS project_total_amount NUMERIC(12,2);
