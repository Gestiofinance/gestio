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
    .select("organization_id, organizations(id, invoice_prefix, invoice_next_seq)")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id || profile?.organizations?.id;
  const org = profile?.organizations || {};

  return { user, admin, orgId, org };
}

// POST — create invoice with items (or convert from quote)
export async function POST(request) {
  try {
    const { admin, orgId, org, error } = await getAuthUserAndOrg();
    if (error) return NextResponse.json({ error }, { status: 401 });
    if (!orgId) return NextResponse.json({ error: "Organisation introuvable" }, { status: 400 });

    const { lines, quoteId, quoteItems, ...invoiceData } = await request.json();

    const prefix = org.invoice_prefix || "FAC";
    const seq = org.invoice_next_seq || 1;
    const number = `${prefix}-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;

    const { data: invoice, error: iErr } = await admin
      .from("invoices")
      .insert({ ...invoiceData, invoice_number: number, organization_id: orgId })
      .select()
      .single();
    if (iErr) return NextResponse.json({ error: iErr.message }, { status: 400 });

    // Items: use provided lines or quoteItems (from convert)
    const itemSource = lines || quoteItems;
    if (itemSource?.length) {
      await admin.from("invoice_items").insert(
        itemSource.map((l, i) => ({
          invoice_id: invoice.id,
          description: l.description,
          quantity: l.quantity,
          unit_price: l.unit_price,
          tax_rate: l.tax_rate,
          total: l.quantity * l.unit_price * (1 + l.tax_rate / 100),
          sort_order: i,
        }))
      );
    }

    // If converting from quote, mark quote as converted
    if (quoteId) {
      await admin.from("quotes").update({ converted_to_invoice: true, status: "accepte" }).eq("id", quoteId);
    }

    await admin.from("organizations").update({ invoice_next_seq: seq + 1 }).eq("id", orgId);

    return NextResponse.json({ invoice });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PUT — update invoice with items
export async function PUT(request) {
  try {
    const { admin, error } = await getAuthUserAndOrg();
    if (error) return NextResponse.json({ error }, { status: 401 });

    const { id, lines, ...invoiceData } = await request.json();
    if (!id) return NextResponse.json({ error: "id manquant" }, { status: 400 });

    await admin.from("invoices").update(invoiceData).eq("id", id);

    // Only touch items if lines were explicitly provided
    if (lines !== undefined) {
      await admin.from("invoice_items").delete().eq("invoice_id", id);
    }

    if (lines?.length) {
      await admin.from("invoice_items").insert(
        lines.map((l, i) => ({
          invoice_id: id,
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

// PATCH — record a payment on an invoice
export async function PATCH(request) {
  try {
    const { admin, orgId, error } = await getAuthUserAndOrg();
    if (error) return NextResponse.json({ error }, { status: 401 });

    const { invoiceId, amount, payment_date, payment_method, reference, currentTotal, currentPaid } = await request.json();

    await admin.from("payments").insert({
      organization_id: orgId,
      invoice_id: invoiceId,
      amount,
      payment_date,
      payment_method,
      reference,
    });

    const newPaid = Number(currentPaid) + amount;
    const newStatus = newPaid >= Number(currentTotal) ? "payee" : "partiellement_payee";
    await admin.from("invoices").update({ paid_amount: newPaid, status: newStatus }).eq("id", invoiceId);

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
