-- Table des recettes (revenus hors factures)
-- À exécuter dans le SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS revenues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  revenue_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'virement',
  reference TEXT,
  client_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenues_org ON revenues(organization_id);

ALTER TABLE revenues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view revenues in their org" ON revenues
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "Users can insert revenues in their org" ON revenues
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "Users can update revenues in their org" ON revenues
  FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "Users can delete revenues in their org" ON revenues
  FOR DELETE USING (organization_id = get_user_org_id());

CREATE TRIGGER set_updated_at BEFORE UPDATE ON revenues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
