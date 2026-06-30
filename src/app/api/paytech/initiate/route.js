import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPlanLabel } from "@/lib/plans";

const PAYTECH_API_URL = "https://paytech.sn/api/payment/request-payment";

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

    const admin = createAdminClient();

    // Resolve organization server-side (bypasses client-side RLS issues)
    let organizationId = clientOrgId;
    let organizationName = clientOrgName || "Mon entreprise";

    if (!organizationId) {
      const supabaseServer = await createClient();
      const { data: { user } } = await supabaseServer.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
      }
      const { data: profile } = await admin
        .from("profiles")
        .select("organization_id, organizations(id, name)")
        .eq("id", user.id)
        .single();
      organizationId = profile?.organization_id || profile?.organizations?.id;
      organizationName = profile?.organizations?.name || clientOrgName || "Mon entreprise";
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: "Organisation introuvable. Veuillez contacter le support." },
        { status: 400 }
      );
    }

    // Fetch price from DB (editable by admin)
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
    const env = process.env.PAYTECH_ENV || "prod";
    const refCommand = `GESTIO_${organizationId}_${planId}_${Date.now()}`;
    const commandName = `Gestio ${getPlanLabel(planId)} — ${
      billingCycle === "monthly" ? "Mensuel" : billingCycle === "annual" ? "Annuel" : "Trimestriel"
    }`;

    const paytechBody = {
      item_name: commandName,
      item_price: amount,
      currency: "XOF",
      ref_command: refCommand,
      command_name: commandName,
      env,
      success_url: `${appUrl}/dashboard/abonnement?success=1`,
      cancel_url: `${appUrl}/dashboard/abonnement?cancelled=1`,
      ipn_url: `${appUrl}/api/paytech/webhook`,
      custom_field: JSON.stringify({ organizationId, planId, billingCycle, refCommand }),
    };

    const paytechRes = await fetch(PAYTECH_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        API_KEY: process.env.PAYTECH_API_KEY || "",
        API_SECRET: process.env.PAYTECH_API_SECRET || "",
      },
      body: JSON.stringify(paytechBody),
    });

    const paytechData = await paytechRes.json();

    if (paytechData.success !== 1 || !paytechData.token) {
      console.error("PayTech error:", paytechData);
      return NextResponse.json(
        { error: "Erreur PayTech: " + (paytechData.message || paytechData.error || "Réponse invalide") },
        { status: 502 }
      );
    }

    // Upsert subscription as pending
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
      paytech_token: paytechData.token,
      paytech_ref: refCommand,
    };

    if (existingSub) {
      await admin.from("subscriptions").update(subPayload).eq("id", existingSub.id);
    } else {
      await admin.from("subscriptions").insert(subPayload);
    }

    // Create pending payment record
    await admin.from("subscription_payments").insert({
      organization_id: organizationId,
      plan_id: planId,
      billing_cycle: billingCycle,
      amount,
      status: "pending",
      paytech_token: paytechData.token,
      paytech_ref: refCommand,
      subscription_id: existingSub?.id || null,
    });

    return NextResponse.json({
      redirect_url: paytechData.redirect_url || paytechData.redirectUrl,
    });
  } catch (error) {
    console.error("PayTech initiate error:", error);
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 });
  }
}
