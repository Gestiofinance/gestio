import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BICTORYS_API_URL = process.env.BICTORYS_API_URL || "https://api.bictorys.com";

// Redirect-page mode (no payment_type query param): Bictorys hosts a checkout
// page where the customer picks Wave/Orange Money/Card themselves — same UX
// as the previous PayTech integration.
async function createBictorysCharge(body) {
  const MAX_RETRIES = 3;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));

    const res = await fetch(`${BICTORYS_API_URL}/pay/v1/charges`, {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.BICTORYS_API_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) return { ok: true, data: await res.json() };

    const text = await res.text();
    // WAF rate-limit returns HTML instead of JSON — retry with backoff
    if (res.status === 403 && text.includes("Forbidden") && attempt < MAX_RETRIES) continue;

    return { ok: false, status: res.status, text };
  }
  return { ok: false, status: 0, text: "max retries reached" };
}

export async function POST(request) {
  try {
    const {
      planId,
      billingCycle,
      organizationId: clientOrgId,
      organizationName: clientOrgName,
    } = await request.json();

    if (!planId || !billingCycle) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const supabaseServer = await createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

    const admin = createAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("full_name, email, phone, organization_id, organizations(id, name)")
      .eq("id", user.id)
      .single();

    const organizationId = clientOrgId || profile?.organization_id || profile?.organizations?.id;
    const organizationName = profile?.organizations?.name || clientOrgName || "Mon entreprise";

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organisation introuvable. Veuillez contacter le support." },
        { status: 400 }
      );
    }

    const { data: priceRow } = await admin
      .from("plan_prices")
      .select("price")
      .eq("plan_id", planId)
      .eq("cycle", billingCycle)
      .single();
    const amount = priceRow?.price;
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Prix introuvable pour ce plan. Veuillez contacter le support." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const paymentReference = `GESTIO_${organizationId}_${planId}_${billingCycle}_${Date.now()}`;

    const chargeBody = {
      amount,
      currency: "XOF",
      country: "SN",
      paymentReference,
      successRedirectUrl: `${appUrl}/dashboard/abonnement?success=1`,
      ErrorRedirectUrl: `${appUrl}/dashboard/abonnement?cancelled=1`,
      customerObject: {
        name: profile?.full_name || organizationName,
        ...(profile?.phone ? { phone: profile.phone } : {}),
        ...(profile?.email ? { email: profile.email } : {}),
        country: "SN",
      },
    };

    const result = await createBictorysCharge(chargeBody);
    if (!result.ok || !result.data?.redirectUrl) {
      console.error("Bictorys charge error:", result.status, result.text);
      return NextResponse.json(
        { error: "Erreur Bictorys: impossible d'initier le paiement." },
        { status: 502 }
      );
    }

    const { transactionId, redirectUrl } = result.data;

    const { data: existingSub } = await admin
      .from("subscriptions")
      .select("id, status")
      .eq("organization_id", organizationId)
      .maybeSingle();

    const subPayload = {
      organization_id: organizationId,
      plan_id: planId,
      billing_cycle: billingCycle,
      status: existingSub?.status === "active" ? "active" : "trial",
      amount,
      payment_token: transactionId,
      payment_ref: paymentReference,
    };

    if (existingSub) {
      await admin.from("subscriptions").update(subPayload).eq("id", existingSub.id);
    } else {
      await admin.from("subscriptions").insert(subPayload);
    }

    await admin.from("subscription_payments").insert({
      organization_id: organizationId,
      plan_id: planId,
      billing_cycle: billingCycle,
      amount,
      status: "pending",
      payment_token: transactionId,
      payment_ref: paymentReference,
      subscription_id: existingSub?.id || null,
    });

    return NextResponse.json({ redirect_url: redirectUrl });
  } catch (error) {
    console.error("Bictorys initiate error:", error);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}
