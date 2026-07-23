import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getOrgId(admin, userId) {
  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single();
  return profile?.organization_id;
}

export async function GET() {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const admin = createAdminClient();
    const orgId = await getOrgId(admin, user.id);
    if (!orgId) return NextResponse.json({ members: [] });

    const { data: members, error } = await admin
      .from("profiles")
      .select("id, full_name, email, role, job_title, allowed_modules, is_active, created_at, organization_id")
      .eq("organization_id", orgId)
      .order("created_at");

    if (error) throw error;
    return NextResponse.json({ members: members || [] });
  } catch (e) {
    console.error("GET /api/team/members error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const admin = createAdminClient();
    const orgId = await getOrgId(admin, user.id);
    if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 400 });

    const { full_name, email, password, job_title, allowed_modules } = await request.json();
    if (!full_name || !email || !password || !job_title) {
      return NextResponse.json({ error: "Nom, email, mot de passe et poste requis" }, { status: 400 });
    }

    // Create the auth user server-side — does NOT sign in the current user
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    // Attach to organization
    await admin.from("profiles").update({
      full_name,
      organization_id: orgId,
      role: "collaborateur",
      job_title,
      allowed_modules: Array.isArray(allowed_modules) ? allowed_modules : [],
      is_active: true,
    }).eq("id", newUser.user.id);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST /api/team/members error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const admin = createAdminClient();
    const orgId = await getOrgId(admin, user.id);
    if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 400 });

    const { memberId, is_active } = await request.json();

    // Ensure the target member belongs to the same org
    const { data: target } = await admin
      .from("profiles")
      .select("organization_id, role")
      .eq("id", memberId)
      .single();

    if (!target || target.organization_id !== orgId) {
      return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });
    }
    if (target.role === "proprietaire") {
      return NextResponse.json({ error: "Impossible de modifier le propriétaire" }, { status: 403 });
    }

    await admin.from("profiles").update({ is_active }).eq("id", memberId);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH /api/team/members error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
