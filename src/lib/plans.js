export const PLANS = {
  standard: {
    id: "standard",
    name: "Standard",
    description: "Pour démarrer et gérer votre activité",
    price_monthly: 9000,
    price_annual: Math.round(9000 * 12 * 0.88),   // 95 040 FCFA
    price_quarterly: null,
    max_users: 1,
    max_invoices: 15,
    max_quotes: 15,
    features: [
      "Accès à tous les modules",
      "1 utilisateur",
      "Jusqu'à 15 factures par mois",
      "Jusqu'à 15 devis par mois",
      "Support par email",
    ],
    color: "primary",
    popular: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "Pour les équipes en croissance",
    price_monthly: 14500,
    price_annual: Math.round(14500 * 12 * 0.88),  // 153 120 FCFA
    price_quarterly: null,
    max_users: null,
    max_invoices: null,
    max_quotes: null,
    features: [
      "Tout le plan Standard",
      "Utilisateurs illimités",
      "Factures et devis illimités",
      "Gestion d'équipe complète",
      "Signature de documents",
      "Support prioritaire",
    ],
    color: "violet",
    popular: true,
  },
  business: {
    id: "business",
    name: "Business",
    description: "Pour les entreprises établies",
    price_monthly: null,
    price_quarterly: 25000,
    price_annual: Math.round(25000 * 4 * 0.88),   // 88 000 FCFA
    max_users: null,
    max_invoices: null,
    max_quotes: null,
    features: [
      "Tout le plan Pro",
      "Signature de documents",
      "Accès complet à tous les modules",
      "Rapports financiers avancés",
      "Support dédié prioritaire",
      "Personnalisation avancée",
    ],
    color: "success",
    popular: false,
  },
};

export const BILLING_CYCLES = {
  monthly: { label: "Mensuel", discount: 0 },
  quarterly: { label: "Trimestriel", discount: 0 },
  annual: { label: "Annuel", discount: 12 },
};

export function getPlanPrice(planId, cycle) {
  const plan = PLANS[planId];
  if (!plan) return 0;
  if (cycle === "annual") return plan.price_annual;
  if (cycle === "quarterly") return plan.price_quarterly || plan.price_monthly * 3;
  return plan.price_monthly;
}

export function getPlanLabel(planId) {
  return PLANS[planId]?.name || planId;
}

export function getCycleLabel(cycle) {
  return BILLING_CYCLES[cycle]?.label || cycle;
}

export function getAnnualMonthlyEquivalent(planId) {
  const plan = PLANS[planId];
  if (!plan || !plan.price_annual) return 0;
  return Math.round(plan.price_annual / 12);
}

export function getAnnualSavings(planId) {
  const plan = PLANS[planId];
  if (!plan) return 0;
  const base = plan.price_quarterly ? plan.price_quarterly * 4 : (plan.price_monthly || 0) * 12;
  return base - plan.price_annual;
}
