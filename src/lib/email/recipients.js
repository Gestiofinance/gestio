// Même logique de statut effectif que /admin/utilisateurs (un essai dont la
// date de fin est dépassée reste "trial" en base tant que rien ne le
// bascule) — dupliquée ici volontairement pour rester un module serveur
// autonome, sans dépendre d'une page client.
function getEffectiveStatus(sub) {
  if (!sub) return null;
  if (sub.status === "trial" && sub.trial_end && new Date(sub.trial_end) < new Date()) {
    return "trial_expired";
  }
  return sub.status;
}

// Résout la liste des destinataires (un par organisation — le propriétaire)
// selon des filtres optionnels { statuses: string[], plans: string[] }.
export async function resolveRecipients(admin, filters = {}) {
  const [{ data: organizations }, { data: subscriptions }, { data: profiles }] = await Promise.all([
    admin.from("organizations").select("id, name, created_at"),
    admin.from("subscriptions").select("*"),
    admin.from("profiles").select("id, full_name, email, role, organization_id"),
  ]);

  const statuses = filters.statuses?.length ? filters.statuses : null;
  const plans = filters.plans?.length ? filters.plans : null;

  const recipients = [];
  for (const org of organizations || []) {
    const sub = (subscriptions || []).find((s) => s.organization_id === org.id);
    const members = (profiles || []).filter((p) => p.organization_id === org.id);
    const owner = members.find((m) => m.role === "proprietaire") || members[0];
    if (!owner?.email) continue;

    const effStatus = getEffectiveStatus(sub) || "sans_abonnement";
    if (statuses && !statuses.includes(effStatus)) continue;

    const planValue = sub?.plan_id || "none";
    if (plans && !plans.includes(planValue)) continue;

    recipients.push({
      orgId: org.id,
      orgName: org.name,
      email: owner.email,
      name: owner.full_name || "",
      plan: planValue,
      status: effStatus,
    });
  }
  return recipients;
}
