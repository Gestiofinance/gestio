import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function getPeriodEnd(billingCycle) {
  const now = new Date();
  const end = new Date(now);
  if (billingCycle === "annual") end.setFullYear(end.getFullYear() + 1);
  else if (billingCycle === "quarterly") end.setMonth(end.getMonth() + 3);
  else end.setMonth(end.getMonth() + 1);
  return end.toISOString();
}

export async function POST(request) {
  try {
    let body;
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      // PayTech sends form-encoded data
      const text = await request.text();
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    }

    const { type_event, token, ref_command, custom_field } = body;

    // Only process completed sales
    if (type_event !== "sale_complete") {
      return NextResponse.json({ received: true });
    }

    // Verify payment with PayTech
    const verifyRes = await fetch(`https://paytech.sn/api/payment/verify/${token}`, {
      headers: {
        API_KEY: process.env.PAYTECH_API_KEY || "",
        API_SECRET: process.env.PAYTECH_API_SECRET || "",
      },
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.success || verifyData.payment?.status !== "Completed") {
      console.warn("PayTech IPN: payment not completed", verifyData);
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Parse custom_field
    let meta = {};
    try {
      meta = JSON.parse(custom_field || "{}");
    } catch {
      // Try to parse command_name: gestio_sub_{orgId}_{planId}_{cycle}_{ts}
      const parts = (ref_command || "").split("_");
      if (parts.length >= 6) {
        meta = { organizationId: parts[2], planId: parts[3], billingCycle: parts[4] };
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
    const amount = verifyData.payment?.amount || 0;

    // Update subscription to active
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("organization_id", organizationId)
      .single();

    if (existingSub) {
      await supabase.from("subscriptions").update({
        plan_id: planId,
        billing_cycle: billingCycle,
        status: "active",
        amount,
        paytech_token: token,
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
        paytech_token: token,
        paytech_ref: ref_command,
        current_period_start: now,
        current_period_end: periodEnd,
      });
    }

    // Update payment record to completed
    const { data: pendingPay } = await supabase
      .from("subscription_payments")
      .select("id")
      .eq("paytech_token", token)
      .eq("status", "pending")
      .maybeSingle();

    if (pendingPay) {
      await supabase.from("subscription_payments").update({
        status: "completed",
        paytech_ref: ref_command,
        payment_method: verifyData.payment?.payment_method || null,
        paid_at: now,
      }).eq("id", pendingPay.id);
    } else {
      // Insert new if not found
      await supabase.from("subscription_payments").insert({
        organization_id: organizationId,
        plan_id: planId,
        billing_cycle: billingCycle,
        amount,
        status: "completed",
        paytech_token: token,
        paytech_ref: ref_command,
        payment_method: verifyData.payment?.payment_method || null,
        paid_at: now,
        subscription_id: existingSub?.id || null,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PayTech webhook error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
