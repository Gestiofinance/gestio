import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const admin = createAdminClient();
    const caller = await getCaller(admin);
    if (!caller) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: ticket, error } = await admin
      .from("support_tickets")
      .select("*, organizations(name)")
      .eq("id", id)
      .single();
    if (error || !ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

    const isOwnOrg = caller.profile?.organization_id === ticket.organization_id;
    if (!caller.isSuperAdmin && !isOwnOrg) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { data: messages, error: msgError } = await admin
      .from("support_messages")
      .select("*")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });
    if (msgError) throw msgError;

    // Opening the thread from the org side clears the unread flag
    if (!caller.isSuperAdmin && ticket.org_has_unread) {
      await admin.from("support_tickets").update({ org_has_unread: false }).eq("id", id);
      ticket.org_has_unread = false;
    }

    return NextResponse.json({ ticket, messages: messages || [] });
  } catch (e) {
    console.error("GET /api/support/tickets/[id] error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
