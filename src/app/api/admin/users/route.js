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

    const [{ data: organizations }, { data: subscriptions }, { data: profiles }] = await Promise.all([
      admin.from("organizations").select("*").order("created_at", { ascending: false }),
      admin.from("subscriptions").select("*"),
      admin.from("profiles").select("id, full_name, email, role, organization_id, created_at"),
    ]);

    return NextResponse.json({ organizations: organizations || [], subscriptions: subscriptions || [], profiles: profiles || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
