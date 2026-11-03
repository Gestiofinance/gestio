// Limites du module Marketing côté organisation (Plan Business / accès
// offert uniquement) : 1 campagne par jour, 100 destinataires par envoi,
// 250 emails au total par mois.
export const DAILY_CAMPAIGN_LIMIT = 1;
export const MONTHLY_EMAIL_LIMIT = 250;
export const RECIPIENT_LIMIT_PER_SEND = 100;

export async function getOrgMarketingAccess(admin, orgId) {
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan_id, is_complimentary")
    .eq("organization_id", orgId)
    .maybeSingle();

  const allowed = sub?.plan_id === "business" || sub?.is_complimentary === true;
  return { allowed, plan: sub?.plan_id || null, isComplimentary: !!sub?.is_complimentary };
}

export async function getOrgQuota(admin, orgId) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [{ count: dailyUsed }, { data: monthRows }] = await Promise.all([
    admin
      .from("email_campaigns")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("created_at", todayStart),
    admin
      .from("email_campaigns")
      .select("sent_count")
      .eq("organization_id", orgId)
      .gte("created_at", monthStart),
  ]);

  const monthlyUsed = (monthRows || []).reduce((sum, r) => sum + (r.sent_count || 0), 0);

  return {
    dailyUsed: dailyUsed || 0,
    dailyLimit: DAILY_CAMPAIGN_LIMIT,
    monthlyUsed,
    monthlyLimit: MONTHLY_EMAIL_LIMIT,
    monthlyRemaining: Math.max(0, MONTHLY_EMAIL_LIMIT - monthlyUsed),
    recipientLimit: RECIPIENT_LIMIT_PER_SEND,
  };
}
