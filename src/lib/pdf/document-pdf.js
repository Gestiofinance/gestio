import { Document, Page, Text, View, Image } from "@react-pdf/renderer";
import { templateMap, buildDynamicStyles } from "./styles";

function formatCurrency(amount) {
  const num = Math.round(Number(amount) || 0);
  const formatted = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${formatted} FCFA`;
}

function formatDate(date) {
  if (!date) return "—";
  const months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  const d = new Date(date);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function DocumentPDF({ type, data, items, organization, template = "moderne" }) {
  const brandColor = organization?.brand_color || "#5E5CE6";
  const s = buildDynamicStyles(template, brandColor);
  const isQuote = type === "devis";
  const docLabel = isQuote ? "DEVIS" : "FACTURE";
  const docNumber = isQuote ? data.quote_number : data.invoice_number;
  const clientName = data.clients?.company_name || data.clients?.contact_name || "—";

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            {organization?.logo_url ? (
              <Image src={organization.logo_url} style={{ width: 120, height: 40, objectFit: "contain", marginBottom: 4 }} />
            ) : (
              <Text style={s.logo}>{organization?.name || "Gestio"}</Text>
            )}
            {organization?.address && <Text style={s.infoText}>{organization.address}</Text>}
            {organization?.city && <Text style={s.infoText}>{organization.city}, {organization?.country || "Sénégal"}</Text>}
            {organization?.phone && <Text style={s.infoText}>{organization.phone}</Text>}
            {organization?.email && <Text style={s.infoText}>{organization.email}</Text>}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.docType}>{docLabel}</Text>
            <Text style={s.docNumber}>{docNumber}</Text>
            {!isQuote && data.type !== "standard" && (
              <Text style={s.badge}>{data.type?.toUpperCase()}</Text>
            )}
          </View>
        </View>

        {/* Accent bar */}
        <View style={s.accentBar} />

        {/* Info section */}
        <View style={s.infoSection}>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Émetteur</Text>
            <Text style={s.infoTitle}>{organization?.name || "—"}</Text>
            {organization?.ninea && <Text style={s.infoText}>NINEA : {organization.ninea}</Text>}
            {organization?.rccm && <Text style={s.infoText}>RCCM : {organization.rccm}</Text>}
          </View>
          <View style={s.infoBlock}>
            <Text style={s.infoLabel}>Client</Text>
            <Text style={s.infoTitle}>{clientName}</Text>
            {data.clients?.email && <Text style={s.infoText}>{data.clients.email}</Text>}
            {data.clients?.phone && <Text style={s.infoText}>{data.clients.phone}</Text>}
            {data.clients?.address && <Text style={s.infoText}>{data.clients.address}</Text>}
            {data.clients?.ninea && <Text style={s.infoText}>NINEA : {data.clients.ninea}</Text>}
          </View>
        </View>

        {/* Meta row */}
        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Date d&apos;émission</Text>
            <Text style={s.metaValue}>{formatDate(data.issue_date)}</Text>
          </View>
          {isQuote && data.expiry_date && (
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Valable jusqu&apos;au</Text>
              <Text style={s.metaValue}>{formatDate(data.expiry_date)}</Text>
            </View>
          )}
          {!isQuote && data.due_date && (
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Échéance</Text>
              <Text style={s.metaValue}>{formatDate(data.due_date)}</Text>
            </View>
          )}
          {!isQuote && (
            <View style={s.metaItem}>
              <Text style={s.metaLabel}>Conditions</Text>
              <Text style={s.metaValue}>Paiement à 30 jours</Text>
            </View>
          )}
        </View>

        {/* Table */}
        <View style={s.tableHeader}>
          <View style={s.cellDesc}><Text style={s.tableHeaderText}>Description</Text></View>
          <View style={s.cellQty}><Text style={s.tableHeaderText}>Qté</Text></View>
          <View style={s.cellPrice}><Text style={s.tableHeaderText}>Prix unit.</Text></View>
          <View style={s.cellTotal}><Text style={s.tableHeaderText}>Total HT</Text></View>
        </View>
        {(items || []).map((item, i) => (
          <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
            <View style={s.cellDesc}><Text style={s.cellText}>{item.description}</Text></View>
            <View style={s.cellQty}><Text style={s.cellText}>{item.quantity}</Text></View>
            <View style={s.cellPrice}><Text style={s.cellText}>{formatCurrency(item.unit_price)}</Text></View>
            <View style={s.cellTotal}><Text style={s.cellText}>{formatCurrency(item.quantity * item.unit_price)}</Text></View>
          </View>
        ))}

        {/* Totals */}
        <View style={s.totalsSection}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Sous-total HT</Text>
              <Text style={s.totalValue}>{formatCurrency(data.subtotal)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>TVA ({data.tax_rate || 18}%)</Text>
              <Text style={s.totalValue}>{formatCurrency(data.tax_amount)}</Text>
            </View>
            {Number(data.discount_amount) > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Remise</Text>
                <Text style={s.totalValue}>-{formatCurrency(data.discount_amount)}</Text>
              </View>
            )}
            <View style={s.totalRowFinal}>
              <Text style={s.totalFinalLabel}>Total TTC</Text>
              <Text style={s.totalFinalValue}>{formatCurrency(data.total)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {data.notes && (
          <View style={s.notes}>
            <Text style={s.notesLabel}>Notes</Text>
            <Text style={s.notesText}>{data.notes}</Text>
          </View>
        )}

        {/* Bank info for invoices */}
        {!isQuote && (organization?.bank_name || organization?.mobile_money) && (
          <View style={{ ...s.notes, marginTop: 10 }}>
            <Text style={s.notesLabel}>Informations de paiement</Text>
            {organization.bank_name && <Text style={s.notesText}>Banque : {organization.bank_name}</Text>}
            {organization.bank_account && <Text style={s.notesText}>Compte : {organization.bank_account}</Text>}
            {organization.bank_iban && <Text style={s.notesText}>IBAN : {organization.bank_iban}</Text>}
            {organization.mobile_money && <Text style={s.notesText}>Mobile Money : {organization.mobile_money}</Text>}
          </View>
        )}

        {/* Stamp / Signature */}
        {data.apply_stamp && organization?.stamp_url && (
          <View style={{ marginTop: 20, alignItems: "flex-end" }}>
            <Image src={organization.stamp_url} style={{ width: 140, height: 70, objectFit: "contain" }} />
          </View>
        )}

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.footerLine} />
          <Text style={s.footerText}>
            {organization?.name || "Gestio"} — {organization?.address ? `${organization.address}, ` : ""}{organization?.city || ""} {organization?.country || "Sénégal"}
          </Text>
          {organization?.ninea && <Text style={s.footerText}>NINEA : {organization.ninea} {organization?.rccm ? `— RCCM : ${organization.rccm}` : ""}</Text>}
        </View>
      </Page>
    </Document>
  );
}
