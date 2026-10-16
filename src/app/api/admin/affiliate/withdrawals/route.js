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
    const { data: withdrawals, error } = await admin
      .from("affiliate_withdrawals")
      .select("*, affiliates(code, organizations(name))")
      .order("requested_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ withdrawals: withdrawals || [] });
  } catch (e) {
    console.error("GET /api/admin/affiliate/withdrawals error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
