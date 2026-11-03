import { sendEmail } from "./resend";
import { logEmail } from "./log";

// Petit gabarit commun pour les emails internes envoyés au super admin
// (nouvelle inscription, paiement reçu, ticket support, retrait affiliation).
export function adminNotifTemplate(title, rows) {
  const rowsHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 12px 6px 0;color:#64748b;font-size:13px;white-space:nowrap">${label}</td>
          <td style="padding:6px 0;color:#1e293b;font-size:13px;font-weight:600">${value ?? "—"}</td>
        </tr>`
    )
    .join("");

  return `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
    <p style="font-size:18px;font-weight:700;color:#5E5CE6;margin:0 0 16px">Gestio</p>
    <h2 style="font-size:16px;margin:0 0 16px;color:#1e293b">${title}</h2>
    <table style="width:100%;border-collapse:collapse">${rowsHtml}</table>
  </div>`;
}

// Best-effort — ne doit jamais faire échouer le flux appelant (paiement,
// création de ticket, inscription...). `admin` est un client Supabase déjà
// créé avec createAdminClient() côté appelant. `category` identifie la
// nature de l'alerte (nouvelle_inscription, paiement, ticket_support,
// retrait_affiliation...) pour le journal visible dans /admin/marketing.
export async function notifyAdmin(admin, { subject, html, category }) {
  let adminEmail = null;
  try {
    if (!process.env.RESEND_API_KEY) return;

    const { data } = await admin
      .from("app_settings")
      .select("value")
      .eq("key", "admin_notify_email")
      .maybeSingle();
    adminEmail = data?.value;
    if (!adminEmail) return;

    await sendEmail({ to: adminEmail, subject, html });
    await logEmail(admin, { type: "notification", category, to: adminEmail, subject, status: "envoye" });
  } catch (e) {
    console.error("notifyAdmin failed:", e);
    if (adminEmail) {
      await logEmail(admin, { type: "notification", category, to: adminEmail, subject, status: "echec", error: e.message });
    }
  }
}
