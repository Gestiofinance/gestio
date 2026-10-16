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

    const { status, adminNote } = await request.json();
    if (!["approuvee", "payee", "rejetee"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: withdrawal } = await admin
      .from("affiliate_withdrawals")
      .select("*, affiliates(id, balance, total_withdrawn)")
      .eq("id", id)
      .single();
    if (!withdrawal) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    if (!["en_attente", "approuvee"].includes(withdrawal.status)) {
      return NextResponse.json({ error: "Cette demande a déjà été traitée" }, { status: 400 });
    }

    if (status === "payee") {
      const affiliate = withdrawal.affiliates;
      if (Number(withdrawal.amount) > Number(affiliate.balance)) {
        return NextResponse.json({ error: "Solde de l'affilié insuffisant" }, { status: 400 });
      }
      const { error: balError } = await admin
        .from("affiliates")
        .update({
          balance: Number(affiliate.balance) - Number(withdrawal.amount),
          total_withdrawn: Number(affiliate.total_withdrawn) + Number(withdrawal.amount),
          updated_at: new Date().toISOString(),
        })
        .eq("id", affiliate.id);
      if (balError) throw balError;
    }

    const { data: updated, error } = await admin
      .from("affiliate_withdrawals")
      .update({ status, admin_note: adminNote || null, processed_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ withdrawal: updated });
  } catch (e) {
    console.error("PUT /api/admin/affiliate/withdrawals/[id] error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
