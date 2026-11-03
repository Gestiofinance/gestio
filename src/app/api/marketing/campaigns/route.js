import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveClientRecipients } from "@/lib/email/org-recipients";
import { sendEmailBatch, renderMergeTags, hasResendKey } from "@/lib/email/resend";
import { logEmail } from "@/lib/email/log";
import { getOrgMarketingAccess, getOrgQuota } from "@/lib/email/quota";
import { wrapWithOrgBranding } from "@/lib/email/org-branding";

async function getOrgId(admin) {
  const supabaseServer = await createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data: profile } = await admin.from("profiles").select("organization_id").eq("id", user.id).single();
  if (!profile?.organization_id) return { error: "Organisation introuvable" };

  return { orgId: profile.organization_id };
}

export async function GET() {
  try {
    const admin = createAdminClient();
    const { orgId, error } = await getOrgId(admin);
    if (error) return NextResponse.json({ error }, { status: 401 });

    const { data: campaigns, error: dbError } = await admin
      .from("email_campaigns")
      .select("*")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    if (dbError) throw dbError;

    return NextResponse.json({ campaigns: campaigns || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = createAdminClient();
    const { orgId, error } = await getOrgId(admin);
    if (error) return NextResponse.json({ error }, { status: 401 });

    if (!hasResendKey()) {
      return NextResponse.json({ error: "Envoi d'emails indisponible pour le moment. Contactez le support." }, { status: 400 });
    }

    const { allowed } = await getOrgMarketingAccess(admin, orgId);
    if (!allowed) return NextResponse.json({ error: "Module Marketing réservé au Plan Business" }, { status: 403 });

    const quota = await getOrgQuota(admin, orgId);
    if (quota.dailyUsed >= quota.dailyLimit) {
      return NextResponse.json({ error: "Vous avez déjà envoyé une campagne aujourd'hui. Réessayez demain." }, { status: 429 });
    }

    const { name, theme, subject, html, filters } = await request.json();
    if (!name?.trim() || !subject?.trim() || !html?.trim()) {
      return NextResponse.json({ error: "Nom, objet et contenu requis" }, { status: 400 });
    }

    const recipients = await resolveClientRecipients(admin, orgId, filters || {});
    if (recipients.length === 0) {
      return NextResponse.json({ error: "Aucun destinataire ne correspond à ces filtres." }, { status: 400 });
    }
    if (recipients.length > quota.recipientLimit) {
      return NextResponse.json({ error: `Trop de destinataires (${recipients.length}). Maximum ${quota.recipientLimit} par envoi — affinez vos filtres.` }, { status: 400 });
    }
    if (recipients.length > quota.monthlyRemaining) {
      return NextResponse.json({ error: `Quota mensuel insuffisant : il vous reste ${quota.monthlyRemaining} email(s) sur ${quota.monthlyLimit} ce mois-ci.` }, { status: 400 });
    }

    const { data: org } = await admin
      .from("organizations")
      .select("name, logo_url, address, city, phone, email")
      .eq("id", orgId)
      .maybeSingle();

    const { data: campaign, error: createError } = await admin
      .from("email_campaigns")
      .insert({
        organization_id: orgId,
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
      const prepared = chunk.map((r) => {
        const vars = { prenom: (r.name || "").split(" ")[0] || "là", entreprise: r.orgName };
        return {
          recipient: r,
          to: r.email,
          subject: renderMergeTags(subject.trim(), vars),
          html: wrapWithOrgBranding(renderMergeTags(html, vars), org),
        };
      });
      try {
        await sendEmailBatch(prepared.map(({ to, subject: s, html: h }) => ({ to, subject: s, html: h })));
        sentCount += chunk.length;
        await Promise.all(prepared.map((p) =>
          logEmail(admin, { type: "campagne", category: theme || null, campaignId: campaign.id, to: p.to, name: p.recipient.name, subject: p.subject, status: "envoye" })
        ));
      } catch (e) {
        console.error("Org campaign batch send failed:", e);
        failedCount += chunk.length;
        await Promise.all(prepared.map((p) =>
          logEmail(admin, { type: "campagne", category: theme || null, campaignId: campaign.id, to: p.to, name: p.recipient.name, subject: p.subject, status: "echec", error: e.message })
        ));
      }
    }

    const finalStatus = sentCount === 0 ? "echec" : "envoyee";
    const { data: updated, error: updateError } = await admin
      .from("email_campaigns")
      .update({ status: finalStatus, sent_count: sentCount, failed_count: failedCount, sent_at: new Date().toISOString() })
      .eq("id", campaign.id)
      .select()
      .single();
    if (updateError) throw updateError;

    return NextResponse.json({ campaign: updated });
  } catch (e) {
    console.error("POST /api/marketing/campaigns error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
