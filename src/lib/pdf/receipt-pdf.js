import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const BRAND = "#5E5CE6";
const DARK = "#0f172a";
const GRAY = "#64748b";
const LIGHT = "#f8fafc";
const BORDER = "#e2e8f0";

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", fontSize: 10, color: DARK, backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, paddingBottom: 20, borderBottomWidth: 2, borderBottomColor: BRAND },
  brandName: { fontSize: 24, fontFamily: "Helvetica-Bold", color: BRAND },
  brandTagline: { fontSize: 9, color: GRAY, marginTop: 3 },
  receiptLabel: { fontSize: 9, color: GRAY, textAlign: "right", letterSpacing: 1 },
  receiptNumber: { fontSize: 13, fontFamily: "Helvetica-Bold", color: DARK, textAlign: "right", marginTop: 2 },
  paidBadge: { marginTop: 6, alignSelf: "flex-end", backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  paidText: { fontSize: 9, color: "#16a34a", fontFamily: "Helvetica-Bold" },
  amountBox: { backgroundColor: LIGHT, borderWidth: 1, borderColor: BORDER, borderRadius: 8, padding: 20, marginBottom: 24, alignItems: "center" },
  amountLabel: { fontSize: 10, color: GRAY, marginBottom: 6 },
  amountValue: { fontSize: 34, fontFamily: "Helvetica-Bold", color: BRAND },
  grid: { flexDirection: "row", gap: 12, marginBottom: 24 },
  card: { flex: 1, backgroundColor: LIGHT, borderWidth: 1, borderColor: BORDER, borderRadius: 6, padding: 12 },
  cardLabel: { fontSize: 8, color: GRAY, marginBottom: 4, textTransform: "uppercase" },
  cardValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK },
  cardSub: { fontSize: 9, color: GRAY, marginTop: 2 },
  tableTitle: { fontSize: 8, color: GRAY, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: BORDER },
  rowFinal: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, marginTop: 2 },
  rowLabel: { fontSize: 10, color: GRAY },
  rowValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: DARK },
  rowFinalLabel: { fontSize: 11, fontFamily: "Helvetica-Bold", color: DARK },
  rowFinalValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: BRAND },
  footer: { marginTop: "auto", paddingTop: 18, borderTopWidth: 1, borderTopColor: BORDER, textAlign: "center", fontSize: 8, color: GRAY, lineHeight: 1.6 },
});

function fmt(amount) {
  const n = Math.round(Number(amount) || 0);
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
}

function fmtDate(date) {
  if (!date) return "—";
  const months = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  const d = new Date(date);
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

const PLAN_NAMES = { standard: "Standard", pro: "Pro", business: "Business" };
const CYCLE_LABELS = { monthly: "Mensuel", annual: "Annuel", quarterly: "Trimestriel" };

export function ReceiptPDF({ payment, organizationName }) {
  const receiptNumber = `REC-${(payment.id || "").slice(0, 8).toUpperCase()}`;
  const planName = PLAN_NAMES[payment.plan_id] || payment.plan_id || "—";
  const cycleLabel = CYCLE_LABELS[payment.billing_cycle] || payment.billing_cycle || "—";

  return (
    <Document title={`Reçu ${receiptNumber} — Gestio`}>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>Gestio</Text>
            <Text style={s.brandTagline}>Plateforme de gestion pour entrepreneurs</Text>
          </View>
          <View>
            <Text style={s.receiptLabel}>REÇU DE PAIEMENT</Text>
            <Text style={s.receiptNumber}>{receiptNumber}</Text>
            <View style={s.paidBadge}>
              <Text style={s.paidText}>✓ PAYÉ</Text>
            </View>
          </View>
        </View>

        {/* Amount */}
        <View style={s.amountBox}>
          <Text style={s.amountLabel}>Montant payé</Text>
          <Text style={s.amountValue}>{fmt(payment.amount)}</Text>
        </View>

        {/* Info grid */}
        <View style={s.grid}>
          <View style={s.card}>
            <Text style={s.cardLabel}>Client</Text>
            <Text style={s.cardValue}>{organizationName || "—"}</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardLabel}>Plan souscrit</Text>
            <Text style={s.cardValue}>{planName}</Text>
            <Text style={s.cardSub}>{cycleLabel}</Text>
          </View>
          <View style={s.card}>
            <Text style={s.cardLabel}>Date de paiement</Text>
            <Text style={s.cardValue}>{fmtDate(payment.paid_at || payment.created_at)}</Text>
          </View>
        </View>

        {/* Details */}
        <Text style={s.tableTitle}>Détails de la transaction</Text>
        <View style={s.row}>
          <Text style={s.rowLabel}>Référence</Text>
          <Text style={s.rowValue}>{payment.paytech_ref || receiptNumber}</Text>
        </View>
        {payment.payment_method && (
          <View style={s.row}>
            <Text style={s.rowLabel}>Moyen de paiement</Text>
            <Text style={s.rowValue}>{payment.payment_method}</Text>
          </View>
        )}
        <View style={s.row}>
          <Text style={s.rowLabel}>Service</Text>
          <Text style={s.rowValue}>Gestio {planName} — {cycleLabel}</Text>
        </View>
        <View style={s.row}>
          <Text style={s.rowLabel}>Montant</Text>
          <Text style={s.rowValue}>{fmt(payment.amount)}</Text>
        </View>
        <View style={s.rowFinal}>
          <Text style={s.rowFinalLabel}>Total payé</Text>
          <Text style={s.rowFinalValue}>{fmt(payment.amount)}</Text>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text>Ce reçu est généré automatiquement par la plateforme Gestio.</Text>
          <Text>Pour toute question, contactez-nous : support@gestio.sn</Text>
        </View>
      </Page>
    </Document>
  );
}
