// Thématiques de campagnes proposées aux organisations (module Marketing
// Plan Business) pour contacter leurs propres clients. Balises disponibles :
// {{prenom}}, {{entreprise}} — remplacées par destinataire à l'envoi.
// Le contenu ci-dessous est juste le corps du message : le logo de
// l'organisation (si défini) et son pied de page sont ajoutés
// automatiquement autour, pas ici (voir org-branding.js).

export const ORG_EMAIL_THEMES = [
  { key: "custom", label: "Mail personnalisé" },
  { key: "bienvenue", label: "Bienvenue nouveau client" },
  { key: "relance", label: "Relance / suivi" },
  { key: "promotion", label: "Promotion / offre" },
  { key: "annonce", label: "Nouveau produit / service" },
  { key: "newsletter", label: "Newsletter" },
];

const button = (href, label) =>
  `<a href="${href}" style="display:inline-block;background:#5E5CE6;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;margin-top:16px">${label}</a>`;

export const ORG_EMAIL_PRESETS = {
  bienvenue: {
    name: "Bienvenue nouveau client",
    subject: "Bienvenue {{entreprise}} !",
    html: `<p>Bonjour {{prenom}},</p>
      <p>Merci de votre confiance ! Nous sommes ravis de compter <strong>{{entreprise}}</strong> parmi nos clients. N'hésitez pas à nous contacter pour toute question.</p>
      ${button("#", "Nous contacter")}`,
  },
  relance: {
    name: "Relance / suivi",
    subject: "{{prenom}}, où en êtes-vous ?",
    html: `<p>Bonjour {{prenom}},</p>
      <p>Nous revenons vers vous concernant notre échange récent. N'hésitez pas à nous dire où vous en êtes, nous restons à votre disposition.</p>
      ${button("#", "Reprendre contact")}`,
  },
  promotion: {
    name: "Promotion / offre",
    subject: "Une offre spéciale pour {{entreprise}}",
    html: `<p>Bonjour {{prenom}},</p>
      <p>Pour une durée limitée, profitez d'une offre spéciale. Ne manquez pas cette occasion !</p>
      ${button("#", "En profiter")}`,
  },
  annonce: {
    name: "Nouveau produit / service",
    subject: "Une nouveauté qui pourrait vous intéresser",
    html: `<p>Bonjour {{prenom}},</p>
      <p>Nous venons de lancer une nouveauté qui pourrait intéresser <strong>{{entreprise}}</strong>. Découvrez-la dès maintenant.</p>
      ${button("#", "Découvrir")}`,
  },
  newsletter: {
    name: "Newsletter",
    subject: "Nos actualités du mois",
    html: `<p>Bonjour {{prenom}},</p>
      <p>Voici nos dernières actualités et quelques nouvelles à partager avec vous ce mois-ci.</p>`,
  },
};
