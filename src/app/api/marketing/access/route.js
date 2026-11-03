import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getOrgMarketingAccess, getOrgQuota } from "@/lib/email/quota";
import { hasResendKey } from "@/lib/email/resend";

export async function GET() {
  try {
    const admin = createAdminClient();
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: profile } = await admin.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) return NextResponse.json({ error: "Organisation introuvable" }, { status: 400 });

    const orgId = profile.organization_id;
    const [access, quota] = await Promise.all([
      getOrgMarketingAccess(admin, orgId),
      getOrgQuota(admin, orgId),
    ]);

    return NextResponse.json({ ...access, quota, hasResendKey: hasResendKey() });
  } catch (e) {
    console.error("GET /api/marketing/access error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
