-- Programme d'affiliation : chaque compte admin d'organisation reçoit un
-- lien de parrainage, gagne une commission sur les paiements de ses filleuls
-- et peut demander un retrait de son solde. Le super admin règle le taux de
-- commission, gère les affiliés et valide les demandes de retrait.
-- RLS activée sans policy permissive : tout l'accès passe par /api/affiliate/*
-- (compte admin) et /api/admin/affiliate/* (super admin) via le client admin,
-- même principe que support_tickets / app_settings (pour éviter toute
-- récursion RLS, déjà rencontrée deux fois sur ce projet).
-- À exécuter dans le SQL Editor de Supabase.

CREATE TABLE IF NOT EXISTS affiliates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'actif' CHECK (status IN ('actif', 'suspendu')),
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_earned NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_withdrawn NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS referred_by_affiliate_id UUID REFERENCES affiliates(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  subscription_payment_id UUID REFERENCES subscription_payments(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL,
  rate NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_withdrawals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'approuvee', 'payee', 'rejetee')),
  admin_note TEXT,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdrawals_affiliate ON affiliate_withdrawals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_organizations_referred_by ON organizations(referred_by_affiliate_id);

INSERT INTO app_settings (key, value) VALUES ('affiliate_commission_rate', '10')
  ON CONFLICT (key) DO NOTHING;
INSERT INTO app_settings (key, value) VALUES ('affiliate_min_withdrawal', '10000')
  ON CONFLICT (key) DO NOTHING;

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_withdrawals ENABLE ROW LEVEL SECURITY;
