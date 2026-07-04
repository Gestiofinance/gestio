import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

function fmt(amount) {
  const num = Math.round(Number(amount) || 0);
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
}

function fmtDate(d) {
  if (!d) return "—";
  const months = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  const dt = new Date(d);
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

function fmtShort(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

const accent = "#5E5CE6";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, padding: 0, backgroundColor: "#fff" },

  headerBand: { backgroundColor: accent, paddingHorizontal: 40, paddingVertical: 24, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: {},
  logoImg: { width: 130, height: 44, objectFit: "contain" },
  orgName: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  headerRight: { alignItems: "flex-end" },
  reportTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#ffffff", textTransform: "uppercase", letterSpacing: 3 },
  reportDate: { fontSize: 9, color: "rgba(255,255,255,0.7)", marginTop: 3 },

  body: { paddingHorizontal: 40, paddingTop: 25, paddingBottom: 80 },

  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 25 },
  kpiCard: { flex: 1, padding: 16, borderRadius: 6, borderWidth: 1, borderColor: "#e2e8f0" },
  kpiCardAccent: { flex: 1, padding: 16, borderRadius: 6, backgroundColor: accent },
  kpiLabel: { fontSize: 8, color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  kpiLabelWhite: { fontSize: 8, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  kpiValue: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  kpiValueWhite: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  kpiValueRed: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#ef4444" },
  kpiValueGreen: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#22c55e" },

  section: { marginBottom: 22 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  sectionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: accent, marginRight: 8 },
  sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#0f172a" },

  summaryTable: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 6, overflow: "hidden" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  summaryRowAlt: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 8, backgroundColor: "#f8fafc", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  summaryRowTotal: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#0f172a" },
  summaryLabel: { fontSize: 10, color: "#475569" },
  summaryValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  summaryValueRed: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ef4444" },
  summaryTotalLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  summaryTotalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff" },

  tableHeader: { flexDirection: "row", backgroundColor: "#0f172a", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 4, marginBottom: 2 },
  tableHeaderText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#ffffff", textTransform: "uppercase", letterSpacing: 0.8 },
  tableRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  tableRowAlt: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 10, backgroundColor: "#f8fafc", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  cellDate: { flex: 1.2 },
  cellCat: { flex: 1.8 },
  cellDesc: { flex: 3 },
  cellSupplier: { flex: 1.5 },
  cellAmount: { flex: 1.5, textAlign: "right" },
  cellText: { fontSize: 8.5, color: "#334155" },
  cellBold: { fontSize: 8.5, color: "#0f172a", fontFamily: "Helvetica-Bold", textAlign: "right" },

  totalBar: { flexDirection: "row", justifyContent: "flex-end", marginTop: 6, paddingRight: 10 },
  totalBarLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#64748b", marginRight: 15 },
  totalBarValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ef4444" },

  footer: { position: "absolute", bottom: 25, left: 40, right: 40 },
  footerLine: { height: 1, backgroundColor: "#e2e8f0", marginBottom: 8 },
  footerRow: { flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#94a3b8" },
});

export function ReportPDF({ organization, totalRevenue, totalExpenses, treasury, expenses }) {
  const now = new Date();
  const brandColor = organization?.brand_color || accent;
  const dynamicAccent = { backgroundColor: brandColor };
  const dynamicDot = { ...s.sectionDot, backgroundColor: brandColor };
  const totalExp = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header band */}
        <View style={{ ...s.headerBand, backgroundColor: brandColor }}>
          <View style={s.headerLeft}>
            {organization?.logo_url ? (
              <Image src={organization.logo_url} style={s.logoImg} />
            ) : (
              <Text style={s.orgName}>{organization?.name || "Rapport"}</Text>
            )}
          </View>
          <View style={s.headerRight}>
            <Text style={s.reportTitle}>Rapport Financier</Text>
            <Text style={s.reportDate}>{fmtDate(now)}</Text>
          </View>
        </View>

        <View style={s.body}>
          {/* KPI cards */}
          <View style={s.kpiRow}>
            <View style={s.kpiCard}>
              <Text style={s.kpiLabel}>Recettes</Text>
              <Text style={s.kpiValueGreen}>{fmt(totalRevenue)}</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiLabel}>Dépenses</Text>
              <Text style={s.kpiValueRed}>{fmt(totalExpenses)}</Text>
            </View>
            <View style={{ ...s.kpiCardAccent, backgroundColor: brandColor }}>
              <Text style={s.kpiLabelWhite}>Trésorerie</Text>
              <Text style={s.kpiValueWhite}>{fmt(treasury)}</Text>
            </View>
          </View>

          {/* Compte de résultat */}
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <View style={dynamicDot} />
              <Text style={s.sectionTitle}>Compte de résultat</Text>
            </View>
            <View style={s.summaryTable}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Chiffre d&apos;affaires</Text>
                <Text style={s.summaryValue}>{fmt(totalRevenue)}</Text>
              </View>
              <View style={s.summaryRowAlt}>
                <Text style={s.summaryLabel}>Total dépenses</Text>
                <Text style={s.summaryValueRed}>-{fmt(totalExpenses)}</Text>
              </View>
              <View style={{ ...s.summaryRowTotal, backgroundColor: brandColor }}>
                <Text style={s.summaryTotalLabel}>Résultat net</Text>
                <Text style={s.summaryTotalValue}>{fmt(treasury)}</Text>
              </View>
            </View>
          </View>

          {/* Dépenses */}
          {expenses && expenses.length > 0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}>
                <View style={dynamicDot} />
                <Text style={s.sectionTitle}>Détail des dépenses ({expenses.length})</Text>
              </View>
              <View style={s.tableHeader}>
                <View style={s.cellDate}><Text style={s.tableHeaderText}>Date</Text></View>
                <View style={s.cellCat}><Text style={s.tableHeaderText}>Catégorie</Text></View>
                <View style={s.cellDesc}><Text style={s.tableHeaderText}>Description</Text></View>
                <View style={s.cellSupplier}><Text style={s.tableHeaderText}>Fournisseur</Text></View>
                <View style={s.cellAmount}><Text style={{ ...s.tableHeaderText, textAlign: "right" }}>Montant</Text></View>
              </View>
              {expenses.slice(0, 35).map((e, i) => (
                <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <View style={s.cellDate}><Text style={s.cellText}>{fmtShort(e.expense_date)}</Text></View>
                  <View style={s.cellCat}><Text style={s.cellText}>{e.category}</Text></View>
                  <View style={s.cellDesc}><Text style={s.cellText}>{e.description || "—"}</Text></View>
                  <View style={s.cellSupplier}><Text style={s.cellText}>{e.supplier || "—"}</Text></View>
                  <View style={s.cellAmount}><Text style={s.cellBold}>{fmt(e.amount)}</Text></View>
                </View>
              ))}
              {expenses.length > 35 && (
                <View style={s.tableRow}>
                  <Text style={{ fontSize: 8, color: "#94a3b8" }}>... et {expenses.length - 35} autres dépenses</Text>
                </View>
              )}
              <View style={s.totalBar}>
                <Text style={s.totalBarLabel}>Total dépenses</Text>
                <Text style={s.totalBarValue}>{fmt(totalExp)}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <View style={s.footerLine} />
          <View style={s.footerRow}>
            <Text style={s.footerText}>{organization?.name} — {organization?.city || ""} {organization?.country || "Sénégal"}</Text>
            <Text style={s.footerText}>{organization?.ninea ? `NINEA: ${organization.ninea}` : ""}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
