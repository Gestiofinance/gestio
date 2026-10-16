import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user || user.app_metadata?.is_super_admin !== true) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { status } = await request.json();
    if (!["actif", "suspendu"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: affiliate, error } = await admin
      .from("affiliates")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ affiliate });
  } catch (e) {
    console.error("PUT /api/admin/affiliate/[id] error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
