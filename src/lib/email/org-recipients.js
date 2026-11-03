// Résout les destinataires d'une campagne organisation : ses propres clients
// (table clients, filtrés par organization_id), avec filtres optionnels sur
// le statut et le produit/offre qui les intéresse.
export async function resolveClientRecipients(admin, orgId, filters = {}) {
  const { data: clients } = await admin
    .from("clients")
    .select("id, company_name, contact_name, email, status, interested_product_id")
    .eq("organization_id", orgId)
    .not("email", "is", null)
    .neq("email", "");

  const statuses = filters.statuses?.length ? filters.statuses : null;
  const productIds = filters.productIds?.length ? filters.productIds : null;

  return (clients || [])
    .filter((c) => {
      if (statuses && !statuses.includes(c.status)) return false;
      if (productIds && !productIds.includes(c.interested_product_id)) return false;
      return true;
    })
    .map((c) => ({
      id: c.id,
      name: c.contact_name,
      orgName: c.company_name || c.contact_name,
      email: c.email,
    }));
}
