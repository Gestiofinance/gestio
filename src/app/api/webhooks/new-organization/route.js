import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAdmin, adminNotifTemplate } from "@/lib/email/notify-admin";

// Reçoit le Database Webhook Supabase sur INSERT de la table `organizations`
// (à créer manuellement dans Supabase : Database → Webhooks → table
// organizations → événement INSERT → POST vers cette URL, en-tête
// "x-webhook-secret" = SUPABASE_DB_WEBHOOK_SECRET). Notifie le super admin
// à chaque nouvelle inscription, quel que soit le parcours (email ou Google).
export async function POST(request) {
  try {
    const secret = request.headers.get("x-webhook-secret");
    if (!process.env.SUPABASE_DB_WEBHOOK_SECRET || secret !== process.env.SUPABASE_DB_WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const payload = await request.json();
    const org = payload?.record;
    if (!org?.id) return NextResponse.json({ received: true });

    const admin = createAdminClient();
    const { data: owner } = await admin
      .from("profiles")
      .select("full_name, email")
      .eq("organization_id", org.id)
      .eq("role", "proprietaire")
      .maybeSingle();

    await notifyAdmin(admin, {
      subject: `Nouvelle inscription — ${org.name}`,
      html: adminNotifTemplate("Nouvelle inscription", [
        ["Entreprise", org.name],
        ["Propriétaire", owner?.full_name],
        ["Email", owner?.email],
        ["Date", org.created_at ? new Date(org.created_at).toLocaleString("fr-FR") : null],
      ]),
    });

    return NextResponse.json({ received: true });
  } catch (e) {
    console.error("new-organization webhook error:", e);
    return NextResponse.json({ received: true });
  }
}
