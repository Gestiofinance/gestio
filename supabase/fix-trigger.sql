-- ============================================
-- FIX : Trigger d'inscription utilisateur
-- À exécuter dans le SQL Editor de Supabase
-- ============================================

-- 1. Supprimer l'ancien trigger et la fonction
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Recréer la fonction avec search_path explicite
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_id UUID;
  user_name TEXT;
  company TEXT;
BEGIN
  -- Extraire les métadonnées de manière sécurisée
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );

  company := COALESCE(
    NEW.raw_user_meta_data->>'company_name',
    'Mon entreprise'
  );

  -- Créer l'organisation
  INSERT INTO public.organizations (name)
  VALUES (company)
  RETURNING id INTO org_id;

  -- Créer le profil utilisateur
  INSERT INTO public.profiles (id, organization_id, full_name, email, role)
  VALUES (
    NEW.id,
    org_id,
    user_name,
    NEW.email,
    'proprietaire'
  );

  RETURN NEW;
END;
$$;

-- 3. Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Vérification : afficher le trigger
SELECT tgname, tgrelid::regclass, tgfoid::regproc
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
