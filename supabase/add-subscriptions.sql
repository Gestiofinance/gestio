-- ============================================================
-- GESTIO — Subscriptions & Super Admin
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add super_admin flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;

-- 2. Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id VARCHAR NOT NULL,                        -- 'standard' | 'pro' | 'business'
  billing_cycle VARCHAR NOT NULL DEFAULT 'monthly', -- 'monthly' | 'quarterly' | 'annual'
  status VARCHAR NOT NULL DEFAULT 'trial',          -- 'trial' | 'active' | 'past_due' | 'cancelled' | 'expired'
  amount INTEGER NOT NULL DEFAULT 0,               -- FCFA paid
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  paytech_token VARCHAR,
  paytech_ref VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Payment history
CREATE TABLE IF NOT EXISTS subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan_id VARCHAR NOT NULL,
  billing_cycle VARCHAR NOT NULL,
  amount INTEGER NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending',  -- 'pending' | 'completed' | 'failed' | 'refunded'
  paytech_token VARCHAR,
  paytech_ref VARCHAR,
  payment_method VARCHAR,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_payments ENABLE ROW LEVEL SECURITY;

-- 5. RLS policies — Subscriptions
DROP POLICY IF EXISTS "sub_select_own" ON subscriptions;
CREATE POLICY "sub_select_own" ON subscriptions FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org_id()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = TRUE)
  );

DROP POLICY IF EXISTS "sub_insert_own" ON subscriptions;
CREATE POLICY "sub_insert_own" ON subscriptions FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_org_id()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = TRUE)
  );

DROP POLICY IF EXISTS "sub_update_own" ON subscriptions;
CREATE POLICY "sub_update_own" ON subscriptions FOR UPDATE TO authenticated
  USING (
    organization_id = get_user_org_id()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = TRUE)
  );

-- 6. RLS policies — Payments
DROP POLICY IF EXISTS "pay_select_own" ON subscription_payments;
CREATE POLICY "pay_select_own" ON subscription_payments FOR SELECT TO authenticated
  USING (
    organization_id = get_user_org_id()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = TRUE)
  );

DROP POLICY IF EXISTS "pay_insert_own" ON subscription_payments;
CREATE POLICY "pay_insert_own" ON subscription_payments FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = get_user_org_id()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = TRUE)
  );

-- 7. Allow super admin to see ALL organizations and profiles
-- (add to existing policies rather than replacing — drop if conflict)
DROP POLICY IF EXISTS "admin_view_all_orgs" ON organizations;
CREATE POLICY "admin_view_all_orgs" ON organizations FOR SELECT TO authenticated
  USING (
    id = get_user_org_id()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = TRUE)
  );

DROP POLICY IF EXISTS "admin_view_all_profiles" ON profiles;
CREATE POLICY "admin_view_all_profiles" ON profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR organization_id = get_user_org_id()
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_super_admin = TRUE)
  );

-- 8. Create trial subscription for existing organizations (optional)
-- INSERT INTO subscriptions (organization_id, plan_id, billing_cycle, status, amount)
-- SELECT id, 'standard', 'monthly', 'trial', 0 FROM organizations
-- ON CONFLICT DO NOTHING;

-- 9. Create your super admin account (replace with your real user ID from auth.users)
-- UPDATE profiles SET is_super_admin = TRUE WHERE email = 'admin@gestio.sn';

-- ============================================================
-- After running:
-- 1. Run: UPDATE profiles SET is_super_admin = TRUE WHERE email = 'YOUR_ADMIN_EMAIL';
-- 2. Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=...
-- 3. Add to .env.local: PAYTECH_API_KEY=...
-- 4. Add to .env.local: PAYTECH_API_SECRET=...
-- 5. Add to .env.local: NEXT_PUBLIC_APP_URL=https://your-domain.com
-- ============================================================
