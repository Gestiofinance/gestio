import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const ORG_ADMIN_ROLES = ["proprietaire", "administrateur"];

async function getCaller(admin) {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return null;

  const isSuperAdmin = user.app_metadata?.is_super_admin === true;

  const { data: profile } = await admin
    .from("profiles")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .single();

  return { user, isSuperAdmin, profile };
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const caller = await getCaller(admin);
    if (!caller) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    if (caller.isSuperAdmin) {
      const { data: tickets, error } = await admin
        .from("support_tickets")
        .select("*, organizations(name)")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return NextResponse.json({ tickets: tickets || [] });
    }

    if (!caller.profile?.organization_id) return NextResponse.json({ tickets: [] });

    const { data: tickets, error } = await admin
      .from("support_tickets")
      .select("*")
      .eq("organization_id", caller.profile.organization_id)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ tickets: tickets || [] });
  } catch (e) {
    console.error("GET /api/support/tickets error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = createAdminClient();
    const caller = await getCaller(admin);
    if (!caller) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    if (!caller.profile?.organization_id || !ORG_ADMIN_ROLES.includes(caller.profile.role)) {
      return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
    }

    const { category, severity, subject, message } = await request.json();
    if (!category || !severity || !subject?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    const { data: ticket, error: ticketError } = await admin
      .from("support_tickets")
      .insert({
        organization_id: caller.profile.organization_id,
        created_by: caller.user.id,
        category,
        severity,
        subject: subject.trim(),
      })
      .select()
      .single();
    if (ticketError) throw ticketError;

    const { error: messageError } = await admin.from("support_messages").insert({
      ticket_id: ticket.id,
      sender_id: caller.user.id,
      is_from_admin: false,
      message: message.trim(),
    });
    if (messageError) throw messageError;

    return NextResponse.json({ ticket });
  } catch (e) {
    console.error("POST /api/support/tickets error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
