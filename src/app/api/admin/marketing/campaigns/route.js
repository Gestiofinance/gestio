import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveRecipients } from "@/lib/email/recipients";
import { sendEmailBatch, renderMergeTags, hasResendKey } from "@/lib/email/resend";

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
    const { data: campaigns, error } = await admin
      .from("email_campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ campaigns: campaigns || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireSuperAdmin();
    if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

    if (!hasResendKey()) {
      return NextResponse.json({ error: "RESEND_API_KEY non configurée dans les variables d'environnement" }, { status: 400 });
    }

    const { name, theme, subject, html, filters } = await request.json();
    if (!name?.trim() || !subject?.trim() || !html?.trim()) {
      return NextResponse.json({ error: "Nom, objet et contenu requis" }, { status: 400 });
    }

    const admin = createAdminClient();
    const recipients = await resolveRecipients(admin, filters || {});

    const { data: campaign, error: createError } = await admin
      .from("email_campaigns")
      .insert({
        name: name.trim(),
        theme: theme || null,
        subject: subject.trim(),
        html_body: html,
        filters: filters || {},
        status: "envoi_en_cours",
        recipient_count: recipients.length,
      })
      .select()
      .single();
    if (createError) throw createError;

    let sentCount = 0;
    let failedCount = 0;

    for (let i = 0; i < recipients.length; i += 100) {
      const chunk = recipients.slice(i, i + 100);
      const emails = chunk.map((r) => {
        const vars = { prenom: (r.name || "").split(" ")[0] || "là", entreprise: r.orgName };
        return {
          to: r.email,
          subject: renderMergeTags(subject.trim(), vars),
          html: renderMergeTags(html, vars),
        };
      });
      try {
        await sendEmailBatch(emails);
        sentCount += chunk.length;
      } catch (e) {
        console.error("Campaign batch send failed:", e);
        failedCount += chunk.length;
      }
    }

    const finalStatus = sentCount === 0 && recipients.length > 0 ? "echec" : "envoyee";
    const { data: updated, error: updateError } = await admin
      .from("email_campaigns")
      .update({
        status: finalStatus,
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaign.id)
      .select()
      .single();
    if (updateError) throw updateError;

    return NextResponse.json({ campaign: updated });
  } catch (e) {
    console.error("POST /api/admin/marketing/campaigns error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
