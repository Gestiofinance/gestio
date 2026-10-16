import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public — appelé côté client dès qu'un visiteur arrive avec ?ref=CODE.
export async function POST(request) {
  try {
    const { code } = await request.json();
    if (!code) return NextResponse.json({ ok: true });

    const admin = createAdminClient();
    const { data: affiliate } = await admin
      .from("affiliates")
      .select("id")
      .eq("code", String(code).toUpperCase())
      .maybeSingle();

    if (affiliate) {
      await admin.from("affiliate_clicks").insert({ affiliate_id: affiliate.id });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
