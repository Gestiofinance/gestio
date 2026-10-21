-- Module Marketing (super admin) : campagnes d'emailing via Resend + email
-- de notification du super admin pour les nouvelles inscriptions,
-- abonnements pris, tickets support et demandes de retrait d'affiliation.
-- RLS activée sans policy permissive : tout passe par /api/admin/marketing/*
-- (client admin), même principe que support_tickets / affiliates.
-- À exécuter dans le SQL Editor de Supabase.

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  theme TEXT,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  theme TEXT,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'envoi_en_cours', 'envoyee', 'echec')),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_created ON email_campaigns(created_at);

-- Email où le super admin reçoit les notifications automatiques (nouvelle
-- inscription, paiement reçu, ticket support, demande de retrait).
INSERT INTO app_settings (key, value) VALUES ('admin_notify_email', 'abdoukabusiness@gmail.com')
  ON CONFLICT (key) DO NOTHING;

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
