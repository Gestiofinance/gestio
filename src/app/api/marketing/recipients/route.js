import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getOrgMarketingAccess } from "@/lib/email/quota";
import { resolveClientRecipients } from "@/lib/email/org-recipients";

export async function POST(request) {
  try {
    const admin = createAdminClient();
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: profile } = await admin.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) return NextResponse.json({ error: "Organisation introuvable" }, { status: 400 });

    const { allowed } = await getOrgMarketingAccess(admin, profile.organization_id);
    if (!allowed) return NextResponse.json({ error: "Module réservé au Plan Business" }, { status: 403 });

    const { filters } = await request.json();
    const recipients = await resolveClientRecipients(admin, profile.organization_id, filters || {});

    return NextResponse.json({ count: recipients.length, sample: recipients.slice(0, 10) });
  } catch (e) {
    console.error("POST /api/marketing/recipients error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
