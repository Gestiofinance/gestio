"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatCard } from "@/components/ui/stat-card";
import { useCrud, useSupabase, getOrgId } from "@/hooks/useSupabase";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { PdfDownloadButton } from "@/components/ui/pdf-download-button";
import { DateFilter, applyDateFilter } from "@/components/ui/date-filter";
import { ActionMenu, ActionMenuItem } from "@/components/ui/action-menu";
import {
  Receipt, Plus, Search, Trash2, Pencil, Eye, Wallet, AlertCircle, CheckCircle, Clock, MessageCircle, Mail, Stamp, Printer,
} from "lucide-react";

const statusColors = {
  brouillon: "default", envoyee: "primary", partiellement_payee: "warning",
  payee: "success", en_retard: "danger", annulee: "default",
};
const statusLabels = {
  brouillon: "Brouillon", envoyee: "Envoyée", partiellement_payee: "Partiel",
  payee: "Payée", en_retard: "En retard", annulee: "Annulée",
};
const statusOptions = [
  { value: "brouillon", label: "Brouillon" }, { value: "envoyee", label: "Envoyée" },
  { value: "partiellement_payee", label: "Partiellement payée" }, { value: "payee", label: "Payée" },
  { value: "en_retard", label: "En retard" }, { value: "annulee", label: "Annulée" },
];
const typeOptions = [
  { value: "standard", label: "Standard" }, { value: "acompte", label: "Acompte" },
  { value: "solde", label: "Solde" }, { value: "avoir", label: "Avoir" },
];
const paymentMethods = [
  { value: "virement", label: "Virement" }, { value: "especes", label: "Espèces" },
  { value: "wave", label: "Wave" }, { value: "orange_money", label: "Orange Money" },
  { value: "free_money", label: "Free Money" }, { value: "carte_bancaire", label: "Carte bancaire" },
  { value: "cheque", label: "Chèque" }, { value: "bictorys", label: "Bictorys" },
];

const emptyLine = { description: "", quantity: 1, unit_price: 0, tax_rate: 18 };

export default function FacturesPage() {
  const supabase = useSupabase();
  const { data: invoices, loading, fetchAll, remove } = useCrud("invoices");
  const { data: clients, fetchAll: fetchClients } = useCrud("clients");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [showPayment, setShowPayment] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [statusModal, setStatusModal] = useState(null); // invoice being changed
  const [detailItems, setDetailItems] = useState([]);
  const [detailPayments, setDetailPayments] = useState([]);

  const [form, setForm] = useState({
    client_id: "", type: "standard", status: "brouillon",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
    notes: "", conditions: "", apply_stamp: false, apply_tva: false,
    discount_type: "amount", discount_value: "",
  });
  const [lines, setLines] = useState([{ ...emptyLine }]);
  const [paymentForm, setPaymentForm] = useState({ amount: "", payment_date: new Date().toISOString().split("T")[0], payment_method: "virement", reference: "" });

  useEffect(() => {
    fetchAll({ select: "*, clients(company_name, contact_name, email, phone)" });
    fetchClients();
  }, [fetchAll, fetchClients]);

  const filtered = applyDateFilter(
    invoices.filter((inv) => {
      if (filterStatus && inv.status !== filterStatus) return false;
      return inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        (inv.clients?.company_name || "").toLowerCase().includes(search.toLowerCase());
    }),
    "issue_date", filterPeriod, customStart, customEnd
  );

  const totalCA = invoices.filter((i) => i.status === "payee").reduce((s, i) => s + Number(i.total), 0);
  const totalImpaye = invoices.filter((i) => ["envoyee", "en_retard", "partiellement_payee"].includes(i.status)).reduce((s, i) => s + Number(i.total) - Number(i.paid_amount), 0);
  const nbEnRetard = invoices.filter((i) => i.status === "en_retard").length;

  function calcTotals(items) {
    const subtotal = items.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const dv = parseFloat(form.discount_value) || 0;
    const discountAmount = form.discount_type === "percent" ? subtotal * (dv / 100) : dv;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = form.apply_tva ? afterDiscount * 0.18 : 0;
    return { subtotal, discount_amount: discountAmount, tax_amount: taxAmount, total: afterDiscount + taxAmount };
  }

  function openCreate() {
    setForm({
      client_id: "", type: "standard", status: "brouillon",
      issue_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      notes: "", conditions: "", apply_stamp: false, apply_tva: false, discount_type: "amount", discount_value: "",
    });
    setLines([{ ...emptyLine }]);
    setEditing(null); setShowForm(true);
  }

  async function openEdit(inv) {
    const { data: items } = await supabase.from("invoice_items").select("*").eq("invoice_id", inv.id).order("sort_order");
    setForm({
      client_id: inv.client_id || "", type: inv.type, status: inv.status,
      issue_date: inv.issue_date || "", due_date: inv.due_date || "",
      notes: inv.notes || "", conditions: inv.conditions || "",
      apply_stamp: inv.apply_stamp || false,
      apply_tva: Number(inv.tax_amount) > 0,
      discount_type: inv.discount_type || "amount", discount_value: inv.discount_value || "",
    });
    setLines(items?.length ? items.map((i) => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price, tax_rate: i.tax_rate })) : [{ ...emptyLine }]);
    setEditing(inv); setShowForm(true);
  }

  async function openDetail(inv) {
    const [{ data: items }, { data: payments }] = await Promise.all([
      supabase.from("invoice_items").select("*").eq("invoice_id", inv.id).order("sort_order"),
      supabase.from("payments").select("*").eq("invoice_id", inv.id).order("payment_date", { ascending: false }),
    ]);
    setDetailItems(items || []);
    setDetailPayments(payments || []);
    setShowDetail(inv);
  }

  async function handleSave() {
    setSaving(true);
    const totals = calcTotals(lines);
    try {
      const payload = { ...form, client_id: form.client_id || null, discount_value: parseFloat(form.discount_value) || 0, ...totals };
      const validLines = lines.filter((l) => l.description);

      let res;
      if (editing) {
        res = await fetch("/api/invoices", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload, lines: validLines }),
        });
      } else {
        res = await fetch("/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, lines: validLines }),
        });
      }
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await fetchAll({ select: "*, clients(company_name, contact_name, email, phone)" });
      setShowForm(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handlePayment() {
    if (!showPayment) return;
    setSaving(true);
    const amount = parseFloat(paymentForm.amount);
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: showPayment.id,
          amount,
          payment_date: paymentForm.payment_date,
          payment_method: paymentForm.payment_method,
          reference: paymentForm.reference,
          currentTotal: showPayment.total,
          currentPaid: showPayment.paid_amount || 0,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await fetchAll({ select: "*, clients(company_name, contact_name, email, phone)" });
      setShowPayment(null);
      setPaymentForm({ amount: "", payment_date: new Date().toISOString().split("T")[0], payment_method: "virement", reference: "" });
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    await remove(deleteConfirm.id);
    await fetchAll({ select: "*, clients(company_name, contact_name, email, phone)" });
    setDeleteConfirm(null); setShowDetail(null);
  }

  async function handleStatusChange(invoiceId, newStatus) {
    try {
      const res = await fetch("/api/invoices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: invoiceId, status: newStatus }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      await fetchAll({ select: "*, clients(company_name, contact_name, email, phone)" });
      setStatusModal(null);
    } catch (e) { console.error(e); }
  }

  function updateLine(index, field, value) {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: field === "description" ? value : parseFloat(value) || 0 };
    setLines(updated);
  }

  const totals = calcTotals(lines);

  function shareWhatsApp(row) {
    const phone = row.clients?.phone?.replace(/\s/g, "") || "";
    const msg = encodeURIComponent(`Bonjour, veuillez trouver ci-joint la facture ${row.invoice_number} d'un montant de ${formatCurrency(row.total)}. Cordialement.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  }
  function shareEmailInv(row) {
    const email = row.clients?.email || "";
    const subject = encodeURIComponent(`Facture ${row.invoice_number}`);
    const body = encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-joint la facture ${row.invoice_number} d'un montant de ${formatCurrency(row.total)}.\n\nCordialement.`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
  }

  const columns = [
    { key: "invoice_number", label: "N° Facture", render: (v) => <span className="font-medium text-foreground">{v}</span> },
    { key: "client", label: "Client", render: (_, r) => <span className="text-slate-600">{r.clients?.company_name || r.clients?.contact_name || "—"}</span> },
    { key: "issue_date", label: "Date", render: (v) => <span className="text-slate-600">{v ? formatShortDate(v) : "—"}</span> },
    { key: "total", label: "Montant", align: "right", render: (v) => <span className="font-medium">{formatCurrency(v)}</span> },
    {
      key: "status", label: "Statut", compact: true,
      render: (v, row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setStatusModal(row); }}
          className="cursor-pointer hover:opacity-80 transition-opacity"
          title="Changer le statut"
        >
          <Badge variant={statusColors[v]}>{statusLabels[v]}</Badge>
        </button>
      ),
    },
    {
      key: "share", label: "", compact: true,
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => shareWhatsApp(row)} className="p-1 rounded-lg hover:bg-success-50 transition-colors" title="WhatsApp">
            <MessageCircle className="w-3.5 h-3.5 text-success-500" />
          </button>
          <button onClick={() => shareEmailInv(row)} className="p-1 rounded-lg hover:bg-primary-50 transition-colors" title="Email">
            <Mail className="w-3.5 h-3.5 text-primary-500" />
          </button>
        </div>
      ),
    },
    {
      key: "actions", label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => openDetail(row)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Aperçu"><Eye className="w-4 h-4 text-slate-500" /></button>
          <PdfDownloadButton type="facture" data={row} variant="ghost" size="sm" label="" />
          <PdfDownloadButton type="facture" data={row} action="print" variant="ghost" size="sm" label="" />
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Modifier"><Pencil className="w-4 h-4 text-slate-500" /></button>
          {row.status !== "payee" && row.status !== "annulee" && (
            <button onClick={() => { setShowPayment(row); setPaymentForm({ ...paymentForm, amount: String(Number(row.total) - Number(row.paid_amount)) }); }} className="p-1.5 rounded-lg hover:bg-success-50" title="Paiement"><Wallet className="w-4 h-4 text-success-500" /></button>
          )}
          <button onClick={() => setDeleteConfirm(row)} className="p-1.5 rounded-lg hover:bg-danger-50" title="Supprimer"><Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-500" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Header title="Factures" />
      <div className="p-4 sm:p-6 space-y-4">
        {/* KPIs */}
        {invoices.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Encaissé" value={formatCurrency(totalCA)} icon={CheckCircle} />
            <StatCard title="Impayé" value={formatCurrency(totalImpaye)} icon={AlertCircle} />
            <StatCard title="En retard" value={`${nbEnRetard} facture${nbEnRetard > 1 ? "s" : ""}`} icon={Clock} />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-foreground">Toutes les factures</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white sm:flex-1">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm w-full border-none outline-none" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600">
                <option value="">Tous statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="envoyee">Envoyée</option>
                <option value="partiellement_payee">Partiel</option>
                <option value="payee">Payée</option>
                <option value="en_retard">En retard</option>
              </select>
              <DateFilter period={filterPeriod} setPeriod={setFilterPeriod} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />
              <Button onClick={openCreate} className="flex-shrink-0"><Plus className="w-4 h-4" /> Nouvelle facture</Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted">Chargement...</div>
        ) : invoices.length === 0 ? (
          <EmptyState icon={Receipt} title="Aucune facture" description="Créez votre première facture ou convertissez un devis accepté." actionLabel="Créer une facture" onAction={openCreate} />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {filtered.length === 0 ? (
                <p className="text-center py-8 text-muted text-sm">Aucune facture trouvée</p>
              ) : filtered.map((inv) => (
                <div key={inv.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 cursor-pointer active:bg-slate-50" onClick={() => openDetail(inv)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm">{inv.invoice_number}</p>
                        <p className="text-slate-500 text-sm mt-0.5 truncate">{inv.clients?.company_name || inv.clients?.contact_name || "—"}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setStatusModal(inv); }} className="flex-shrink-0 hover:opacity-80">
                        <Badge variant={statusColors[inv.status]}>{statusLabels[inv.status]}</Badge>
                      </button>
                    </div>
                    <div className="flex items-end justify-between mt-3">
                      <p className="text-xs text-slate-400">{inv.issue_date ? formatShortDate(inv.issue_date) : "—"}</p>
                      <p className="font-bold text-xl text-foreground">{formatCurrency(inv.total)}</p>
                    </div>
                    {inv.paid_amount > 0 && inv.status !== "payee" && (
                      <div className="mt-2 text-xs text-success-600">Payé : {formatCurrency(inv.paid_amount)} — Reste : {formatCurrency(Number(inv.total) - Number(inv.paid_amount))}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="secondary" className="flex-1 text-xs" onClick={() => openDetail(inv)}>
                      <Eye className="w-3.5 h-3.5" /> Voir
                    </Button>
                    <PdfDownloadButton type="facture" data={inv} variant="secondary" size="sm" label="" />
                    {inv.status !== "payee" && inv.status !== "annulee" && (
                      <button onClick={() => { setShowPayment(inv); setPaymentForm({ ...paymentForm, amount: String(Number(inv.total) - Number(inv.paid_amount)) }); }} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-success-50" title="Paiement">
                        <Wallet className="w-4 h-4 text-success-500" />
                      </button>
                    )}
                    <button onClick={() => openEdit(inv)} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100" title="Modifier">
                      <Pencil className="w-4 h-4 text-slate-500" />
                    </button>
                    <button onClick={() => setDeleteConfirm(inv)} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-danger-50" title="Supprimer">
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <Card className="hidden sm:block">
              <DataTable columns={columns} data={filtered} onRowClick={(r) => openDetail(r)} emptyMessage="Aucune facture trouvée" />
            </Card>
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Modifier la facture" : "Nouvelle facture"} size="xl">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Select id="client_id" name="client_id" label="Client" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              options={[{ value: "", label: "— Sélectionner —" }, ...clients.map((c) => ({ value: c.id, label: c.company_name || c.contact_name }))]} />
            <Select id="type" name="type" label="Type" options={typeOptions} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
            <Input id="issue_date" label="Date d'émission" type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
            <Input id="due_date" label="Échéance" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Articles</h3>
            <div className="overflow-x-auto -mx-1">
            <div className="space-y-2 min-w-[480px]">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted px-1">
                <div className="col-span-5">Description</div><div className="col-span-2">Qté</div><div className="col-span-2">Prix unit.</div><div className="col-span-2 text-right">Total HT</div><div className="col-span-1"></div>
              </div>
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input className="col-span-5 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Description" value={line.description} onChange={(e) => updateLine(i, "description", e.target.value)} />
                  <input className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-sm" type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, "quantity", e.target.value)} />
                  <input className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-sm" type="number" min="0" value={line.unit_price} onChange={(e) => updateLine(i, "unit_price", e.target.value)} />
                  <div className="col-span-2 text-right text-sm font-medium">{formatCurrency(line.quantity * line.unit_price)}</div>
                  <button onClick={() => setLines(lines.filter((_, j) => j !== i))} className="col-span-1 p-1.5 rounded-lg hover:bg-danger-50 text-slate-400 hover:text-danger-500 justify-self-center"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setLines([...lines, { ...emptyLine }])}><Plus className="w-4 h-4" /> Ajouter une ligne</Button>
          </div>

          {/* Remise */}
          <div className="flex items-end gap-3">
            <div className="w-40">
              <Select id="inv_discount_type" label="Remise" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                options={[{ value: "amount", label: "Montant (FCFA)" }, { value: "percent", label: "Pourcentage (%)" }]} />
            </div>
            <div className="w-36">
              <Input id="inv_discount_value" type="number" placeholder="0" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
            </div>
          </div>

          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Sous-total HT</span><span className="font-medium">{formatCurrency(totals.subtotal)}</span></div>
              {totals.discount_amount > 0 && (
                <div className="flex justify-between"><span className="text-muted">Remise</span><span className="font-medium text-danger-500">-{formatCurrency(totals.discount_amount)}</span></div>
              )}
              {form.apply_tva && (
                <div className="flex justify-between"><span className="text-muted">TVA (18%)</span><span className="font-medium">{formatCurrency(totals.tax_amount)}</span></div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-semibold">{form.apply_tva ? "Total TTC" : "Total"}</span><span className="font-bold text-lg">{formatCurrency(totals.total)}</span></div>
            </div>
          </div>

          {/* TVA toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="text-sm font-medium text-foreground">Appliquer la TVA (18%)</p>
              <p className="text-xs text-muted">Ajoute 18% de TVA au montant total</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, apply_tva: !form.apply_tva })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.apply_tva ? "bg-primary-500" : "bg-slate-300"}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${form.apply_tva ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Cachet toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Stamp className="w-5 h-5 text-muted" />
              <div>
                <p className="text-sm font-medium text-foreground">Apposer cachet &amp; signature</p>
                <p className="text-xs text-muted">Le cachet sera ajouté en bas du document</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setForm({ ...form, apply_stamp: !form.apply_stamp })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.apply_stamp ? "bg-primary-500" : "bg-slate-300"}`}
            >
              <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${form.apply_stamp ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <Textarea id="notes" label="Notes" placeholder="Notes ou conditions..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Enregistrement..." : editing ? "Modifier" : "Créer la facture"}</Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title={`Facture ${showDetail?.invoice_number || ""}`} size="lg">
        {showDetail && (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted">Client</p>
                <p className="font-medium">{showDetail.clients?.company_name || showDetail.clients?.contact_name || "—"}</p>
              </div>
              <Badge variant={statusColors[showDetail.status]}>{statusLabels[showDetail.status]}</Badge>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div><p className="text-muted">Émission</p><p>{formatShortDate(showDetail.issue_date)}</p></div>
              <div><p className="text-muted">Échéance</p><p>{showDetail.due_date ? formatShortDate(showDetail.due_date) : "—"}</p></div>
              <div className="text-right"><p className="text-muted">Total</p><p className="font-bold text-lg">{formatCurrency(showDetail.total)}</p></div>
              <div className="text-right"><p className="text-muted">Payé</p><p className="font-bold text-lg text-success-500">{formatCurrency(showDetail.paid_amount)}</p></div>
            </div>

            {detailItems.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Articles</h4>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100 text-xs text-muted">
                    <th className="text-left py-2">Description</th><th className="text-right py-2">Qté</th><th className="text-right py-2">Prix unit.</th><th className="text-right py-2">Total</th>
                  </tr></thead>
                  <tbody>
                    {detailItems.map((item) => (
                      <tr key={item.id} className="border-b border-slate-50">
                        <td className="py-2">{item.description}</td>
                        <td className="text-right">{item.quantity}</td>
                        <td className="text-right">{formatCurrency(item.unit_price)}</td>
                        <td className="text-right font-medium">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {detailPayments.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Paiements enregistrés</h4>
                {detailPayments.map((p) => (
                  <div key={p.id} className="flex justify-between items-center py-2 border-b border-slate-50 text-sm">
                    <div>
                      <span className="font-medium">{formatCurrency(p.amount)}</span>
                      <span className="text-muted ml-2">via {p.payment_method}</span>
                    </div>
                    <span className="text-muted">{formatShortDate(p.payment_date)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <PdfDownloadButton type="facture" data={showDetail} items={detailItems} label="Télécharger PDF" />
              <PdfDownloadButton type="facture" data={showDetail} items={detailItems} action="print" label="Imprimer" />
              {showDetail.status !== "payee" && showDetail.status !== "annulee" && (
                <Button size="sm" onClick={() => { setShowPayment(showDetail); setPaymentForm({ amount: String(Number(showDetail.total) - Number(showDetail.paid_amount)), payment_date: new Date().toISOString().split("T")[0], payment_method: "virement", reference: "" }); setShowDetail(null); }}>
                  <Wallet className="w-4 h-4" /> Enregistrer un paiement
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => { openEdit(showDetail); setShowDetail(null); }}><Pencil className="w-4 h-4" /> Modifier</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal open={!!showPayment} onClose={() => setShowPayment(null)} title="Enregistrer un paiement" size="sm">
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-lg text-sm">
            <p className="text-muted">Facture : <span className="font-medium text-foreground">{showPayment?.invoice_number}</span></p>
            <p className="text-muted">Reste dû : <span className="font-bold text-foreground">{showPayment ? formatCurrency(Number(showPayment.total) - Number(showPayment.paid_amount)) : ""}</span></p>
          </div>
          <Input id="pay_amount" label="Montant reçu (FCFA)" type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
          <Select id="pay_method" label="Mode de paiement" options={paymentMethods} value={paymentForm.payment_method} onChange={(e) => setPaymentForm({ ...paymentForm, payment_method: e.target.value })} />
          <Input id="pay_date" label="Date du paiement" type="date" value={paymentForm.payment_date} onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })} />
          <Input id="pay_ref" label="Référence" placeholder="N° transaction, chèque..." value={paymentForm.reference} onChange={(e) => setPaymentForm({ ...paymentForm, reference: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowPayment(null)}>Annuler</Button>
            <Button onClick={handlePayment} disabled={saving || !paymentForm.amount}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
          </div>
        </div>
      </Modal>

      {/* Inline Status Change Modal */}
      <Modal open={!!statusModal} onClose={() => setStatusModal(null)} title="Changer le statut" size="sm">
        {statusModal && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Facture <span className="font-medium text-foreground">{statusModal.invoice_number}</span> — statut actuel :&nbsp;
              <Badge variant={statusColors[statusModal.status]}>{statusLabels[statusModal.status]}</Badge>
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {statusOptions.map((opt) => {
                const isCurrent = statusModal.status === opt.value;
                const colorMap = {
                  brouillon: "bg-slate-100 text-slate-700 border-slate-300",
                  envoyee: "bg-primary-50 text-primary-700 border-primary-300",
                  partiellement_payee: "bg-amber-50 text-amber-700 border-amber-300",
                  payee: "bg-green-50 text-green-700 border-green-300",
                  en_retard: "bg-red-50 text-red-700 border-red-300",
                  annulee: "bg-slate-100 text-slate-500 border-slate-200",
                };
                return (
                  <button
                    key={opt.value}
                    onClick={() => !isCurrent && handleStatusChange(statusModal.id, opt.value)}
                    disabled={isCurrent}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all ${
                      isCurrent
                        ? `${colorMap[opt.value]} ring-2 ring-offset-1 ring-current opacity-100 cursor-default`
                        : `${colorMap[opt.value]} hover:shadow-sm hover:scale-[1.02] opacity-70 hover:opacity-100`
                    }`}
                  >
                    {isCurrent && <span className="mr-1">✓</span>}
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setStatusModal(null)}>Fermer</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Supprimer cette facture ?" message={`Supprimer la facture ${deleteConfirm?.invoice_number} ? Les paiements associés seront supprimés.`} confirmLabel="Supprimer" />
    </div>
  );
}
