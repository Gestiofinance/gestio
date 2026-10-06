-- Permet au super admin d'offrir un accès (à vie ou pour une durée donnée)
-- à n'importe quelle organisation, sans paiement réel. Utilisé par
-- l'action "grant_access" de /api/admin/users et le bouton correspondant
-- sur /admin/utilisateurs.
-- À exécuter dans le SQL Editor de Supabase.

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS is_complimentary BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS granted_note TEXT;
