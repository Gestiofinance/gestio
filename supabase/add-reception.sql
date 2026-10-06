-- Module Accueil : les assistants enregistrent les visiteurs qui se présentent
-- pour rencontrer un membre de l'équipe (host_id). Celui-ci est notifié en
-- temps réel (Supabase Realtime) s'il est connecté. Un visiteur peut être
-- converti en client (client_id rempli + ligne créée dans "clients").
-- À exécuter dans le SQL Editor de Supabase.

CREATE TABLE IF NOT EXISTS visitor_appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  visit_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  host_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'en_attente' CHECK (status IN ('en_attente', 'recu', 'termine', 'annule')),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitor_appointments_org ON visitor_appointments(organization_id);
CREATE INDEX IF NOT EXISTS idx_visitor_appointments_host ON visitor_appointments(host_id);

ALTER TABLE visitor_appointments ENABLE ROW LEVEL SECURITY;

-- Même modèle que les autres tables organisationnelles (clients, projects...) :
-- get_user_org_id() est en plpgsql SECURITY DEFINER, donc pas de risque de
-- récursion RLS ici.
CREATE POLICY "Users can view visitor_appointments in their org" ON visitor_appointments
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "Users can insert visitor_appointments in their org" ON visitor_appointments
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "Users can update visitor_appointments in their org" ON visitor_appointments
  FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "Users can delete visitor_appointments in their org" ON visitor_appointments
  FOR DELETE USING (organization_id = get_user_org_id());

-- Active Realtime sur cette table pour la notification instantanée de l'hôte.
ALTER PUBLICATION supabase_realtime ADD TABLE visitor_appointments;
