import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const admin = createAdminClient();
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: profile } = await admin.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) return NextResponse.json({ error: "Organisation introuvable" }, { status: 400 });

    const { theme, name, subject, html } = await request.json();
    if (!name?.trim() || !subject?.trim() || !html?.trim()) {
      return NextResponse.json({ error: "Nom, objet et contenu requis" }, { status: 400 });
    }

    const { data: template, error } = await admin
      .from("email_templates")
      .update({ theme: theme || null, name: name.trim(), subject: subject.trim(), html_body: html, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", profile.organization_id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ template });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const admin = createAdminClient();
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: profile } = await admin.from("profiles").select("organization_id").eq("id", user.id).single();
    if (!profile?.organization_id) return NextResponse.json({ error: "Organisation introuvable" }, { status: 400 });

    // N'efface que les modèles appartenant à cette organisation.
    const { error } = await admin
      .from("email_templates")
      .delete()
      .eq("id", id)
      .eq("organization_id", profile.organization_id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
