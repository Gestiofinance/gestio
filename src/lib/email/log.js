// Journal des envois — best-effort, ne doit jamais faire échouer le flux
// appelant. `admin` est un client Supabase déjà créé avec createAdminClient().
export async function logEmail(admin, { type, category, campaignId, to, name, subject, status, error }) {
  try {
    await admin.from("email_logs").insert({
      type,
      category: category || null,
      campaign_id: campaignId || null,
      recipient_email: to,
      recipient_name: name || null,
      subject,
      status,
      error_message: error || null,
    });
  } catch (e) {
    console.error("logEmail failed:", e);
  }
}
