import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ORG_ADMIN_ROLES = ["proprietaire", "administrateur"];

export async function GET() {
  try {
    const admin = createAdminClient();
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();
    if (!profile?.organization_id || !ORG_ADMIN_ROLES.includes(profile.role)) {
      return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
    }

    const { data: affiliate } = await admin
      .from("affiliates")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .maybeSingle();
    if (!affiliate) return NextResponse.json({ referrals: [] });

    const [{ data: orgs }, { data: commissions }] = await Promise.all([
      admin
        .from("organizations")
        .select("id, name, created_at, subscriptions(status)")
        .eq("referred_by_affiliate_id", affiliate.id)
        .order("created_at", { ascending: false }),
      admin.from("affiliate_commissions").select("organization_id, amount").eq("affiliate_id", affiliate.id),
    ]);

    const totalsByOrg = {};
    for (const c of commissions || []) {
      totalsByOrg[c.organization_id] = (totalsByOrg[c.organization_id] || 0) + Number(c.amount);
    }

    const referrals = (orgs || []).map((o) => ({
      id: o.id,
      name: o.name,
      createdAt: o.created_at,
      status: (o.subscriptions || []).some((s) => s.status === "active") ? "actif" : "essai",
      earned: totalsByOrg[o.id] || 0,
    }));

    return NextResponse.json({ referrals });
  } catch (e) {
    console.error("GET /api/affiliate/referrals error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
