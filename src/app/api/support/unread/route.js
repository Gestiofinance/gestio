import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ hasUnread: false });

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();
    if (!profile?.organization_id) return NextResponse.json({ hasUnread: false });

    const { count } = await admin
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile.organization_id)
      .eq("org_has_unread", true);

    return NextResponse.json({ hasUnread: (count || 0) > 0 });
  } catch (e) {
    return NextResponse.json({ hasUnread: false });
  }
}
