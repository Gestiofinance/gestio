import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user || user.app_metadata?.is_super_admin !== true) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const admin = createAdminClient();
    const [{ data: affiliates, error }, { data: referredOrgs }] = await Promise.all([
      admin.from("affiliates").select("*, organizations(name, email)").order("created_at", { ascending: false }),
      admin.from("organizations").select("referred_by_affiliate_id").not("referred_by_affiliate_id", "is", null),
    ]);
    if (error) throw error;

    const referredCounts = {};
    for (const o of referredOrgs || []) {
      referredCounts[o.referred_by_affiliate_id] = (referredCounts[o.referred_by_affiliate_id] || 0) + 1;
    }

    const result = (affiliates || []).map((a) => ({ ...a, referredCount: referredCounts[a.id] || 0 }));

    return NextResponse.json({ affiliates: result });
  } catch (e) {
    console.error("GET /api/admin/affiliate/list error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
