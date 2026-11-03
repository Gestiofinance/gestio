import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmin, adminNotifTemplate } from "@/lib/email/notify-admin";

async function getOrgIdForUser() {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id, full_name, organizations(id)")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id || profile?.organizations?.id;
  return { user, admin, orgId, profile };
}

// GET — organization data
export async function GET() {
  try {
    const { admin, orgId, error } = await getOrgIdForUser();
    if (error) return NextResponse.json({ error }, { status: 401 });
    if (!orgId) return NextResponse.json({ org: null });

    const { data: org } = await admin.from("organizations").select("*").eq("id", orgId).single();
    return NextResponse.json({ org });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT — update organization
export async function PUT(request) {
  try {
    const { user, admin, orgId, profile, error } = await getOrgIdForUser();
    if (error) return NextResponse.json({ error }, { status: 401 });
    if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 400 });

    const body = await request.json();

    // Fin d'onboarding = signal fiable d'une inscription toute neuve (passe
    // de false à true une seule fois par organisation) — on en profite pour
    // notifier le super admin par email, sans dépendre d'un webhook externe.
    let wasOnboarding = false;
    if (body.onboarding_completed === true) {
      const { data: before } = await admin
        .from("organizations")
        .select("onboarding_completed")
        .eq("id", orgId)
        .single();
      wasOnboarding = before?.onboarding_completed === false;
    }

    const { data: org, error: updateError } = await admin
      .from("organizations")
      .update(body)
      .eq("id", orgId)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

    if (wasOnboarding) {
      await notifyAdmin(admin, {
        subject: `Nouvelle inscription — ${org.name}`,
        category: "nouvelle_inscription",
        html: adminNotifTemplate("Nouvelle inscription", [
          ["Entreprise", org.name],
          ["Propriétaire", profile?.full_name],
          ["Email", user.email],
          ["Date", new Date().toLocaleString("fr-FR")],
        ]),
      });
    }

    return NextResponse.json({ org });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
