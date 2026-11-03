-- Journal des emails envoyés (campagnes + notifications automatiques),
-- affiché dans /admin/marketing. RLS activée sans policy permissive, comme
-- les autres tables marketing/affiliation — tout passe par les routes
-- /api/admin/marketing/* via le client admin.
-- À exécuter dans le SQL Editor de Supabase.

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('campagne', 'notification')),
  category TEXT,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('envoye', 'echec')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_campaign ON email_logs(campaign_id);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
