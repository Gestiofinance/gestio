import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

function getPeriodEnd(billingCycle) {
  const end = new Date();
  if (billingCycle === "annual") end.setFullYear(end.getFullYear() + 1);
  else if (billingCycle === "quarterly") end.setMonth(end.getMonth() + 3);
  else end.setMonth(end.getMonth() + 1);
  return end.toISOString();
}

// PayTech IPN verification: compare sha256 hashes of API keys
function verifyPayTechIPN(body) {
  const { api_key_sha256, api_secret_sha256 } = body;
  if (!api_key_sha256 || !api_secret_sha256) return false;

  const expectedKey = createHash("sha256")
    .update(process.env.PAYTECH_API_KEY || "")
    .digest("hex");
  const expectedSecret = createHash("sha256")
    .update(process.env.PAYTECH_API_SECRET || "")
    .digest("hex");

  return api_key_sha256 === expectedKey && api_secret_sha256 === expectedSecret;
}

export async function POST(request) {
  try {
    let body;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const text = await request.text();
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    }

    // Verify the IPN comes from PayTech
    if (!verifyPayTechIPN(body)) {
      console.warn("PayTech IPN: invalid signature", { received: body.api_key_sha256 });
      return NextResponse.json({ error: "IPN KO - NOT FROM PAYTECH" }, { status: 403 });
    }

    const { type_event, ref_command, custom_field, item_price, payment_method } = body;

    // Only process completed sales
    if (type_event !== "sale_complete") {
      return new Response("IPN OK", { status: 200 });
    }

    // Parse custom_field
    let meta = {};
    try {
      meta = JSON.parse(custom_field || "{}");
    } catch {
      // Fallback: parse ref_command: GESTIO_{orgId}_{planId}_{cycle}_{ts}
      const parts = (ref_command || "").split("_");
      if (parts.length >= 4) {
        meta = { organizationId: parts[1], planId: parts[2], billingCycle: parts[3] };
      }
    }

    const { organizationId, planId, billingCycle } = meta;
    if (!organizationId || !planId || !billingCycle) {
      console.error("PayTech webhook: missing meta", meta);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();
    const periodEnd = getPeriodEnd(billingCycle);
    const amount = parseInt(item_price || "0", 10);

    // Update or create subscription as active
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (existingSub) {
      await supabase.from("subscriptions").update({
        plan_id: planId,
        billing_cycle: billingCycle,
        status: "active",
        amount,
        paytech_ref: ref_command,
        current_period_start: now,
        current_period_end: periodEnd,
        updated_at: now,
      }).eq("id", existingSub.id);
    } else {
      await supabase.from("subscriptions").insert({
        organization_id: organizationId,
        plan_id: planId,
        billing_cycle: billingCycle,
        status: "active",
        amount,
        paytech_ref: ref_command,
        current_period_start: now,
        current_period_end: periodEnd,
      });
    }

    // Update pending payment to completed
    const { data: pendingPay } = await supabase
      .from("subscription_payments")
      .select("id")
      .eq("paytech_ref", ref_command)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingPay) {
      await supabase.from("subscription_payments").update({
        status: "completed",
        payment_method: payment_method || null,
        paid_at: now,
      }).eq("id", pendingPay.id);
    } else {
      await supabase.from("subscription_payments").insert({
        organization_id: organizationId,
        plan_id: planId,
        billing_cycle: billingCycle,
        amount,
        status: "completed",
        paytech_ref: ref_command,
        payment_method: payment_method || null,
        paid_at: now,
        subscription_id: existingSub?.id || null,
      });
    }

    return new Response("IPN OK", { status: 200 });
  } catch (error) {
    console.error("PayTech webhook error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
