import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

function getPeriodEnd(billingCycle) {
  const end = new Date();
  if (billingCycle === "annual") end.setFullYear(end.getFullYear() + 1);
  else if (billingCycle === "quarterly") end.setMonth(end.getMonth() + 3);
  else end.setMonth(end.getMonth() + 1);
  return end.toISOString();
}

// Method 1 (HMAC, preferred) if X-Webhook-Signature is present, else
// Method 2 (static key comparison of X-Secret-Key) — both from Bictorys docs.
function verifyWebhook(rawBody, headers) {
  const secret = process.env.BICTORYS_WEBHOOK_SECRET || "";
  const signature = headers.get("x-webhook-signature");
  const timestamp = headers.get("x-webhook-timestamp");
  const secretKeyHeader = headers.get("x-secret-key");

  if (signature && timestamp) {
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Math.abs(Date.now() - ts) > 5 * 60 * 1000) return false; // replay protection
    const expected = crypto.createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  if (secretKeyHeader) {
    try {
      return crypto.timingSafeEqual(Buffer.from(secretKeyHeader), Buffer.from(secret));
    } catch {
      return false;
    }
  }

  return false;
}

export async function POST(request) {
  try {
    const rawBody = await request.text();

    if (!verifyWebhook(rawBody, request.headers)) {
      console.warn("Bictorys webhook: invalid signature");
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const payload = JSON.parse(rawBody);
    const { status, paymentReference, amount, currency, pspName } = payload;

    if (!["succeeded", "authorized"].includes(status)) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const supabase = createAdminClient();

    // The pending payment created by /api/bictorys/initiate holds org/plan/cycle.
    const { data: payment } = await supabase
      .from("subscription_payments")
      .select("id, status, organization_id, plan_id, billing_cycle, amount")
      .eq("payment_ref", paymentReference || "")
      .maybeSingle();

    if (!payment) {
      console.error("Bictorys webhook: unknown paymentReference", paymentReference);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Idempotency: a webhook already processed for this reference is a no-op
    if (payment.status === "completed") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Anti-fraud: currency must match and the customer must have paid at least the plan price
    if ((currency && currency !== "XOF") || Number(amount) < Number(payment.amount)) {
      console.error("Bictorys webhook: amount/currency mismatch", { paymentReference, amount, currency, expected: payment.amount });
      return NextResponse.json({ received: true }, { status: 200 });
    }

    const { organization_id: organizationId, plan_id: planId, billing_cycle: billingCycle } = payment;
    const now = new Date().toISOString();
    const periodEnd = getPeriodEnd(billingCycle);
    const finalAmount = payment.amount;

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("organization_id", organizationId)
      .maybeSingle();

    const subPayload = {
      plan_id: planId,
      billing_cycle: billingCycle,
      status: "active",
      amount: finalAmount,
      payment_ref: paymentReference,
      current_period_start: now,
      current_period_end: periodEnd,
    };

    const { error: subError } = existingSub
      ? await supabase.from("subscriptions").update({ ...subPayload, updated_at: now }).eq("id", existingSub.id)
      : await supabase.from("subscriptions").insert({ organization_id: organizationId, ...subPayload });

    const { error: payError } = await supabase
      .from("subscription_payments")
      .update({
        status: "completed",
        payment_method: pspName || null,
        paid_at: now,
        ...(existingSub?.id ? { subscription_id: existingSub.id } : {}),
      })
      .eq("id", payment.id);

    // A real payment must not be lost: on DB failure answer 500 so Bictorys
    // retries (safe — the handler is idempotent on payment_ref).
    if (subError || payError) {
      console.error("Bictorys webhook: DB write failed", subError || payError);
      return NextResponse.json({ received: false }, { status: 500 });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Bictorys webhook error:", error);
    // Always 200 — Bictorys retries 3x otherwise
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
