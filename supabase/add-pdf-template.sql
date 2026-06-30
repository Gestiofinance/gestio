-- Ajouter les colonnes PDF template + couleur marque
-- À exécuter dans le SQL Editor de Supabase

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS pdf_template TEXT DEFAULT 'moderne';

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS brand_color TEXT DEFAULT '#5E5CE6';

-- Créer le bucket storage pour les logos (si pas déjà fait)
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy pour permettre l'upload authentifié
CREATE POLICY "Authenticated users can upload logos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos');

CREATE POLICY "Authenticated users can update logos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'logos');

CREATE POLICY "Anyone can view logos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'logos');

CREATE POLICY "Authenticated users can delete logos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'logos');
