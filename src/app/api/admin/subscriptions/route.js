import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function verifySuperAdmin() {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user || user.app_metadata?.is_super_admin !== true) return null;
  return user;
}

export async function GET() {
  try {
    const user = await verifySuperAdmin();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const admin = createAdminClient();

    const [{ data: subscriptions }, { data: payments }] = await Promise.all([
      admin
        .from("subscriptions")
        .select("*, organizations(name, email)")
        .order("created_at", { ascending: false }),
      admin
        .from("subscription_payments")
        .select("*, organizations(name)")
        .order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({ subscriptions: subscriptions || [], payments: payments || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
