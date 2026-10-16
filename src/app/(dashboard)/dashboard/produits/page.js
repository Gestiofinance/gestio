"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCrud, useSupabase } from "@/hooks/useSupabase";
import { formatCurrency } from "@/lib/utils";
import {
  Package, Plus, Search, Pencil, Trash2, TrendingUp, ShoppingCart,
  Wrench, Box, ArrowLeft, ImagePlus, X, Hash, Clock,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip,
} from "recharts";

const emptyForm = { name: "", description: "", unit_price: "", tax_rate: "18", unit: "", type: "", reference: "", duration: "", image_url: "" };

const unitOptionsByType = {
  produit: [
    { value: "pièce", label: "Pièce" },
    { value: "kg", label: "Kg" },
    { value: "litre", label: "Litre" },
    { value: "carton", label: "Carton" },
    { value: "boîte", label: "Boîte" },
    { value: "unité", label: "Unité" },
  ],
  service: [
    { value: "heure", label: "Heure" },
    { value: "jour", label: "Jour" },
    { value: "forfait", label: "Forfait" },
    { value: "mois", label: "Mois" },
    { value: "prestation", label: "Prestation" },
  ],
};

function monthKey(d) { return `${d.getFullYear()}-${d.getMonth()}`; }

function MiniTrend({ data }) {
  return (
    <div className="h-16">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorCaMini" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5E5CE6" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#5E5CE6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip
            formatter={(value) => [formatCurrency(value), "CA"]}
            labelFormatter={(_, p) => p?.[0]?.payload?.mois}
            contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.08)", fontSize: 12 }}
          />
          <Area type="monotone" dataKey="ca" stroke="#5E5CE6" strokeWidth={2} fill="url(#colorCaMini)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ProduitsPage() {
  const supabase = useSupabase();
  const { data: catalog, loading, fetchAll, create, update, remove } = useCrud("catalog_items");
  const [salesItems, setSalesItems] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formStep, setFormStep] = useState("type"); // "type" | "details"
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  async function loadSales() {
    const { data } = await supabase
      .from("invoice_items")
      .select("catalog_item_id, quantity, total, invoices(issue_date, status)")
      .not("catalog_item_id", "is", null);
    setSalesItems(data || []);
  }

  useEffect(() => {
    fetchAll({ order: { column: "name", ascending: true } });
    loadSales();
  }, [fetchAll]);

  // Aggregate quantity/revenue/monthly trend per catalog item, excluding cancelled invoices.
  const statsByProduct = useMemo(() => {
    const map = {};
    for (const it of salesItems) {
      if (it.invoices?.status === "annulee") continue;
      const id = it.catalog_item_id;
      if (!map[id]) map[id] = { qty: 0, revenue: 0, monthly: {} };
      map[id].qty += Number(it.quantity) || 0;
      map[id].revenue += Number(it.total) || 0;
      if (it.invoices?.issue_date) {
        const key = monthKey(new Date(it.invoices.issue_date));
        map[id].monthly[key] = (map[id].monthly[key] || 0) + (Number(it.total) || 0);
      }
    }
    return map;
  }, [salesItems]);

  function getTrend(productId) {
    const now = new Date();
    const out = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({ mois: d.toLocaleDateString("fr-FR", { month: "short" }), ca: statsByProduct[productId]?.monthly[monthKey(d)] || 0 });
    }
    return out;
  }

  function openCreate() {
    setForm(emptyForm);
    setEditing(null);
    setImageFile(null);
    setImagePreview("");
    setFormStep("type");
    setFormError("");
    setShowForm(true);
  }

  function pickType(type) {
    setForm({ ...emptyForm, type, unit: unitOptionsByType[type][0].value });
    setFormStep("details");
  }

  function openEdit(p) {
    setForm({
      name: p.name, description: p.description || "", unit_price: String(p.unit_price), tax_rate: String(p.tax_rate),
      unit: p.unit, type: p.type, reference: p.reference || "", duration: p.duration || "", image_url: p.image_url || "",
    });
    setEditing(p);
    setImageFile(null);
    setImagePreview(p.image_url || "");
    setFormStep("details");
    setFormError("");
    setShowForm(true);
  }

  function handleImageChange(file) {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSave() {
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        name: form.name,
        description: form.description,
        unit_price: parseFloat(form.unit_price) || 0,
        tax_rate: parseFloat(form.tax_rate) || 0,
        unit: form.unit,
        type: form.type,
        reference: form.type === "produit" ? (form.reference || null) : null,
        duration: form.type === "service" ? (form.duration || null) : null,
      };

      const item = editing ? await update(editing.id, payload) : await create(payload);

      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        fd.append("type", "product");
        fd.append("itemId", item.id);
        const res = await fetch("/api/settings/upload", { method: "POST", body: fd });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      }

      await fetchAll({ order: { column: "name", ascending: true } });
      setShowForm(false);
    } catch (e) {
      console.error(e);
      setFormError(e.message || "Une erreur est survenue, veuillez réessayer.");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    await remove(deleteConfirm.id);
    await fetchAll({ order: { column: "name", ascending: true } });
    setDeleteConfirm(null);
  }

  const filtered = catalog.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header title="Services/Produits" />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm w-full border-none outline-none" />
          </div>
          <Button onClick={openCreate} className="flex-shrink-0">
            <Plus className="w-4 h-4" /> Nouvel article
          </Button>
        </div>

        <p className="text-xs text-muted">
          Le catalogue alimente les lignes de devis et factures. Les statistiques reflètent les ventes déjà facturées avec un article du catalogue.
        </p>

        {loading ? (
          <div className="text-center py-12 text-muted">Chargement...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title="Aucun article dans le catalogue"
            description="Ajoutez vos produits ou services pour les réutiliser dans vos devis et factures, et suivre leur évolution."
            actionLabel="Ajouter un article"
            onAction={openCreate}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const stats = statsByProduct[p.id];
              return (
                <Card key={p.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          {p.type === "produit" ? <Box className="w-5 h-5 text-slate-400" /> : <Wrench className="w-5 h-5 text-slate-400" />}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground truncate">{p.name}</p>
                          <Badge variant={p.type === "produit" ? "primary" : "default"}>{p.type === "produit" ? "Produit" : "Service"}</Badge>
                        </div>
                        {p.description && <p className="text-xs text-muted mt-0.5 truncate">{p.description}</p>}
                        <p className="text-sm font-medium text-foreground mt-1">{formatCurrency(p.unit_price)} <span className="text-xs text-muted font-normal">/ {p.unit}</span></p>
                        {p.reference && <p className="text-xs text-muted flex items-center gap-1 mt-0.5"><Hash className="w-3 h-3" /> {p.reference}</p>}
                        {p.duration && <p className="text-xs text-muted flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" /> {p.duration}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Modifier"><Pencil className="w-4 h-4 text-slate-500" /></button>
                      <button onClick={() => setDeleteConfirm(p)} className="p-1.5 rounded-lg hover:bg-danger-50" title="Supprimer"><Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-500" /></button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted flex items-center gap-1"><ShoppingCart className="w-3 h-3" /> Qté vendue</p>
                      <p className="text-sm font-semibold text-foreground">{stats?.qty || 0}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted flex items-center gap-1"><TrendingUp className="w-3 h-3" /> CA généré</p>
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(stats?.revenue || 0)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted mb-1">Évolution — 6 derniers mois</p>
                    <MiniTrend data={getTrend(p.id)} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={
          formStep === "type" ? "Nouvel article"
          : editing ? "Modifier l'article"
          : form.type === "produit" ? "Nouveau produit" : "Nouveau service"
        }
        size="md"
      >
        {formStep === "type" ? (
          <div className="space-y-3">
            <p className="text-sm text-muted">Quel type d&apos;article voulez-vous ajouter ?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => pickType("produit")}
                className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition-colors"
              >
                <Box className="w-7 h-7 text-primary-500" />
                <span className="font-medium text-foreground">Produit</span>
                <span className="text-xs text-muted text-center">Un bien physique ou numérique</span>
              </button>
              <button
                onClick={() => pickType("service")}
                className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-slate-200 hover:border-primary-400 hover:bg-primary-50 transition-colors"
              >
                <Wrench className="w-7 h-7 text-primary-500" />
                <span className="font-medium text-foreground">Service</span>
                <span className="text-xs text-muted text-center">Une prestation facturée</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!editing && (
              <button onClick={() => setFormStep("type")} className="flex items-center gap-1 text-xs text-muted hover:text-foreground">
                <ArrowLeft className="w-3.5 h-3.5" /> Changer de type
              </button>
            )}

            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Aperçu" className="w-16 h-16 rounded-lg object-cover border border-slate-200" />
                  <button
                    onClick={() => { setImageFile(null); setImagePreview(""); setForm({ ...form, image_url: "" }); }}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-danger-500 text-white flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
                  {form.type === "produit" ? <Box className="w-6 h-6 text-slate-400" /> : <Wrench className="w-6 h-6 text-slate-400" />}
                </div>
              )}
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 cursor-pointer hover:bg-slate-50">
                <ImagePlus className="w-4 h-4" />
                {imagePreview ? "Changer l'image" : "Ajouter une image (optionnel)"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e.target.files?.[0])} />
              </label>
            </div>

            <Input label="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input label="Prix unitaire (FCFA)" type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
              <Input label="TVA (%)" type="number" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
              <Select label="Unité" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                options={unitOptionsByType[form.type] || unitOptionsByType.service} />
            </div>

            {form.type === "produit" ? (
              <Input label="Référence / SKU (optionnel)" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="REF-001" />
            ) : (
              <Input label="Durée estimée (optionnel)" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="Ex. 2 heures, 1 jour..." />
            )}

            {formError && <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg">{formError}</p>}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving || !form.name}>{saving ? "Enregistrement..." : editing ? "Modifier" : "Créer"}</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Supprimer cet article ?"
        message={`Supprimer "${deleteConfirm?.name}" du catalogue ? Les lignes de devis/factures déjà créées avec cet article resteront intactes.`}
        confirmLabel="Supprimer"
      />
    </div>
  );
}
