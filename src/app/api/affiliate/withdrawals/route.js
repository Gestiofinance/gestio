import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { notifyAdmin, adminNotifTemplate } from "@/lib/email/notify-admin";

const ORG_ADMIN_ROLES = ["proprietaire", "administrateur"];

async function getCallerAffiliate(admin) {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return { error: "Non authentifié", status: 401 };

  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id, role")
    .eq("id", user.id)
    .single();
  if (!profile?.organization_id || !ORG_ADMIN_ROLES.includes(profile.role)) {
    return { error: "Réservé aux administrateurs", status: 403 };
  }

  const { data: affiliate } = await admin
    .from("affiliates")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .maybeSingle();
  if (!affiliate) return { error: "Aucun compte d'affiliation", status: 404 };

  return { affiliate };
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { affiliate, error, status } = await getCallerAffiliate(admin);
    if (error) return NextResponse.json({ error }, { status });

    const { data: withdrawals } = await admin
      .from("affiliate_withdrawals")
      .select("*")
      .eq("affiliate_id", affiliate.id)
      .order("requested_at", { ascending: false });

    return NextResponse.json({ withdrawals: withdrawals || [] });
  } catch (e) {
    console.error("GET /api/affiliate/withdrawals error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = createAdminClient();
    const { affiliate, error, status } = await getCallerAffiliate(admin);
    if (error) return NextResponse.json({ error }, { status });

    const { amount, phone } = await request.json();
    const amt = parseFloat(amount);

    const { data: settingRow } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "affiliate_min_withdrawal")
      .maybeSingle();
    const minWithdrawal = parseFloat(settingRow?.value) || 10000;

    if (!amt || amt <= 0) return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    if (amt < minWithdrawal) {
      return NextResponse.json({ error: `Le retrait minimum est de ${minWithdrawal.toLocaleString("fr-FR")} FCFA` }, { status: 400 });
    }
    if (amt > Number(affiliate.balance)) return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
    if (!phone?.trim()) return NextResponse.json({ error: "Numéro de téléphone requis" }, { status: 400 });

    const { data: withdrawal, error: insertError } = await admin
      .from("affiliate_withdrawals")
      .insert({ affiliate_id: affiliate.id, amount: amt, phone: phone.trim() })
      .select()
      .single();
    if (insertError) throw insertError;

    const { data: org } = await admin.from("organizations").select("name").eq("id", affiliate.organization_id).maybeSingle();
    await notifyAdmin(admin, {
      subject: `Nouvelle demande de retrait — ${amt.toLocaleString("fr-FR")} FCFA`,
      html: adminNotifTemplate("Demande de retrait affiliation", [
        ["Entreprise", org?.name],
        ["Montant", `${amt.toLocaleString("fr-FR")} FCFA`],
        ["Téléphone", phone.trim()],
      ]),
    });

    return NextResponse.json({ withdrawal });
  } catch (e) {
    console.error("POST /api/affiliate/withdrawals error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
