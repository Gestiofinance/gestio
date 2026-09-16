-- Mini système de tickets support (compte admin d'organisation <-> super admin plateforme).
-- RLS activé mais sans policy permissive : tout l'accès passe par les routes
-- /api/support/* via le client admin (service role), qui vérifie lui-même
-- les droits (org admin vs super admin) — on évite volontairement d'écrire
-- de nouvelles policies RLS après les deux récursions rencontrées aujourd'hui.
-- À exécuter une seule fois dans le SQL Editor de Supabase.

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('bug', 'facturation', 'fonctionnalite', 'compte', 'autre')),
  severity TEXT NOT NULL DEFAULT 'moyenne' CHECK (severity IN ('faible', 'moyenne', 'elevee', 'urgente')),
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  org_has_unread BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_from_admin BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_org ON support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket ON support_messages(ticket_id);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
