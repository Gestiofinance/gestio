import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { hasResendKey } from "@/lib/email/resend";

async function requireSuperAdmin() {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user || user.app_metadata?.is_super_admin !== true) return null;
  return user;
}

export async function GET() {
  try {
    const user = await requireSuperAdmin();
    if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const admin = createAdminClient();
    const { data } = await admin.from("app_settings").select("value").eq("key", "admin_notify_email").maybeSingle();

    return NextResponse.json({
      adminNotifyEmail: data?.value || "",
      hasResendKey: hasResendKey(),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await requireSuperAdmin();
    if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    const { adminNotifyEmail } = await request.json();
    if (!adminNotifyEmail?.trim()) return NextResponse.json({ error: "Email requis" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin
      .from("app_settings")
      .upsert({ key: "admin_notify_email", value: adminNotifyEmail.trim(), updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;

    return NextResponse.json({ success: true, adminNotifyEmail: adminNotifyEmail.trim() });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
