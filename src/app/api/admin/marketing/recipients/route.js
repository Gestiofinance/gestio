import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveRecipients } from "@/lib/email/recipients";

async function requireSuperAdmin() {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user || user.app_metadata?.is_super_admin !== true) return null;
  return user;
}

// Aperçu : nombre de destinataires + échantillon, pour un jeu de filtres
// donné, avant l'envoi réel d'une campagne.
export async function POST(request) {
  try {
    const user = await requireSuperAdmin();
    if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { filters } = await request.json();
    const admin = createAdminClient();
    const recipients = await resolveRecipients(admin, filters || {});

    return NextResponse.json({ count: recipients.length, sample: recipients.slice(0, 10) });
  } catch (e) {
    console.error("POST /api/admin/marketing/recipients error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
