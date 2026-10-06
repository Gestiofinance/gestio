-- Module "Personnel" : annuaire interne (DG, chefs de service...) qui n'ont
-- pas forcément de compte Gestio. Remplace la référence profiles(id) de
-- visitor_appointments.host_id par personnel(id), pour que "Personne à
-- rencontrer" accepte aussi bien un membre d'équipe existant qu'un nom
-- saisi librement par l'assistant (créé à la volée).
-- profile_id reste optionnel : s'il est renseigné, cette personne reçoit la
-- notification temps réel ; sinon c'est juste une entrée d'annuaire.
-- À exécuter dans le SQL Editor de Supabase.

CREATE TABLE IF NOT EXISTS personnel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  job_title TEXT,
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personnel_org ON personnel(organization_id);

ALTER TABLE personnel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view personnel in their org" ON personnel
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "Users can insert personnel in their org" ON personnel
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "Users can update personnel in their org" ON personnel
  FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "Users can delete personnel in their org" ON personnel
  FOR DELETE USING (organization_id = get_user_org_id());

-- Pré-remplit l'annuaire avec les membres d'équipe déjà existants, pour
-- qu'ils apparaissent tout de suite dans la liste "Personne à rencontrer"
-- et puissent recevoir la notification (lien profile_id).
INSERT INTO personnel (organization_id, full_name, job_title, profile_id)
SELECT p.organization_id, p.full_name, p.job_title, p.id
FROM profiles p
WHERE COALESCE(p.is_active, TRUE) = TRUE
  AND NOT EXISTS (SELECT 1 FROM personnel pe WHERE pe.profile_id = p.id);

-- Repointe visitor_appointments.host_id de profiles(id) vers personnel(id).
ALTER TABLE visitor_appointments ADD COLUMN IF NOT EXISTS host_personnel_id UUID REFERENCES personnel(id) ON DELETE SET NULL;

UPDATE visitor_appointments va
SET host_personnel_id = pe.id
FROM personnel pe
WHERE pe.profile_id = va.host_id
  AND va.host_personnel_id IS NULL
  AND va.host_id IS NOT NULL;

ALTER TABLE visitor_appointments DROP COLUMN IF EXISTS host_id;
ALTER TABLE visitor_appointments RENAME COLUMN host_personnel_id TO host_id;

CREATE INDEX IF NOT EXISTS idx_visitor_appointments_host ON visitor_appointments(host_id);
