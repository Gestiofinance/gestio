import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// GET is public on purpose — the landing page reads trialDays without a session.
export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.from("app_settings").select("key, value");
    if (error) throw error;

    const map = {};
    for (const row of data) map[row.key] = row.value;

    return NextResponse.json({
      trialDays: parseInt(map.trial_days, 10) || 14,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user || user.app_metadata?.is_super_admin !== true) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { trialDays } = await request.json();
    const days = Math.max(1, Math.min(90, parseInt(trialDays, 10) || 14));

    const admin = createAdminClient();
    const { error } = await admin
      .from("app_settings")
      .upsert({ key: "trial_days", value: String(days), updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;

    return NextResponse.json({ success: true, trialDays: days });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
