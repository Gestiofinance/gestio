// Thématiques de campagnes proposées dans le composeur du module Marketing.
// Chaque thème a un modèle prédéfini (objet + HTML), chargé dans l'éditeur et
// librement personnalisable avant l'envoi. Balises disponibles : {{prenom}},
// {{entreprise}} — remplacées par destinataire au moment de l'envoi.

export const EMAIL_THEMES = [
  { key: "bienvenue", label: "Bienvenue" },
  { key: "relance_essai", label: "Relance essai" },
  { key: "nouveaute", label: "Nouveauté / Fonctionnalité" },
  { key: "promotion", label: "Promotion / Offre" },
  { key: "newsletter", label: "Newsletter" },
];

const button = (href, label) =>
  `<a href="${href}" style="display:inline-block;background:#5E5CE6;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;margin-top:16px">${label}</a>`;

const wrap = (body) => `<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b;line-height:1.6">
  <p style="font-size:20px;font-weight:700;color:#5E5CE6;margin:0 0 24px">Gestio</p>
  ${body}
  <p style="font-size:12px;color:#94a3b8;margin-top:40px">Gestio — Saly Portudal, Sénégal · <a href="https://gestio.sn" style="color:#94a3b8">gestio.sn</a></p>
</div>`;

export const EMAIL_PRESETS = {
  bienvenue: {
    name: "Bienvenue",
    subject: "Bienvenue sur Gestio, {{entreprise}} !",
    html: wrap(`
      <p>Bonjour {{prenom}},</p>
      <p>Bienvenue sur Gestio ! Votre compte pour <strong>{{entreprise}}</strong> est prêt. Vous avez votre période d'essai gratuite pour explorer tous les modules : clients, devis, factures, planning et plus encore.</p>
      ${button("https://gestio.sn/login", "Accéder à mon espace")}
    `),
  },
  relance_essai: {
    name: "Relance essai",
    subject: "{{prenom}}, votre essai Gestio touche à sa fin",
    html: wrap(`
      <p>Bonjour {{prenom}},</p>
      <p>Votre période d'essai sur Gestio arrive à échéance. Passez à un abonnement payant dès maintenant pour continuer à gérer <strong>{{entreprise}}</strong> sans interruption.</p>
      ${button("https://gestio.sn/dashboard/abonnement", "Choisir mon abonnement")}
    `),
  },
  nouveaute: {
    name: "Nouveauté",
    subject: "Une nouveauté vous attend sur Gestio",
    html: wrap(`
      <p>Bonjour {{prenom}},</p>
      <p>Nous venons d'ajouter une nouvelle fonctionnalité à Gestio pour faciliter encore plus la gestion de <strong>{{entreprise}}</strong>. Connectez-vous pour la découvrir.</p>
      ${button("https://gestio.sn/login", "Découvrir")}
    `),
  },
  promotion: {
    name: "Promotion",
    subject: "Une offre spéciale pour {{entreprise}}",
    html: wrap(`
      <p>Bonjour {{prenom}},</p>
      <p>Pour une durée limitée, profitez d'une offre spéciale sur votre abonnement Gestio. Ne manquez pas cette occasion de faire grandir <strong>{{entreprise}}</strong> à moindre coût.</p>
      ${button("https://gestio.sn/dashboard/abonnement", "En profiter")}
    `),
  },
  newsletter: {
    name: "Newsletter",
    subject: "Les actualités Gestio du mois",
    html: wrap(`
      <p>Bonjour {{prenom}},</p>
      <p>Voici les dernières actualités Gestio et quelques conseils pour mieux gérer <strong>{{entreprise}}</strong> ce mois-ci.</p>
      ${button("https://gestio.sn/login", "Accéder à mon espace")}
    `),
  },
};
