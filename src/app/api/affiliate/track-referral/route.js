import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Appelé une fois après connexion si un code de parrainage (?ref=) traîne
// dans le localStorage du visiteur — attribue l'organisation à l'affilié,
// une seule fois (ne remplace jamais une attribution déjà posée).
export async function POST(request) {
  try {
    const { code } = await request.json();
    if (!code) return NextResponse.json({ ok: false });

    const admin = createAdminClient();
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ ok: false });

    const { data: profile } = await admin.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) return NextResponse.json({ ok: false });

    const { data: org } = await admin
      .from("organizations")
      .select("id, referred_by_affiliate_id")
      .eq("id", profile.organization_id)
      .single();
    if (!org || org.referred_by_affiliate_id) return NextResponse.json({ ok: false });

    const { data: affiliate } = await admin
      .from("affiliates")
      .select("id, organization_id")
      .eq("code", String(code).toUpperCase())
      .maybeSingle();
    if (!affiliate || affiliate.organization_id === org.id) return NextResponse.json({ ok: false });

    await admin.from("organizations").update({ referred_by_affiliate_id: affiliate.id }).eq("id", org.id);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/affiliate/track-referral error:", e);
    return NextResponse.json({ ok: false });
  }
}
