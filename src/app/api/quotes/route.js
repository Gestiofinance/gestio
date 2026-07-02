import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getAuthUserAndOrg() {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("organization_id, organizations(id, quote_prefix, quote_next_seq)")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id || profile?.organizations?.id;
  const org = profile?.organizations || {};

  return { user, admin, orgId, org };
}

// POST — create quote with items
export async function POST(request) {
  try {
    const { user, admin, orgId, org, error } = await getAuthUserAndOrg();
    if (error) return NextResponse.json({ error }, { status: 401 });
    if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 400 });

    const { lines, ...quoteData } = await request.json();

    const prefix = org.quote_prefix || "DEV";
    const seq = org.quote_next_seq || 1;
    const number = `${prefix}-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;

    const { data: quote, error: qErr } = await admin
      .from("quotes")
      .insert({ ...quoteData, quote_number: number, organization_id: orgId })
      .select()
      .single();
    if (qErr) return NextResponse.json({ error: qErr.message }, { status: 400 });

    if (lines?.length) {
      await admin.from("quote_items").insert(
        lines.map((l, i) => ({
          quote_id: quote.id,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          tax_rate: l.tax_rate,
          total: l.quantity * l.unit_price * (1 + l.tax_rate / 100),
          sort_order: i,
        }))
      );
    }

    await admin.from("organizations").update({ quote_next_seq: seq + 1 }).eq("id", orgId);

    return NextResponse.json({ quote });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT — update quote with items
export async function PUT(request) {
  try {
    const { admin, error } = await getAuthUserAndOrg();
    if (error) return NextResponse.json({ error }, { status: 401 });

    const { id, lines, ...quoteData } = await request.json();
    if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });

    await admin.from("quotes").update(quoteData).eq("id", id);

    if (lines !== undefined) {
      await admin.from("quote_items").delete().eq("quote_id", id);
    }

    if (lines?.length) {
      await admin.from("quote_items").insert(
        lines.map((l, i) => ({
          quote_id: id,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          tax_rate: l.tax_rate,
          total: l.quantity * l.unit_price * (1 + l.tax_rate / 100),
          sort_order: i,
        }))
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
