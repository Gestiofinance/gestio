-- Module Marketing côté compte organisation (réservé au Plan Business + accès
-- offert) : réutilise les tables email_campaigns / email_templates déjà
-- créées pour le marketing super admin, avec organization_id pour distinguer
-- une campagne plateforme (organization_id NULL, envoyée par le super admin)
-- d'une campagne envoyée par une organisation à ses propres clients.
-- RLS déjà activée sans policy permissive sur ces tables — tout passe par
-- /api/marketing/* (compte organisation) via le client admin, avec
-- vérification du plan + des quotas côté serveur.
-- À exécuter dans le SQL Editor de Supabase.

ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_email_campaigns_org ON email_campaigns(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_email_templates_org ON email_templates(organization_id);
