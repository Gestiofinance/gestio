-- Migration du fournisseur de paiement PayTech -> Bictorys.
-- Renomme les colonnes de suivi de paiement pour rester agnostiques du
-- fournisseur (utilisées jusqu'ici uniquement par les routes /api/paytech/*,
-- remplacées par /api/bictorys/*).
-- À exécuter une seule fois dans le SQL Editor de Supabase.

ALTER TABLE subscriptions RENAME COLUMN paytech_token TO payment_token;
ALTER TABLE subscriptions RENAME COLUMN paytech_ref TO payment_ref;
ALTER TABLE subscription_payments RENAME COLUMN paytech_token TO payment_token;
ALTER TABLE subscription_payments RENAME COLUMN paytech_ref TO payment_ref;

-- Ajoute "bictorys" comme mode de paiement client enregistrable manuellement
-- (factures/comptabilité) ; on garde "paytech" pour ne pas casser l'historique.
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_payment_method_check
  CHECK (payment_method IN ('virement', 'especes', 'wave', 'orange_money', 'free_money', 'carte_bancaire', 'cheque', 'paytech', 'bictorys', 'autre'));
