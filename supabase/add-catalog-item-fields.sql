-- Champs adaptés au type (Service / Produit) sur le catalogue : image,
-- référence (produits) et durée estimée (services).
-- À exécuter dans le SQL Editor de Supabase.

ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS reference TEXT;
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS duration TEXT;
