-- Ajouter la colonne cachet/signature + remise
-- À exécuter dans le SQL Editor de Supabase

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS stamp_url TEXT;

ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS apply_stamp BOOLEAN DEFAULT FALSE;

ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'amount' CHECK (discount_type IN ('amount', 'percent'));

ALTER TABLE public.quotes
ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12,2) DEFAULT 0;

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS apply_stamp BOOLEAN DEFAULT FALSE;

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'amount' CHECK (discount_type IN ('amount', 'percent'));

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS discount_value NUMERIC(12,2) DEFAULT 0;

-- Bucket pour cachets/signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('stamps', 'stamps', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Auth users can upload stamps" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'stamps');
CREATE POLICY "Anyone can view stamps" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'stamps');
CREATE POLICY "Auth users can update stamps" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'stamps');
CREATE POLICY "Auth users can delete stamps" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'stamps');
