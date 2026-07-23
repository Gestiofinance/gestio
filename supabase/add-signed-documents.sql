-- Module de signature de documents (import PDF + pose libre de signature/cachet)
-- À exécuter dans le SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS signed_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  original_path TEXT NOT NULL,
  signed_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'signed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signed_documents_org ON signed_documents(organization_id);

ALTER TABLE signed_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signed documents in their org" ON signed_documents
  FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "Users can insert signed documents in their org" ON signed_documents
  FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY "Users can update signed documents in their org" ON signed_documents
  FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY "Users can delete signed documents in their org" ON signed_documents
  FOR DELETE USING (organization_id = get_user_org_id());

CREATE TRIGGER set_updated_at BEFORE UPDATE ON signed_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Bucket privé pour les PDF importés et signés
INSERT INTO storage.buckets (id, name, public)
VALUES ('signed-documents', 'signed-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth users can upload signed documents" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'signed-documents');
CREATE POLICY "Auth users can view signed documents" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'signed-documents');
CREATE POLICY "Auth users can update signed documents" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'signed-documents');
CREATE POLICY "Auth users can delete signed documents" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'signed-documents');
