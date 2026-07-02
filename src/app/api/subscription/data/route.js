import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Returns subscription + payment history for the current authenticated user
// Uses admin client to bypass RLS — safe because we verify the session first
export async function GET() {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const admin = createAdminClient();

    // Get profile with org (admin bypasses RLS)
    const { data: profile } = await admin
      .from("profiles")
      .select("organization_id, full_name, role, organizations(id, name)")
      .eq("id", user.id)
      .single();

    const orgId = profile?.organization_id || profile?.organizations?.id;

    if (!orgId) {
      return NextResponse.json({ subscription: null, payments: [], orgId: null, orgName: null });
    }

    const [{ data: subscription }, { data: payments }] = await Promise.all([
      admin
        .from("subscriptions")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      admin
        .from("subscription_payments")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false }),
    ]);

    return NextResponse.json({
      subscription: subscription ?? null,
      payments: payments ?? [],
      orgId,
      orgName: profile?.organizations?.name || profile?.full_name || "Mon entreprise",
      userRole: profile?.role ?? null,
    });
  } catch (e) {
    console.error("Subscription data error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
