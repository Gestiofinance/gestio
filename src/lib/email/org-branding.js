// Habille le corps d'un email (saisi par l'utilisateur) avec le logo de
// l'organisation en en-tête (si présent) et ses coordonnées en pied de page
// (si renseignées) — aucune mention de Gestio. Utilisé à la fois côté client
// (aperçu live) et côté serveur (envoi réel), d'où un module pur sans
// dépendance Node.
export function wrapWithOrgBranding(bodyHtml, org) {
  const logoBlock = org?.logo_url
    ? `<div style="text-align:center;margin-bottom:20px"><img src="${org.logo_url}" alt="${org?.name || ""}" style="max-height:60px;max-width:220px" /></div>`
    : "";

  const footerLines = [
    org?.name,
    [org?.address, org?.city].filter(Boolean).join(", "),
    org?.phone,
    org?.email,
  ].filter(Boolean);

  const footerBlock = footerLines.length
    ? `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center">${footerLines.join(" · ")}</div>`
    : "";

  return `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1e293b;line-height:1.6">
    ${logoBlock}${bodyHtml}${footerBlock}
  </div>`;
}
