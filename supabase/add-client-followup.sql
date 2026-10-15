-- Retour utilisateur : relier un client au produit/offre qui l'intéresse
-- (catalogue existant), et prévoir la date de la prochaine relance,
-- pour que le champ "Notes" reste réservé à l'historique et aux besoins
-- spécifiques du client.
-- À exécuter dans le SQL Editor de Supabase.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS interested_product_id UUID REFERENCES catalog_items(id) ON DELETE SET NULL;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_followup_date DATE;

CREATE INDEX IF NOT EXISTS idx_clients_next_followup ON clients(next_followup_date);
