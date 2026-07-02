import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getOrgIdForUser() {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id, organizations(id)")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id || profile?.organizations?.id;
  return { user, admin, orgId };
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
    const { admin, orgId, error } = await getOrgIdForUser();
    if (error) return NextResponse.json({ error }, { status: 401 });
    if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 400 });

    const body = await request.json();
    const { data: org, error: updateError } = await admin
      .from("organizations")
      .update(body)
      .eq("id", orgId)
      .select()
      .single();

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
    return NextResponse.json({ org });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
