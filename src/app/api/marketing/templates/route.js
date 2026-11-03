import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getOrgId(admin) {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data: profile } = await admin.from("profiles").select("organization_id").eq("id", user.id).single();
  if (!profile?.organization_id) return { error: "Organisation introuvable" };

  return { orgId: profile.organization_id };
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { orgId, error } = await getOrgId(admin);
    if (error) return NextResponse.json({ error }, { status: 401 });

    const { data: templates, error: dbError } = await admin
      .from("email_templates")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (dbError) throw dbError;

    return NextResponse.json({ templates: templates || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = createAdminClient();
    const { orgId, error } = await getOrgId(admin);
    if (error) return NextResponse.json({ error }, { status: 401 });

    const { theme, name, subject, html } = await request.json();
    if (!name?.trim() || !subject?.trim() || !html?.trim()) {
      return NextResponse.json({ error: "Nom, objet et contenu requis" }, { status: 400 });
    }

    const { data: template, error: insertError } = await admin
      .from("email_templates")
      .insert({ organization_id: orgId, theme: theme || null, name: name.trim(), subject: subject.trim(), html_body: html })
      .select()
      .single();
    if (insertError) throw insertError;

    return NextResponse.json({ template });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
