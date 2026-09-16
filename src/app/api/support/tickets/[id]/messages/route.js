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

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const admin = createAdminClient();
    const caller = await getCaller(admin);
    if (!caller) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const { data: ticket, error: ticketError } = await admin
      .from("support_tickets")
      .select("id, organization_id, status")
      .eq("id", id)
      .single();
    if (ticketError || !ticket) return NextResponse.json({ error: "Ticket introuvable" }, { status: 404 });

    const isOwnOrg = caller.profile?.organization_id === ticket.organization_id;
    if (!caller.isSuperAdmin && !isOwnOrg) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { message } = await request.json();
    if (!message?.trim()) return NextResponse.json({ error: "Message requis" }, { status: 400 });

    const { data: newMessage, error } = await admin
      .from("support_messages")
      .insert({
        ticket_id: id,
        sender_id: caller.user.id,
        is_from_admin: caller.isSuperAdmin,
        message: message.trim(),
      })
      .select()
      .single();
    if (error) throw error;

    await admin
      .from("support_tickets")
      .update({
        status: caller.isSuperAdmin ? "answered" : "open",
        org_has_unread: caller.isSuperAdmin,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json({ message: newMessage });
  } catch (e) {
    console.error("POST /api/support/tickets/[id]/messages error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
