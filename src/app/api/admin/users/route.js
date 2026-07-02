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

// Update info, password, suspend, unsuspend
export async function PATCH(request) {
  try {
    const user = await verifySuperAdmin();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const admin = createAdminClient();
    const body = await request.json();
    const { action, orgId, ownerId } = body;

    if (action === "update_info") {
      const { full_name, email } = body;
      if (full_name !== undefined) {
        await admin.from("profiles").update({ full_name }).eq("id", ownerId);
      }
      if (email) {
        await admin.from("profiles").update({ email }).eq("id", ownerId);
        await admin.auth.admin.updateUserById(ownerId, { email });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "update_password") {
      const { password } = body;
      if (!password || password.length < 6) {
        return NextResponse.json({ error: "Mot de passe trop court (min 6 caractères)" }, { status: 400 });
      }
      const { error } = await admin.auth.admin.updateUserById(ownerId, { password });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ success: true });
    }

    if (action === "suspend") {
      await admin.from("subscriptions").update({ status: "suspended" }).eq("organization_id", orgId);
      return NextResponse.json({ success: true });
    }

    if (action === "unsuspend") {
      // Restore to active; if no sub or it was trial, keep active
      await admin.from("subscriptions").update({ status: "active" }).eq("organization_id", orgId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    console.error("PATCH /api/admin/users error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// Delete org + all auth users
export async function DELETE(request) {
  try {
    const user = await verifySuperAdmin();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

    const admin = createAdminClient();
    const { orgId } = await request.json();
    if (!orgId) return NextResponse.json({ error: "orgId manquant" }, { status: 400 });

    // Get all profiles for this org to delete auth accounts
    const { data: profiles } = await admin
      .from("profiles")
      .select("id")
      .eq("organization_id", orgId);

    // Delete auth users (cascades profile rows if FK is set)
    for (const p of profiles || []) {
      await admin.auth.admin.deleteUser(p.id);
    }

    // Delete org (cascades subscriptions/payments if FK set, otherwise clean manually)
    await admin.from("subscriptions").delete().eq("organization_id", orgId);
    await admin.from("subscription_payments").delete().eq("organization_id", orgId);
    await admin.from("organizations").delete().eq("id", orgId);

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("DELETE /api/admin/users error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
