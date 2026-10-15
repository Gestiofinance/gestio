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
import { useCrud, useSupabase } from "@/hooks/useSupabase";
import { formatCurrency } from "@/lib/utils";
import {
  Package, Plus, Search, Pencil, Trash2, TrendingUp, ShoppingCart,
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip,
} from "recharts";

const emptyForm = { name: "", description: "", unit_price: "", tax_rate: "18", unit: "unité", type: "service" };

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
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
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
    setShowForm(true);
  }

  function openEdit(p) {
    setForm({ name: p.name, description: p.description || "", unit_price: String(p.unit_price), tax_rate: String(p.tax_rate), unit: p.unit, type: p.type });
    setEditing(p);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form, unit_price: parseFloat(form.unit_price) || 0, tax_rate: parseFloat(form.tax_rate) || 0 };
      if (editing) await update(editing.id, payload);
      else await create(payload);
      await fetchAll({ order: { column: "name", ascending: true } });
      setShowForm(false);
    } catch (e) {
      console.error(e);
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
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{p.name}</p>
                        <Badge variant={p.type === "produit" ? "primary" : "default"}>{p.type === "produit" ? "Produit" : "Service"}</Badge>
                      </div>
                      {p.description && <p className="text-xs text-muted mt-0.5 truncate">{p.description}</p>}
                      <p className="text-sm font-medium text-foreground mt-1">{formatCurrency(p.unit_price)} <span className="text-xs text-muted font-normal">/ {p.unit}</span></p>
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

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Modifier l'article" : "Nouvel article"} size="md">
        <div className="space-y-4">
          <Input label="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Prix unitaire (FCFA)" type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
            <Input label="TVA (%)" type="number" value={form.tax_rate} onChange={(e) => setForm({ ...form, tax_rate: e.target.value })} />
            <Input label="Unité" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
          </div>
          <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[{ value: "service", label: "Service" }, { value: "produit", label: "Produit" }]} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>{saving ? "Enregistrement..." : editing ? "Modifier" : "Créer"}</Button>
          </div>
        </div>
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
