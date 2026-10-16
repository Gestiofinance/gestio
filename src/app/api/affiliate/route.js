import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ORG_ADMIN_ROLES = ["proprietaire", "administrateur"];

async function getCaller(admin) {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  return { user, profile };
}

function generateCode(orgName) {
  const base = (orgName || "GESTIO")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6) || "GESTIO";
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${base}${suffix}`;
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const caller = await getCaller(admin);
    if (!caller) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (!caller.profile?.organization_id || !ORG_ADMIN_ROLES.includes(caller.profile.role)) {
      return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
    }

    const orgId = caller.profile.organization_id;

    let { data: affiliate } = await admin
      .from("affiliates")
      .select("*")
      .eq("organization_id", orgId)
      .maybeSingle();

    if (!affiliate) {
      const { data: org } = await admin.from("organizations").select("name").eq("id", orgId).single();
      let code = generateCode(org?.name);
      let attempts = 0;
      while (!affiliate && attempts < 5) {
        const { data: created, error } = await admin
          .from("affiliates")
          .insert({ organization_id: orgId, code })
          .select()
          .single();
        if (!error) { affiliate = created; break; }
        if (error.code === "23505") { code = generateCode(org?.name); attempts++; continue; }
        throw error;
      }
      if (!affiliate) throw new Error("Impossible de générer un code d'affiliation");
    }

    const [{ count: clicksCount }, { data: referred }, { data: settingsRows }] = await Promise.all([
      admin.from("affiliate_clicks").select("id", { count: "exact", head: true }).eq("affiliate_id", affiliate.id),
      admin.from("organizations").select("id, subscriptions(status)").eq("referred_by_affiliate_id", affiliate.id),
      admin.from("app_settings").select("key, value").in("key", ["affiliate_commission_rate", "affiliate_min_withdrawal"]),
    ]);

    const settingsMap = {};
    for (const row of settingsRows || []) settingsMap[row.key] = row.value;

    const referredCount = referred?.length || 0;
    const convertedCount = (referred || []).filter((o) => (o.subscriptions || []).some((s) => s.status === "active")).length;

    return NextResponse.json({
      affiliate,
      stats: { clicks: clicksCount || 0, referred: referredCount, converted: convertedCount },
      commissionRate: parseFloat(settingsMap.affiliate_commission_rate) || 10,
      minWithdrawal: parseFloat(settingsMap.affiliate_min_withdrawal) || 10000,
    });
  } catch (e) {
    console.error("GET /api/affiliate error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
