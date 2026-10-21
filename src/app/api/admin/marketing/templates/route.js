import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireSuperAdmin() {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user || user.app_metadata?.is_super_admin !== true) return null;
  return user;
}

export async function GET() {
  try {
    const user = await requireSuperAdmin();
    if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const admin = createAdminClient();
    const { data: templates, error } = await admin
      .from("email_templates")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ templates: templates || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireSuperAdmin();
    if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { theme, name, subject, html } = await request.json();
    if (!name?.trim() || !subject?.trim() || !html?.trim()) {
      return NextResponse.json({ error: "Nom, objet et contenu requis" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: template, error } = await admin
      .from("email_templates")
      .insert({ theme: theme || null, name: name.trim(), subject: subject.trim(), html_body: html })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ template });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
