import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireSuperAdmin() {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user || user.app_metadata?.is_super_admin !== true) return null;
  return user;
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("app_settings")
      .select("key, value")
      .in("key", ["affiliate_commission_rate", "affiliate_min_withdrawal"]);

    const map = {};
    for (const row of data || []) map[row.key] = row.value;

    return NextResponse.json({
      commissionRate: parseFloat(map.affiliate_commission_rate) || 10,
      minWithdrawal: parseFloat(map.affiliate_min_withdrawal) || 10000,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await requireSuperAdmin();
    if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { commissionRate, minWithdrawal } = await request.json();
    const rate = Math.max(0, Math.min(100, parseFloat(commissionRate) || 10));
    const min = Math.max(0, parseFloat(minWithdrawal) || 10000);

    const admin = createAdminClient();
    const now = new Date().toISOString();
    const { error } = await admin.from("app_settings").upsert(
      [
        { key: "affiliate_commission_rate", value: String(rate), updated_at: now },
        { key: "affiliate_min_withdrawal", value: String(min), updated_at: now },
      ],
      { onConflict: "key" }
    );
    if (error) throw error;

    return NextResponse.json({ success: true, commissionRate: rate, minWithdrawal: min });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
