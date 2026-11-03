import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user || user.app_metadata?.is_super_admin !== true) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(500, parseInt(searchParams.get("limit"), 10) || 200);

    const admin = createAdminClient();
    const { data: logs, error } = await admin
      .from("email_logs")
      .select("*, email_campaigns(name)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    return NextResponse.json({ logs: logs || [] });
  } catch (e) {
    console.error("GET /api/admin/marketing/logs error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
