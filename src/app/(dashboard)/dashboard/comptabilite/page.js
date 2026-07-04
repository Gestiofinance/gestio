"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs } from "@/components/ui/tabs";
import { useCrud, useSupabase } from "@/hooks/useSupabase";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { pdf } from "@react-pdf/renderer";
import { ReportPDF } from "@/lib/pdf/report-pdf";
import {
  TrendingUp, TrendingDown, Wallet, Plus, Trash2, Pencil, MoreVertical, Download, ArrowDownCircle, ArrowUpCircle, FileDown,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const expenseCategories = [
  { value: "loyer", label: "Loyer" }, { value: "salaires", label: "Salaires" },
  { value: "fournitures", label: "Fournitures" }, { value: "transport", label: "Transport" },
  { value: "telecom", label: "Télécom & Internet" }, { value: "marketing", label: "Marketing" },
  { value: "services", label: "Services professionnels" }, { value: "impots", label: "Impôts & taxes" },
  { value: "equipement", label: "Équipement" }, { value: "autre", label: "Autre" },
];

const categoryColors = {
  loyer: "#5E5CE6", salaires: "#8B5CF6", fournitures: "#06b6d4", transport: "#f59e0b",
  telecom: "#22c55e", marketing: "#ef4444", services: "#ec4899", impots: "#64748b",
  equipement: "#f97316", autre: "#94a3b8",
};

const emptyForm = { category: "fournitures", description: "", amount: "", tax_amount: "", expense_date: new Date().toISOString().split("T")[0], supplier: "", payment_method: "especes" };

export default function ComptabilitePage() {
  const supabase = useSupabase();
  const { data: expenses, loading, fetchAll: fetchExpenses, create, update, remove } = useCrud("expenses");
  const { data: revenues, fetchAll: fetchRevenues, create: createRevenue, update: updateRevenue, remove: removeRevenue } = useCrud("revenues");
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [tab, setTab] = useState("vue");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteRecetteConfirm, setDeleteRecetteConfirm] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [showRecette, setShowRecette] = useState(false);
  const [editingRecette, setEditingRecette] = useState(null);
  const [recetteForm, setRecetteForm] = useState({ description: "", amount: "", revenue_date: new Date().toISOString().split("T")[0], payment_method: "virement", reference: "", client_name: "" });

  useEffect(() => {
    fetchExpenses();
    fetchRevenues();
    loadFinancials();
  }, [fetchExpenses, fetchRevenues]);

  async function loadFinancials() {
    const [{ data: inv }, { data: pay }] = await Promise.all([
      supabase.from("invoices").select("*"),
      supabase.from("payments").select("*"),
    ]);
    setInvoices(inv || []);
    setPayments(pay || []);
  }

  // Apply period filter to expenses, revenues, payments
  function inPeriod(dateStr) {
    if (!filterPeriod || !dateStr) return !filterPeriod;
    const d = new Date(dateStr);
    const now = new Date();
    if (filterPeriod === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (filterPeriod === "quarter") { const q = Math.floor(now.getMonth() / 3); return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear(); }
    if (filterPeriod === "year") return d.getFullYear() === now.getFullYear();
    if (filterPeriod === "custom" && customStart && customEnd) return d >= new Date(customStart) && d <= new Date(customEnd + "T23:59:59");
    return true;
  }

  const filteredPayments = payments.filter((p) => inPeriod(p.payment_date));
  const filteredRevenues = revenues.filter((r) => inPeriod(r.revenue_date));
  const filteredExpenses = expenses.filter((e) => inPeriod(e.expense_date));

  const revenueFromPayments = filteredPayments.reduce((s, p) => s + Number(p.amount), 0);
  const revenueFromRecettes = filteredRevenues.reduce((s, r) => s + Number(r.amount), 0);
  const totalRevenue = revenueFromPayments + revenueFromRecettes;
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount), 0);
  const treasury = totalRevenue - totalExpenses;
  const totalTVACollectee = invoices.filter((i) => i.status === "payee").reduce((s, i) => s + Number(i.tax_amount), 0);
  const totalTVADeductible = filteredExpenses.reduce((s, e) => s + Number(e.tax_amount || 0), 0);

  const expensesByCategory = expenseCategories.map((cat) => ({
    name: cat.label,
    value: filteredExpenses.filter((e) => e.category === cat.value).reduce((s, e) => s + Number(e.amount), 0),
    color: categoryColors[cat.value],
  })).filter((c) => c.value > 0);

  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const m = d.getMonth();
    const y = d.getFullYear();
    const label = d.toLocaleDateString("fr-FR", { month: "short" });
    const revPay = payments.filter((p) => { const pd = new Date(p.payment_date); return pd.getMonth() === m && pd.getFullYear() === y; }).reduce((s, p) => s + Number(p.amount), 0);
    const revRec = revenues.filter((r) => { const rd = new Date(r.revenue_date); return rd.getMonth() === m && rd.getFullYear() === y; }).reduce((s, r) => s + Number(r.amount), 0);
    const exp = expenses.filter((e) => { const ed = new Date(e.expense_date); return ed.getMonth() === m && ed.getFullYear() === y; }).reduce((s, e) => s + Number(e.amount), 0);
    monthlyData.push({ mois: label, recettes: revPay + revRec, depenses: exp });
  }

  function openCreate() { setForm(emptyForm); setEditing(null); setShowForm(true); }
  function openEdit(e) {
    setForm({ category: e.category, description: e.description || "", amount: e.amount, tax_amount: e.tax_amount || "", expense_date: e.expense_date, supplier: e.supplier || "", payment_method: e.payment_method || "especes" });
    setEditing(e); setShowForm(true); setActiveMenu(null);
  }

  function openRecetteCreate() {
    setRecetteForm({ description: "", amount: "", revenue_date: new Date().toISOString().split("T")[0], payment_method: "virement", reference: "", client_name: "" });
    setEditingRecette(null);
    setShowRecette(true);
  }
  function openRecetteEdit(r) {
    setRecetteForm({ description: r.description, amount: String(r.amount), revenue_date: r.revenue_date, payment_method: r.payment_method || "virement", reference: r.reference || "", client_name: r.client_name || "" });
    setEditingRecette(r);
    setShowRecette(true);
  }

  async function handleSaveRecette() {
    setSaving(true);
    const payload = { ...recetteForm, amount: parseFloat(recetteForm.amount) };
    try {
      if (editingRecette) await updateRevenue(editingRecette.id, payload);
      else await createRevenue(payload);
      await fetchRevenues();
      setShowRecette(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleDeleteRecette() {
    if (!deleteRecetteConfirm) return;
    await removeRevenue(deleteRecetteConfirm.id);
    await fetchRevenues();
    setDeleteRecetteConfirm(null);
  }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form, amount: parseFloat(form.amount), tax_amount: form.tax_amount ? parseFloat(form.tax_amount) : 0 };
    try {
      if (editing) await update(editing.id, payload);
      else await create(payload);
      await fetchExpenses();
      setShowForm(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    await remove(deleteConfirm.id);
    await fetchExpenses();
    setDeleteConfirm(null);
  }

  const expenseColumns = [
    { key: "expense_date", label: "Date", render: (v) => <span className="text-slate-600">{formatShortDate(v)}</span> },
    { key: "category", label: "Catégorie", render: (v) => <Badge>{expenseCategories.find((c) => c.value === v)?.label || v}</Badge> },
    { key: "description", label: "Description", render: (v) => <span className="text-slate-600">{v || "—"}</span> },
    { key: "supplier", label: "Fournisseur", render: (v) => <span className="text-slate-600">{v || "—"}</span> },
    { key: "amount", label: "Montant", align: "right", render: (v) => <span className="font-medium text-danger-500">-{formatCurrency(v)}</span> },
    {
      key: "actions", label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Modifier"><Pencil className="w-4 h-4 text-slate-500" /></button>
          <button onClick={() => setDeleteConfirm(row)} className="p-1.5 rounded-lg hover:bg-danger-50" title="Supprimer"><Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-500" /></button>
        </div>
      ),
    },
  ];

  const revenueColumns = [
    { key: "revenue_date", label: "Date", render: (v) => <span className="text-slate-600">{formatShortDate(v)}</span> },
    { key: "description", label: "Description", render: (v) => <span className="text-foreground font-medium">{v}</span> },
    { key: "client_name", label: "Client", render: (v) => <span className="text-slate-600">{v || "—"}</span> },
    { key: "payment_method", label: "Mode", render: (v) => <Badge>{v}</Badge> },
    { key: "amount", label: "Montant", align: "right", render: (v) => <span className="font-medium text-success-500">+{formatCurrency(v)}</span> },
    {
      key: "actions", label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openRecetteEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Modifier"><Pencil className="w-4 h-4 text-slate-500" /></button>
          <button onClick={() => setDeleteRecetteConfirm(row)} className="p-1.5 rounded-lg hover:bg-danger-50" title="Supprimer"><Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-500" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Header title="Comptabilité" />
      <div className="p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Recettes" value={formatCurrency(totalRevenue)} icon={TrendingUp} />
          <StatCard title="Dépenses" value={formatCurrency(totalExpenses)} icon={TrendingDown} />
          <StatCard title="Trésorerie" value={formatCurrency(treasury)} icon={Wallet} />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <Tabs
            wrap
            tabs={[{ value: "vue", label: "Vue d'ensemble" }, { value: "recettes", label: "Recettes", count: revenues.length }, { value: "depenses", label: "Dépenses", count: expenses.length }, { value: "rapports", label: "Rapports" }]}
            activeTab={tab} onChange={setTab}
          />
          <div className="flex flex-wrap items-center gap-3">
            <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600">
              <option value="">Toutes les périodes</option>
              <option value="month">Ce mois</option>
              <option value="quarter">Ce trimestre</option>
              <option value="year">Cette année</option>
              <option value="custom">Période personnalisée</option>
            </select>
            {filterPeriod === "custom" && (
              <div className="flex items-center gap-2">
                <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600" />
                <span className="text-slate-400 text-sm">→</span>
                <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600" />
              </div>
            )}
            <Button variant="secondary" size="sm" onClick={openCreate}><ArrowDownCircle className="w-4 h-4 text-danger-500" /> Dépense</Button>
            <Button variant="secondary" size="sm" onClick={openRecetteCreate}><ArrowUpCircle className="w-4 h-4 text-success-500" /> Recette</Button>
          </div>
        </div>

        {tab === "vue" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><h3 className="font-semibold">Recettes vs Dépenses</h3></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${v / 1000}k`} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Bar dataKey="recettes" fill="#5E5CE6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="depenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><h3 className="font-semibold">Répartition des dépenses</h3></CardHeader>
              <CardContent>
                {expensesByCategory.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={expensesByCategory} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {expensesByCategory.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted text-center py-8">Aucune dépense enregistrée</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === "recettes" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">Recettes hors factures (ventes directes, paiements reçus, etc.)</p>
              <Button onClick={openRecetteCreate}><Plus className="w-4 h-4" /> Nouvelle recette</Button>
            </div>
            <Card><DataTable columns={revenueColumns} data={revenues} emptyMessage="Aucune recette enregistrée" /></Card>
          </div>
        )}

        {tab === "depenses" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600">
                <option value="">Toutes catégories</option>
                {expenseCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <Button onClick={openCreate}><Plus className="w-4 h-4" /> Nouvelle dépense</Button>
            </div>
            <Card><DataTable columns={expenseColumns} data={filterCategory ? filteredExpenses.filter((e) => e.category === filterCategory) : filteredExpenses} emptyMessage="Aucune dépense enregistrée" /></Card>
          </div>
        )}

        {tab === "rapports" && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={async () => {
                // Fetch org via API (bypasse RLS)
                const orgRes = await fetch("/api/settings/org");
                const { org } = await orgRes.json();

                // Convertir le logo en base64 pour @react-pdf/renderer (CORS)
                let logoBase64 = null;
                if (org?.logo_url) {
                  try {
                    const imgRes = await fetch(org.logo_url);
                    const imgBlob = await imgRes.blob();
                    logoBase64 = await new Promise((resolve) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result);
                      reader.readAsDataURL(imgBlob);
                    });
                  } catch { /* logo inaccessible */ }
                }

                const blob = await pdf(
                  <ReportPDF organization={{ ...org, logo_base64: logoBase64 }}
                    totalRevenue={totalRevenue} totalExpenses={totalExpenses}
                    treasury={treasury} expenses={filteredExpenses} />
                ).toBlob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `rapport-financier-${new Date().toISOString().split("T")[0]}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }}>
                <FileDown className="w-4 h-4" /> Télécharger le rapport PDF
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><h3 className="font-semibold">Compte de résultat simplifié</h3></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>Chiffre d&apos;affaires</span><span className="font-medium">{formatCurrency(totalRevenue)}</span></div>
                  <div className="flex justify-between"><span>Total dépenses</span><span className="font-medium text-danger-500">-{formatCurrency(totalExpenses)}</span></div>
                  <div className="flex justify-between border-t pt-2"><span className="font-semibold">Résultat net</span><span className={`font-bold ${treasury >= 0 ? "text-success-500" : "text-danger-500"}`}>{formatCurrency(treasury)}</span></div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Modifier la dépense" : "Nouvelle dépense"} size="md">
        <div className="space-y-4">
          <Select id="category" name="category" label="Catégorie" options={expenseCategories} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <Input id="description" name="description" label="Description" placeholder="Détails de la dépense" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <Input id="amount" name="amount" label="Montant (FCFA)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input id="expense_date" name="expense_date" label="Date" type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
            <Input id="supplier" name="supplier" label="Fournisseur" placeholder="Nom du fournisseur" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.amount}>{saving ? "Enregistrement..." : editing ? "Modifier" : "Enregistrer"}</Button>
          </div>
        </div>
      </Modal>

      {/* Recette modal */}
      <Modal open={showRecette} onClose={() => setShowRecette(false)} title={editingRecette ? "Modifier la recette" : "Nouvelle recette"} size="md">
        <div className="space-y-4">
          <Input id="rec_description" label="Description" placeholder="Ex: Paiement client, vente directe..." value={recetteForm.description} onChange={(e) => setRecetteForm({ ...recetteForm, description: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input id="rec_amount" label="Montant (FCFA)" type="number" value={recetteForm.amount} onChange={(e) => setRecetteForm({ ...recetteForm, amount: e.target.value })} required />
            <Input id="rec_date" label="Date" type="date" value={recetteForm.revenue_date} onChange={(e) => setRecetteForm({ ...recetteForm, revenue_date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select id="rec_method" label="Mode de paiement" value={recetteForm.payment_method} onChange={(e) => setRecetteForm({ ...recetteForm, payment_method: e.target.value })}
              options={[
                { value: "virement", label: "Virement" }, { value: "especes", label: "Espèces" },
                { value: "wave", label: "Wave" }, { value: "orange_money", label: "Orange Money" },
                { value: "free_money", label: "Free Money" }, { value: "carte_bancaire", label: "Carte bancaire" },
                { value: "cheque", label: "Chèque" }, { value: "paytech", label: "Paytech" },
              ]} />
            <Input id="rec_client" label="Client (optionnel)" placeholder="Nom du client" value={recetteForm.client_name} onChange={(e) => setRecetteForm({ ...recetteForm, client_name: e.target.value })} />
          </div>
          <Input id="rec_ref" label="Référence (optionnel)" placeholder="N° transaction..." value={recetteForm.reference} onChange={(e) => setRecetteForm({ ...recetteForm, reference: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowRecette(false)}>Annuler</Button>
            <Button onClick={handleSaveRecette} disabled={saving || !recetteForm.amount || !recetteForm.description}>
              {saving ? "Enregistrement..." : editingRecette ? "Modifier" : "Enregistrer la recette"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Supprimer cette dépense ?" message="Cette action est irréversible." confirmLabel="Supprimer" />
      <ConfirmDialog open={!!deleteRecetteConfirm} onClose={() => setDeleteRecetteConfirm(null)} onConfirm={handleDeleteRecette}
        title="Supprimer cette recette ?" message="Cette action est irréversible." confirmLabel="Supprimer" />
    </div>
  );
}
