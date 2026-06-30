-- ============================================
-- GESTIO — Schéma de base de données complet
-- À exécuter dans le SQL Editor de Supabase
-- ============================================

-- 1. ORGANISATIONS (multi-tenant)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  ninea TEXT,
  rccm TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Sénégal',
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  tax_rate NUMERIC(5,2) DEFAULT 18.00,
  currency TEXT DEFAULT 'XOF',
  invoice_prefix TEXT DEFAULT 'FAC',
  quote_prefix TEXT DEFAULT 'DEV',
  invoice_next_seq INTEGER DEFAULT 1,
  quote_next_seq INTEGER DEFAULT 1,
  bank_name TEXT,
  bank_account TEXT,
  bank_iban TEXT,
  mobile_money TEXT,
  conditions_generales TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILS UTILISATEURS
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'collaborateur' CHECK (role IN ('proprietaire', 'administrateur', 'comptable', 'collaborateur', 'lecture_seule')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  type TEXT DEFAULT 'entreprise' CHECK (type IN ('particulier', 'entreprise')),
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Sénégal',
  ninea TEXT,
  rccm TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  status TEXT DEFAULT 'actif' CHECK (status IN ('actif', 'inactif', 'prospect')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROJETS
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'a_demarrer' CHECK (status IN ('a_demarrer', 'en_cours', 'en_pause', 'termine', 'annule')),
  start_date DATE,
  due_date DATE,
  budget NUMERIC(12,2) DEFAULT 0,
  budget_consumed NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TÂCHES
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'a_faire' CHECK (status IN ('a_faire', 'en_cours', 'en_revision', 'termine')),
  priority TEXT DEFAULT 'moyenne' CHECK (priority IN ('basse', 'moyenne', 'haute', 'urgente')),
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CATALOGUE PRODUITS / SERVICES
CREATE TABLE IF NOT EXISTS catalog_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 18.00,
  unit TEXT DEFAULT 'unité',
  type TEXT DEFAULT 'service' CHECK (type IN ('produit', 'service')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DEVIS
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  quote_number TEXT NOT NULL,
  status TEXT DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'envoye', 'accepte', 'refuse', 'expire')),
  issue_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 18.00,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  conditions TEXT,
  converted_to_invoice BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. LIGNES DE DEVIS
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE NOT NULL,
  catalog_item_id UUID REFERENCES catalog_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit TEXT DEFAULT 'unité',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 18.00,
  total NUMERIC(12,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- 9. FACTURES
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  type TEXT DEFAULT 'standard' CHECK (type IN ('standard', 'acompte', 'solde', 'avoir')),
  status TEXT DEFAULT 'brouillon' CHECK (status IN ('brouillon', 'envoyee', 'partiellement_payee', 'payee', 'en_retard', 'annulee')),
  issue_date DATE DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 18.00,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  discount_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  paid_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  conditions TEXT,
  payment_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. LIGNES DE FACTURES
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  catalog_item_id UUID REFERENCES catalog_items(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit TEXT DEFAULT 'unité',
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) DEFAULT 18.00,
  total NUMERIC(12,2) DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

-- 11. PAIEMENTS
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'virement' CHECK (payment_method IN ('virement', 'especes', 'wave', 'orange_money', 'free_money', 'carte_bancaire', 'cheque', 'paytech', 'autre')),
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. DÉPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  expense_date DATE DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  supplier TEXT,
  payment_method TEXT DEFAULT 'especes',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. JOURNAL D'ACTIVITÉ (AUDIT LOG)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEX
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_org ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_org ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_quotes_org ON quotes(organization_id);
CREATE INDEX IF NOT EXISTS idx_quotes_client ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_org ON payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_org ON activity_log(organization_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Fonction helper pour récupérer l'organization_id de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Policies pour organizations
CREATE POLICY "Users can view their organization" ON organizations
  FOR SELECT USING (id = get_user_org_id());
CREATE POLICY "Owners can update their organization" ON organizations
  FOR UPDATE USING (id = get_user_org_id());

-- Policies pour profiles
CREATE POLICY "Users can view profiles in their org" ON profiles
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Macro pour créer des policies CRUD standard par org
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['clients', 'projects', 'tasks', 'catalog_items', 'quotes', 'invoices', 'payments', 'expenses', 'activity_log']
  LOOP
    EXECUTE format('CREATE POLICY "Users can view %1$s in their org" ON %1$s FOR SELECT USING (organization_id = get_user_org_id())', t);
    EXECUTE format('CREATE POLICY "Users can insert %1$s in their org" ON %1$s FOR INSERT WITH CHECK (organization_id = get_user_org_id())', t);
    EXECUTE format('CREATE POLICY "Users can update %1$s in their org" ON %1$s FOR UPDATE USING (organization_id = get_user_org_id())', t);
    EXECUTE format('CREATE POLICY "Users can delete %1$s in their org" ON %1$s FOR DELETE USING (organization_id = get_user_org_id())', t);
  END LOOP;
END $$;

-- Policies pour quote_items et invoice_items (via jointure)
CREATE POLICY "Users can view quote_items" ON quote_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND quotes.organization_id = get_user_org_id()));
CREATE POLICY "Users can insert quote_items" ON quote_items
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND quotes.organization_id = get_user_org_id()));
CREATE POLICY "Users can update quote_items" ON quote_items
  FOR UPDATE USING (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND quotes.organization_id = get_user_org_id()));
CREATE POLICY "Users can delete quote_items" ON quote_items
  FOR DELETE USING (EXISTS (SELECT 1 FROM quotes WHERE quotes.id = quote_items.quote_id AND quotes.organization_id = get_user_org_id()));

CREATE POLICY "Users can view invoice_items" ON invoice_items
  FOR SELECT USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.organization_id = get_user_org_id()));
CREATE POLICY "Users can insert invoice_items" ON invoice_items
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.organization_id = get_user_org_id()));
CREATE POLICY "Users can update invoice_items" ON invoice_items
  FOR UPDATE USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.organization_id = get_user_org_id()));
CREATE POLICY "Users can delete invoice_items" ON invoice_items
  FOR DELETE USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.organization_id = get_user_org_id()));

-- ============================================
-- TRIGGERS pour updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['organizations', 'profiles', 'clients', 'projects', 'tasks', 'quotes', 'invoices', 'expenses']
  LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t);
  END LOOP;
END $$;

-- ============================================
-- TRIGGER pour créer le profil à l'inscription
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
BEGIN
  INSERT INTO organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'Mon entreprise'))
  RETURNING id INTO org_id;

  INSERT INTO profiles (id, organization_id, full_name, email, role)
  VALUES (
    NEW.id,
    org_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'proprietaire'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
