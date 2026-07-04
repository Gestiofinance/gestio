import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { name, email, company, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }

    // Envoi via Resend (gratuit — obtenir une clé sur resend.com)
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Gestio Contact <onboarding@resend.dev>",
          to: ["contact@gestio.sn"],
          subject: `Nouveau message de ${name}${company ? ` (${company})` : ""}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
              <h2 style="color:#5E5CE6">Nouveau message via Gestio.sn</h2>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:8px 0;color:#64748b;width:120px">Nom</td><td style="padding:8px 0;font-weight:600">${name}</td></tr>
                <tr><td style="padding:8px 0;color:#64748b">Email</td><td style="padding:8px 0"><a href="mailto:${email}">${email}</a></td></tr>
                ${company ? `<tr><td style="padding:8px 0;color:#64748b">Entreprise</td><td style="padding:8px 0">${company}</td></tr>` : ""}
                <tr><td style="padding:8px 0;color:#64748b;vertical-align:top">Message</td><td style="padding:8px 0;white-space:pre-wrap">${message}</td></tr>
              </table>
              <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0"/>
              <p style="color:#94a3b8;font-size:12px">Gestio — gestio.sn · +221 77 776 25 22</p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.error("Resend error:", err);
        return NextResponse.json({ error: "Erreur envoi email." }, { status: 500 });
      }
    } else {
      // Fallback : log le message si pas de clé Resend configurée
      console.log("Contact form submission:", { name, email, company, message });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Contact API error:", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
