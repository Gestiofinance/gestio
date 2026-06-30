import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("plan_prices")
      .select("plan_id, cycle, price");
    if (error) throw error;

    const map = {};
    for (const row of data) {
      if (!map[row.plan_id]) map[row.plan_id] = {};
      map[row.plan_id][row.cycle] = row.price;
    }
    return NextResponse.json(map);
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

    // Body: { standard: { monthly: 9000, annual: 95040 }, pro: {...}, business: { quarterly: 25000 } }
    const body = await request.json();
    const admin = createAdminClient();
    const now = new Date().toISOString();

    const rows = [];
    for (const [plan_id, cycles] of Object.entries(body)) {
      for (const [cycle, price] of Object.entries(cycles)) {
        rows.push({ plan_id, cycle, price: Math.max(0, parseInt(price) || 0), updated_at: now });
      }
    }

    const { error } = await admin
      .from("plan_prices")
      .upsert(rows, { onConflict: "plan_id,cycle" });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
