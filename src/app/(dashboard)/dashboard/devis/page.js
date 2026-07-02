"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { useCrud, useSupabase, getOrgId } from "@/hooks/useSupabase";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { PdfDownloadButton } from "@/components/ui/pdf-download-button";
import { ActionMenu, ActionMenuItem } from "@/components/ui/action-menu";
import {
  FileText, Plus, Search, Trash2, ArrowRightLeft, Pencil, Eye, Download, MessageCircle, Mail, Stamp,
} from "lucide-react";

const statusColors = { brouillon: "default", envoye: "primary", accepte: "success", refuse: "danger", expire: "warning" };
const statusLabels = { brouillon: "Brouillon", envoye: "Envoyé", accepte: "Accepté", refuse: "Refusé", expire: "Expiré" };

const statusOptions = [
  { value: "brouillon", label: "Brouillon" },
  { value: "envoye", label: "Envoyé" },
  { value: "accepte", label: "Accepté" },
  { value: "refuse", label: "Refusé" },
  { value: "expire", label: "Expiré" },
];

const emptyLine = { description: "", quantity: 1, unit_price: 0, tax_rate: 18 };

export default function DevisPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const { data: quotes, loading, fetchAll, remove } = useCrud("quotes");
  const { data: clients, fetchAll: fetchClients } = useCrud("clients");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");

  const [form, setForm] = useState({
    client_id: "", status: "brouillon", issue_date: new Date().toISOString().split("T")[0],
    expiry_date: "", notes: "", conditions: "", apply_stamp: false,
    discount_type: "amount", discount_value: "",
  });
  const [lines, setLines] = useState([{ ...emptyLine }]);

  useEffect(() => {
    fetchAll({ select: "*, clients(company_name, contact_name, email, phone)" });
    fetchClients();
  }, [fetchAll, fetchClients]);

  const filtered = quotes.filter((q) => {
    if (filterStatus && q.status !== filterStatus) return false;
    return q.quote_number.toLowerCase().includes(search.toLowerCase()) ||
      (q.clients?.company_name || "").toLowerCase().includes(search.toLowerCase());
  });

  function calcTotals(items) {
    const subtotal = items.reduce((s, l) => s + l.quantity * l.unit_price, 0);
    const dv = parseFloat(form.discount_value) || 0;
    const discountAmount = form.discount_type === "percent" ? subtotal * (dv / 100) : dv;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    const taxAmount = afterDiscount * 0.18;
    return { subtotal, discount_amount: discountAmount, tax_amount: taxAmount, total: afterDiscount + taxAmount };
  }

  function openCreate() {
    setForm({ client_id: "", status: "brouillon", issue_date: new Date().toISOString().split("T")[0], expiry_date: "", notes: "", conditions: "", apply_stamp: false, discount_type: "amount", discount_value: "" });
    setLines([{ ...emptyLine }]);
    setEditing(null);
    setShowForm(true);
  }

  async function openEdit(quote) {
    const { data: items } = await supabase.from("quote_items").select("*").eq("quote_id", quote.id).order("sort_order");
    setForm({
      client_id: quote.client_id || "", status: quote.status,
      issue_date: quote.issue_date || "", expiry_date: quote.expiry_date || "",
      notes: quote.notes || "", conditions: quote.conditions || "",
      apply_stamp: quote.apply_stamp || false,
      discount_type: quote.discount_type || "amount", discount_value: quote.discount_value || "",
    });
    setLines(items?.length ? items.map((i) => ({ description: i.description, quantity: i.quantity, unit_price: i.unit_price, tax_rate: i.tax_rate })) : [{ ...emptyLine }]);
    setEditing(quote);
    setShowForm(true);
    setActiveMenu(null);
  }

  async function handleSave() {
    setSaving(true);
    const totals = calcTotals(lines);
    try {
      const payload = { ...form, client_id: form.client_id || null, discount_value: parseFloat(form.discount_value) || 0, ...totals };
      const validLines = lines.filter((l) => l.description);

      let res;
      if (editing) {
        res = await fetch("/api/quotes", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload, lines: validLines }),
        });
      } else {
        res = await fetch("/api/quotes", {
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

  async function convertToInvoice(quote) {
    const { data: items } = await supabase.from("quote_items").select("*").eq("quote_id", quote.id);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteId: quote.id,
        quoteItems: items || [],
        client_id: quote.client_id,
        status: "brouillon",
        type: "standard",
        issue_date: new Date().toISOString().split("T")[0],
        due_date: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
        subtotal: quote.subtotal,
        tax_amount: quote.tax_amount,
        total: quote.total,
        discount_amount: quote.discount_amount || 0,
        discount_type: quote.discount_type || "amount",
        discount_value: quote.discount_value || 0,
        notes: quote.notes,
        conditions: quote.conditions,
      }),
    });
    if (!res.ok) { const d = await res.json(); console.error(d.error); return; }
    await fetchAll({ select: "*, clients(company_name, contact_name, email, phone)" });
    setShowDetail(null);
    router.push("/dashboard/factures");
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    await remove(deleteConfirm.id);
    await fetchAll({ select: "*, clients(company_name, contact_name, email, phone)" });
    setDeleteConfirm(null);
    setShowDetail(null);
  }

  function updateLine(index, field, value) {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: field === "description" ? value : parseFloat(value) || 0 };
    setLines(updated);
  }

  function addLine() { setLines([...lines, { ...emptyLine }]); }
  function removeLine(index) { setLines(lines.filter((_, i) => i !== index)); }

  const totals = calcTotals(lines);

  function shareWhatsApp(row) {
    const phone = row.clients?.phone?.replace(/\s/g, "") || "";
    const msg = encodeURIComponent(`Bonjour, veuillez trouver ci-joint le devis ${row.quote_number} d'un montant de ${formatCurrency(row.total)}. Cordialement.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  }
  function shareEmail(row) {
    const email = row.clients?.email || "";
    const subject = encodeURIComponent(`Devis ${row.quote_number}`);
    const body = encodeURIComponent(`Bonjour,\n\nVeuillez trouver ci-joint le devis ${row.quote_number} d'un montant de ${formatCurrency(row.total)}.\n\nCordialement.`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, "_blank");
  }

  const columns = [
    { key: "quote_number", label: "N° Devis", render: (v) => <span className="font-medium text-foreground">{v}</span> },
    { key: "client", label: "Client", render: (_, r) => <span className="text-slate-600">{r.clients?.company_name || r.clients?.contact_name || "—"}</span> },
    { key: "issue_date", label: "Date", render: (v) => <span className="text-slate-600">{v ? formatShortDate(v) : "—"}</span> },
    { key: "total", label: "Montant TTC", align: "right", render: (v) => <span className="font-medium">{formatCurrency(v)}</span> },
    { key: "status", label: "Statut", compact: true, render: (v) => <Badge variant={statusColors[v]}>{statusLabels[v]}</Badge> },
    {
      key: "share", label: "", compact: true,
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => shareWhatsApp(row)} className="p-1 rounded-lg hover:bg-success-50 transition-colors" title="WhatsApp">
            <MessageCircle className="w-3.5 h-3.5 text-success-500" />
          </button>
          <button onClick={() => shareEmail(row)} className="p-1 rounded-lg hover:bg-primary-50 transition-colors" title="Email">
            <Mail className="w-3.5 h-3.5 text-primary-500" />
          </button>
        </div>
      ),
    },
    {
      key: "actions", label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setShowDetail(row)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Aperçu"><Eye className="w-4 h-4 text-slate-500" /></button>
          <PdfDownloadButton type="devis" data={row} variant="ghost" size="sm" label="" />
          <PdfDownloadButton type="devis" data={row} action="print" variant="ghost" size="sm" label="" />
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Modifier"><Pencil className="w-4 h-4 text-slate-500" /></button>
          <button onClick={() => setDeleteConfirm(row)} className="p-1.5 rounded-lg hover:bg-danger-50" title="Supprimer"><Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-500" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Header title="Devis" />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-foreground">Gestion des devis</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white sm:flex-1">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm w-full border-none outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600">
                <option value="">Tous statuts</option>
                <option value="brouillon">Brouillon</option>
                <option value="envoye">Envoyé</option>
                <option value="accepte">Accepté</option>
                <option value="refuse">Refusé</option>
                <option value="expire">Expiré</option>
              </select>
              <Button onClick={openCreate} className="flex-shrink-0"><Plus className="w-4 h-4" /> Nouveau devis</Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted">Chargement...</div>
        ) : quotes.length === 0 ? (
          <EmptyState icon={FileText} title="Aucun devis" description="Créez votre premier devis professionnel et envoyez-le à vos clients." actionLabel="Créer un devis" onAction={openCreate} />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {filtered.length === 0 ? (
                <p className="text-center py-8 text-muted text-sm">Aucun devis trouvé</p>
              ) : filtered.map((q) => (
                <div key={q.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 cursor-pointer active:bg-slate-50" onClick={() => setShowDetail(q)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm">{q.quote_number}</p>
                        <p className="text-slate-500 text-sm mt-0.5 truncate">{q.clients?.company_name || q.clients?.contact_name || "—"}</p>
                      </div>
                      <Badge variant={statusColors[q.status]} className="flex-shrink-0">{statusLabels[q.status]}</Badge>
                    </div>
                    <div className="flex items-end justify-between mt-3">
                      <p className="text-xs text-slate-400">{q.issue_date ? formatShortDate(q.issue_date) : "—"}</p>
                      <p className="font-bold text-xl text-foreground">{formatCurrency(q.total)}</p>
                    </div>
                    {q.expiry_date && (
                      <p className="text-xs text-slate-400 mt-1">Exp. {formatShortDate(q.expiry_date)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="secondary" className="flex-1 text-xs" onClick={() => setShowDetail(q)}>
                      <Eye className="w-3.5 h-3.5" /> Voir
                    </Button>
                    <PdfDownloadButton type="devis" data={q} variant="secondary" size="sm" label="" />
                    {q.status === "accepte" && !q.converted_to_invoice && (
                      <button onClick={() => convertToInvoice(q)} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-primary-50" title="Convertir en facture">
                        <ArrowRightLeft className="w-4 h-4 text-primary-500" />
                      </button>
                    )}
                    <button onClick={() => openEdit(q)} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100" title="Modifier">
                      <Pencil className="w-4 h-4 text-slate-500" />
                    </button>
                    <button onClick={() => setDeleteConfirm(q)} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-danger-50" title="Supprimer">
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <Card className="hidden sm:block">
              <DataTable columns={columns} data={filtered} onRowClick={(r) => setShowDetail(r)} emptyMessage="Aucun devis trouvé" />
            </Card>
          </>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Modifier le devis" : "Nouveau devis"} size="xl">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Select id="client_id" name="client_id" label="Client" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })}
              options={[{ value: "", label: "— Sélectionner —" }, ...clients.map((c) => ({ value: c.id, label: c.company_name || c.contact_name }))]} />
            <Select id="status" name="status" label="Statut" options={statusOptions} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
            <Input id="issue_date" label="Date d'émission" type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
            <Input id="expiry_date" label="Date d'expiration" type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })} />
          </div>

          {/* Lines */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Articles</h3>
            <div className="overflow-x-auto -mx-1">
            <div className="space-y-2 min-w-[480px]">
              <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted px-1">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Quantité</div>
                <div className="col-span-2">Prix unitaire</div>
                <div className="col-span-2 text-right">Total HT</div>
                <div className="col-span-1"></div>
              </div>
              {lines.map((line, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                  <input className="col-span-5 px-3 py-2 rounded-lg border border-slate-200 text-sm" placeholder="Description de l'article" value={line.description} onChange={(e) => updateLine(i, "description", e.target.value)} />
                  <input className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-sm" type="number" min="1" value={line.quantity} onChange={(e) => updateLine(i, "quantity", e.target.value)} />
                  <input className="col-span-2 px-3 py-2 rounded-lg border border-slate-200 text-sm" type="number" min="0" value={line.unit_price} onChange={(e) => updateLine(i, "unit_price", e.target.value)} />
                  <div className="col-span-2 text-right text-sm font-medium">{formatCurrency(line.quantity * line.unit_price)}</div>
                  <button onClick={() => removeLine(i)} className="col-span-1 p-1.5 rounded-lg hover:bg-danger-50 text-slate-400 hover:text-danger-500 justify-self-center">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-2" onClick={addLine}><Plus className="w-4 h-4" /> Ajouter une ligne</Button>
          </div>

          {/* Remise */}
          <div className="flex items-end gap-3">
            <div className="w-40">
              <Select id="discount_type" label="Remise" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
                options={[{ value: "amount", label: "Montant (FCFA)" }, { value: "percent", label: "Pourcentage (%)" }]} />
            </div>
            <div className="w-36">
              <Input id="discount_value" type="number" placeholder="0" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted">Sous-total HT</span><span className="font-medium">{formatCurrency(totals.subtotal)}</span></div>
              {totals.discount_amount > 0 && (
                <div className="flex justify-between"><span className="text-muted">Remise</span><span className="font-medium text-danger-500">-{formatCurrency(totals.discount_amount)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-muted">TVA (18%)</span><span className="font-medium">{formatCurrency(totals.tax_amount)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2"><span className="font-semibold">Total TTC</span><span className="font-bold text-lg">{formatCurrency(totals.total)}</span></div>
            </div>
          </div>

          {/* Cachet toggle */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Stamp className="w-5 h-5 text-muted" />
              <div>
                <p className="text-sm font-medium text-foreground">Apposer cachet &amp; signature</p>
                <p className="text-xs text-muted">Le cachet importé dans les paramètres sera ajouté au document</p>
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

          <Textarea id="notes" label="Notes" placeholder="Notes ou conditions particulières..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Enregistrement..." : editing ? "Modifier" : "Créer le devis"}</Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title={`Devis ${showDetail?.quote_number || ""}`} size="lg">
        {showDetail && (
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted">Client</p>
                <p className="font-medium">{showDetail.clients?.company_name || showDetail.clients?.contact_name || "—"}</p>
              </div>
              <Badge variant={statusColors[showDetail.status]}>{statusLabels[showDetail.status]}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div><p className="text-muted">Date</p><p>{showDetail.issue_date ? formatShortDate(showDetail.issue_date) : "—"}</p></div>
              <div><p className="text-muted">Expiration</p><p>{showDetail.expiry_date ? formatShortDate(showDetail.expiry_date) : "—"}</p></div>
              <div className="text-right"><p className="text-muted">Montant TTC</p><p className="text-xl font-bold">{formatCurrency(showDetail.total)}</p></div>
            </div>
            <div className="flex flex-wrap gap-3 pt-4">
              <PdfDownloadButton type="devis" data={showDetail} label="Télécharger PDF" />
              <PdfDownloadButton type="devis" data={showDetail} action="print" label="Imprimer" />
              <Button size="sm" variant="secondary" onClick={() => { openEdit(showDetail); setShowDetail(null); }}><Pencil className="w-4 h-4" /> Modifier</Button>
              {!showDetail.converted_to_invoice && (
                <Button size="sm" onClick={() => convertToInvoice(showDetail)}><ArrowRightLeft className="w-4 h-4" /> Convertir en facture</Button>
              )}
              <Button size="sm" variant="danger" onClick={() => setDeleteConfirm(showDetail)}><Trash2 className="w-4 h-4" /> Supprimer</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Supprimer ce devis ?" message={`Supprimer le devis ${deleteConfirm?.quote_number} ?`} confirmLabel="Supprimer" />
    </div>
  );
}
