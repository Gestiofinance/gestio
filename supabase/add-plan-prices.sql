-- plan_prices : prix des plans modifiables par le super admin
CREATE TABLE IF NOT EXISTS plan_prices (
  plan_id  VARCHAR NOT NULL,
  cycle    VARCHAR NOT NULL,
  price    INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (plan_id, cycle)
);

-- Prix par défaut
INSERT INTO plan_prices (plan_id, cycle, price) VALUES
  ('standard', 'monthly',   9000),
  ('standard', 'annual',    95040),
  ('pro',      'monthly',   14500),
  ('pro',      'annual',    153120),
  ('business', 'quarterly', 25000)
ON CONFLICT (plan_id, cycle) DO NOTHING;

-- RLS : lecture publique (authentifiés), écriture via service role uniquement
ALTER TABLE plan_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_prices_read" ON plan_prices;
CREATE POLICY "plan_prices_read" ON plan_prices
  FOR SELECT TO authenticated USING (true);
