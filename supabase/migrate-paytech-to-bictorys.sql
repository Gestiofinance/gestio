-- Migration du fournisseur de paiement PayTech -> Bictorys.
-- Renomme les colonnes de suivi de paiement pour rester agnostiques du
-- fournisseur (utilisées jusqu'ici uniquement par les routes /api/paytech/*,
-- remplacées par /api/bictorys/*).
-- Rejouable sans risque : ne renomme que si l'ancienne colonne existe encore,
-- et crée payment_token / payment_ref si elles manquent.
-- À exécuter dans le SQL Editor de Supabase.

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['subscriptions', 'subscription_payments'] LOOP
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'paytech_token')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'payment_token') THEN
      EXECUTE format('ALTER TABLE public.%I RENAME COLUMN paytech_token TO payment_token', t);
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'paytech_ref')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'payment_ref') THEN
      EXECUTE format('ALTER TABLE public.%I RENAME COLUMN paytech_ref TO payment_ref', t);
    END IF;

    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS payment_token VARCHAR', t);
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS payment_ref VARCHAR', t);
  END LOOP;
END $$;

-- Ajoute "bictorys" comme mode de paiement client enregistrable manuellement
-- (factures/comptabilité) ; on garde "paytech" pour ne pas casser l'historique.
-- Supprime toute contrainte CHECK existante portant sur payment_method, quel
-- que soit son nom, avant de la recréer avec la nouvelle liste.
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.payments'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%payment_method%'
  LOOP
    EXECUTE format('ALTER TABLE public.payments DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.payments ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('virement', 'especes', 'wave', 'orange_money', 'free_money', 'carte_bancaire', 'cheque', 'paytech', 'bictorys', 'autre'));

-- Vérification : doit lister payment_token et payment_ref pour les 2 tables.
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('subscriptions', 'subscription_payments')
  AND column_name IN ('payment_token', 'payment_ref', 'paytech_token', 'paytech_ref')
ORDER BY table_name, column_name;
