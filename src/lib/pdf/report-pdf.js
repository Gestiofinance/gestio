import { Document, Page, Text, View, Image, StyleSheet, Svg, Rect, Path, Circle, G } from "@react-pdf/renderer";

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

// SVG bar chart — Recettes vs Dépenses (6 mois)
function BarChartSvg({ data, brandColor, width = 270, height = 100 }) {
  const maxVal = Math.max(...data.map((d) => Math.max(d.recettes || 0, d.depenses || 0)), 1);
  const chartH = height;
  const groupW = width / data.length;
  const barW = Math.floor(groupW * 0.3);

  return (
    <Svg width={width} height={chartH}>
      {data.map((d, i) => {
        const recH = Math.max(1, Math.round((d.recettes / maxVal) * chartH));
        const depH = Math.max(1, Math.round((d.depenses / maxVal) * chartH));
        const x = Math.round(i * groupW + groupW * 0.1);
        return (
          <G key={i}>
            {d.recettes > 0 && <Rect x={x} y={chartH - recH} width={barW} height={recH} fill={brandColor} />}
            {d.depenses > 0 && <Rect x={x + barW + 2} y={chartH - depH} width={barW} height={depH} fill="#ef4444" />}
          </G>
        );
      })}
    </Svg>
  );
}

// SVG pie chart — Répartition des dépenses
function PieChartSvg({ data, size = 88 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0 || data.length === 0) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 3;

  if (data.length === 1) {
    return (
      <Svg width={size} height={size}>
        <Circle cx={cx} cy={cy} r={r} fill={data[0].color} />
      </Svg>
    );
  }

  let angle = -Math.PI / 2;
  const slices = data.map((d) => {
    const sweep = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M ${cx.toFixed(1)} ${cy.toFixed(1)} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;
    return { ...d, path };
  });

  return (
    <Svg width={size} height={size}>
      {slices.map((sl, i) => <Path key={i} d={sl.path} fill={sl.color} />)}
    </Svg>
  );
}

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, padding: 0, backgroundColor: "#fff" },

  // Header — white background
  header: { paddingHorizontal: 40, paddingTop: 28, paddingBottom: 18, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logoImg: { width: 120, height: 40, objectFit: "contain" },
  orgName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  orgCity: { fontSize: 8, color: "#64748b", marginTop: 2 },
  headerRight: { alignItems: "flex-end" },
  reportTitle: { fontSize: 15, fontFamily: "Helvetica-Bold", color: "#0f172a", textTransform: "uppercase", letterSpacing: 2 },
  reportDate: { fontSize: 9, color: "#64748b", marginTop: 4 },

  body: { paddingHorizontal: 40, paddingTop: 22, paddingBottom: 80 },

  // KPI cards
  kpiRow: { flexDirection: "row", marginBottom: 22 },
  kpiCard: { flex: 1, padding: 14, borderRadius: 6, borderWidth: 1, borderColor: "#e2e8f0", marginRight: 10 },
  kpiCardLast: { flex: 1, padding: 14, borderRadius: 6, borderWidth: 1, borderColor: "#e2e8f0" },
  kpiCardAccent: { flex: 1, padding: 14, borderRadius: 6, marginLeft: 10 },
  kpiLabel: { fontSize: 7.5, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  kpiLabelWhite: { fontSize: 7.5, color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 5 },
  kpiValueGreen: { fontSize: 17, fontFamily: "Helvetica-Bold", color: "#16a34a" },
  kpiValueRed: { fontSize: 17, fontFamily: "Helvetica-Bold", color: "#ef4444" },
  kpiValueWhite: { fontSize: 17, fontFamily: "Helvetica-Bold", color: "#ffffff" },

  // Charts row
  chartsRow: { flexDirection: "row", marginBottom: 22 },
  chartBox: { flex: 1, marginRight: 14 },
  chartBoxLast: { flex: 1 },

  // Section titles (no dot)
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#0f172a", marginBottom: 10 },
  chartLabel: { fontSize: 6.5, color: "#64748b", textAlign: "center", flex: 1 },

  // Legend
  legendRow: { flexDirection: "row", alignItems: "center", marginTop: 7 },
  legendDot: { width: 8, height: 8, borderRadius: 2, marginRight: 5 },
  legendText: { fontSize: 7, color: "#64748b", marginRight: 14 },

  // Pie legend
  pieLegendItem: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  pieLegendDot: { width: 7, height: 7, borderRadius: 1, marginRight: 5 },
  pieLegendName: { fontSize: 6.5, color: "#475569", flex: 1 },
  pieLegendValue: { fontSize: 6.5, color: "#0f172a", fontFamily: "Helvetica-Bold" },

  // Summary table
  section: { marginBottom: 20 },
  summaryTable: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 6, overflow: "hidden" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  summaryRowAlt: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 9, backgroundColor: "#f8fafc", borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  summaryRowTotal: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10 },
  summaryLabel: { fontSize: 10, color: "#475569" },
  summaryValue: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#0f172a" },
  summaryValueRed: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ef4444" },
  summaryTotalLabel: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#ffffff" },
  summaryTotalValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#ffffff" },

  // Expense table
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

  // Footer
  footer: { position: "absolute", bottom: 25, left: 40, right: 40 },
  footerLine: { height: 1, backgroundColor: "#e2e8f0", marginBottom: 8 },
  footerRow: { flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7, color: "#94a3b8" },
});

export function ReportPDF({ organization, totalRevenue, totalExpenses, treasury, expenses, monthlyData = [], expensesByCategory = [] }) {
  const now = new Date();
  const brandColor = organization?.brand_color || "#5E5CE6";
  const totalExp = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header — fond blanc, texte noir */}
        <View style={s.header}>
          <View>
            {(organization?.logo_base64 || organization?.logo_url) ? (
              <Image src={organization.logo_base64 || organization.logo_url} style={s.logoImg} />
            ) : (
              <Text style={s.orgName}>{organization?.name || "—"}</Text>
            )}
            {organization?.city && <Text style={s.orgCity}>{organization.city}{organization.country ? `, ${organization.country}` : ""}</Text>}
          </View>
          <View style={s.headerRight}>
            <Text style={s.reportTitle}>Rapport Financier</Text>
            <Text style={s.reportDate}>{fmtDate(now)}</Text>
          </View>
        </View>

        {/* Ligne d'accent sous le header */}
        <View style={{ height: 3, backgroundColor: brandColor, marginHorizontal: 40, marginBottom: 22, borderRadius: 2 }} />

        <View style={s.body}>

          {/* KPI cards */}
          <View style={s.kpiRow}>
            <View style={s.kpiCard}>
              <Text style={s.kpiLabel}>Recettes</Text>
              <Text style={s.kpiValueGreen}>{fmt(totalRevenue)}</Text>
            </View>
            <View style={{ ...s.kpiCardAccent, backgroundColor: brandColor, marginLeft: 0, marginRight: 10 }}>
              <Text style={s.kpiLabelWhite}>Trésorerie</Text>
              <Text style={s.kpiValueWhite}>{fmt(treasury)}</Text>
            </View>
            <View style={s.kpiCardLast}>
              <Text style={s.kpiLabel}>Dépenses</Text>
              <Text style={s.kpiValueRed}>{fmt(totalExpenses)}</Text>
            </View>
          </View>

          {/* Graphiques */}
          <View style={s.chartsRow}>
            {/* Bar chart — Recettes vs Dépenses */}
            <View style={s.chartBox}>
              <Text style={s.sectionTitle}>Recettes vs Dépenses</Text>
              {monthlyData.length > 0 ? (
                <>
                  <BarChartSvg data={monthlyData} brandColor={brandColor} width={248} height={95} />
                  {/* Labels mois */}
                  <View style={{ flexDirection: "row", width: 248, marginTop: 4 }}>
                    {monthlyData.map((d, i) => (
                      <Text key={i} style={s.chartLabel}>{d.mois}</Text>
                    ))}
                  </View>
                  {/* Légende */}
                  <View style={s.legendRow}>
                    <View style={{ ...s.legendDot, backgroundColor: brandColor }} />
                    <Text style={s.legendText}>Recettes</Text>
                    <View style={{ ...s.legendDot, backgroundColor: "#ef4444" }} />
                    <Text style={s.legendText}>Dépenses</Text>
                  </View>
                </>
              ) : (
                <Text style={{ fontSize: 8, color: "#94a3b8" }}>Aucune donnée</Text>
              )}
            </View>

            {/* Pie chart — Répartition dépenses */}
            <View style={s.chartBoxLast}>
              <Text style={s.sectionTitle}>Répartition des dépenses</Text>
              {expensesByCategory.length > 0 ? (
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <PieChartSvg data={expensesByCategory} size={88} />
                  <View style={{ flex: 1, paddingLeft: 10, paddingTop: 4 }}>
                    {expensesByCategory.slice(0, 9).map((cat, i) => (
                      <View key={i} style={s.pieLegendItem}>
                        <View style={{ ...s.pieLegendDot, backgroundColor: cat.color }} />
                        <Text style={s.pieLegendName}>{cat.name}</Text>
                        <Text style={s.pieLegendValue}>{fmt(cat.value)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <Text style={{ fontSize: 8, color: "#94a3b8" }}>Aucune dépense</Text>
              )}
            </View>
          </View>

          {/* Compte de résultat */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Compte de résultat</Text>
            <View style={s.summaryTable}>
              <View style={s.summaryRow}>
                <Text style={s.summaryLabel}>Chiffre d'affaires</Text>
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

          {/* Détail des dépenses */}
          {expenses && expenses.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Détail des dépenses ({expenses.length})</Text>
              <View style={s.tableHeader}>
                <View style={s.cellDate}><Text style={s.tableHeaderText}>Date</Text></View>
                <View style={s.cellCat}><Text style={s.tableHeaderText}>Catégorie</Text></View>
                <View style={s.cellDesc}><Text style={s.tableHeaderText}>Description</Text></View>
                <View style={s.cellSupplier}><Text style={s.tableHeaderText}>Fournisseur</Text></View>
                <View style={s.cellAmount}><Text style={{ ...s.tableHeaderText, textAlign: "right" }}>Montant</Text></View>
              </View>
              {expenses.slice(0, 30).map((e, i) => (
                <View key={i} style={i % 2 === 0 ? s.tableRow : s.tableRowAlt}>
                  <View style={s.cellDate}><Text style={s.cellText}>{fmtShort(e.expense_date)}</Text></View>
                  <View style={s.cellCat}><Text style={s.cellText}>{e.category}</Text></View>
                  <View style={s.cellDesc}><Text style={s.cellText}>{e.description || "—"}</Text></View>
                  <View style={s.cellSupplier}><Text style={s.cellText}>{e.supplier || "—"}</Text></View>
                  <View style={s.cellAmount}><Text style={s.cellBold}>{fmt(e.amount)}</Text></View>
                </View>
              ))}
              {expenses.length > 30 && (
                <View style={s.tableRow}>
                  <Text style={{ fontSize: 8, color: "#94a3b8" }}>... et {expenses.length - 30} autres dépenses</Text>
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
            <Text style={s.footerText}>{organization?.name}{organization?.city ? ` — ${organization.city}` : ""}{organization?.country ? `, ${organization.country}` : ""}</Text>
            <Text style={s.footerText}>{organization?.ninea ? `NINEA: ${organization.ninea}` : ""}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
