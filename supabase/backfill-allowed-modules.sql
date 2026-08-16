-- Corrige les comptes membres (non-propriétaires) créés avant l'ajout de la
-- colonne allowed_modules (add-team-permissions.sql). Cette colonne a un défaut
-- de tableau vide, ce qui a retiré tous les modules (Clients, Projets, Tâches,
-- Planning, Devis, Factures, Comptabilité, Signature) de la sidebar pour tous
-- les membres déjà en base au moment de la migration.
-- À exécuter une seule fois dans le SQL Editor de Supabase.

UPDATE profiles
SET allowed_modules = ARRAY['clients','projets','taches','planning','devis','factures','comptabilite','signature']
WHERE role <> 'proprietaire'
  AND (allowed_modules IS NULL OR allowed_modules = '{}');
