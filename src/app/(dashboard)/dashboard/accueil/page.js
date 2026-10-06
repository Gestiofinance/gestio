"use client";

import { useState, useEffect, useCallback } from "react";
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
import { useCrud, useSupabase, getOrgId } from "@/hooks/useSupabase";
import {
  ConciergeBell, Plus, Phone, UserCheck, UserCircle2, Trash2, UserPlus, Search,
} from "lucide-react";

const statusLabels = { en_attente: "En attente", recu: "Reçu", termine: "Terminé", annule: "Annulé" };
const statusColors = { en_attente: "warning", recu: "primary", termine: "success", annule: "default" };
const statusFlow = { en_attente: "recu", recu: "termine" };
const statusFlowLabel = { en_attente: "Marquer reçu", recu: "Marquer terminé" };

function formatDateTime(d) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(new Date(d));
}

function nowLocalInput() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const emptyForm = { full_name: "", phone: "", visit_date: nowLocalInput(), host_id: "", notes: "" };

export default function AccueilPage() {
  const supabase = useSupabase();
  const { data: visits, loading, fetchAll, create, update, remove } = useCrud("visitor_appointments");
  const { create: createClient } = useCrud("clients");

  const [members, setMembers] = useState([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [converting, setConverting] = useState(null);

  const load = useCallback(async () => {
    await fetchAll({ select: "*, host:host_id(full_name)", order: { column: "visit_date", ascending: false } });
    const orgId = await getOrgId(supabase);
    if (orgId) {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .order("full_name");
      setMembers(data || []);
    }
  }, [fetchAll, supabase]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ ...emptyForm, visit_date: nowLocalInput(), host_id: members[0]?.id || "" });
    setShowForm(true);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSave() {
    setSaving(true);
    try {
      await create({
        full_name: form.full_name,
        phone: form.phone || null,
        visit_date: new Date(form.visit_date).toISOString(),
        host_id: form.host_id || null,
        notes: form.notes || null,
      });
      await load();
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  async function handleAdvanceStatus(visit) {
    const next = statusFlow[visit.status];
    if (!next) return;
    await update(visit.id, { status: next });
    await load();
  }

  async function handleCancel(visit) {
    await update(visit.id, { status: "annule" });
    await load();
  }

  async function handleConvert(visit) {
    setConverting(visit.id);
    try {
      const client = await createClient({
        type: "particulier",
        contact_name: visit.full_name,
        phone: visit.phone || null,
        status: "prospect",
        notes: `Converti depuis Accueil le ${formatDateTime(new Date())}.`,
      });
      await update(visit.id, { client_id: client.id });
      await load();
    } catch (err) {
      console.error(err);
    }
    setConverting(null);
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    await remove(deleteConfirm.id);
    await load();
    setDeleteConfirm(null);
  }

  const filtered = visits.filter((v) => {
    if (filterStatus && v.status !== filterStatus) return false;
    const q = search.toLowerCase();
    return v.full_name.toLowerCase().includes(q) || (v.phone || "").toLowerCase().includes(q);
  });

  return (
    <div>
      <Header title="Rendez-vous" />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Rechercher un visiteur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm w-full border-none outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600"
            >
              <option value="">Tous les statuts</option>
              {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <Button onClick={openCreate} className="flex-shrink-0">
              <Plus className="w-4 h-4" /> Nouveau visiteur
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted">Chargement...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ConciergeBell}
            title="Aucun visiteur enregistré"
            description="Enregistrez une personne qui se présente à l'accueil pour rencontrer un membre de l'équipe."
            actionLabel="Nouveau visiteur"
            onAction={openCreate}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((v) => (
              <Card key={v.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                      <UserCircle2 className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{v.full_name}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted mt-0.5">
                        <span>{formatDateTime(v.visit_date)}</span>
                        {v.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{v.phone}</span>}
                        <span className="flex items-center gap-1"><UserCheck className="w-3 h-3" />Pour {v.host?.full_name || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={statusColors[v.status]}>{statusLabels[v.status]}</Badge>
                    {v.client_id && <Badge variant="success">Converti en client</Badge>}

                    {statusFlow[v.status] && (
                      <Button size="sm" variant="secondary" onClick={() => handleAdvanceStatus(v)}>
                        {statusFlowLabel[v.status]}
                      </Button>
                    )}
                    {!v.client_id && v.status !== "annule" && (
                      <Button size="sm" variant="secondary" onClick={() => handleConvert(v)} disabled={converting === v.id}>
                        <UserPlus className="w-3.5 h-3.5" /> {converting === v.id ? "..." : "Convertir en client"}
                      </Button>
                    )}
                    {v.status !== "annule" && v.status !== "termine" && (
                      <button onClick={() => handleCancel(v)} className="px-2 py-1 text-xs text-slate-500 hover:text-danger-500" title="Annuler">
                        Annuler
                      </button>
                    )}
                    <button onClick={() => setDeleteConfirm(v)} className="p-1.5 rounded-lg hover:bg-danger-50" title="Supprimer">
                      <Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-500" />
                    </button>
                  </div>
                </div>
                {v.notes && <p className="text-xs text-slate-500 mt-2 pl-13">{v.notes}</p>}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Nouveau visiteur" size="md">
        <div className="space-y-4">
          <Input
            id="full_name" name="full_name" label="Nom et prénom"
            placeholder="Amadou Fall" value={form.full_name} onChange={handleChange} required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="phone" name="phone" label="Téléphone"
              placeholder="77 000 00 00" value={form.phone} onChange={handleChange}
            />
            <Input
              id="visit_date" name="visit_date" label="Date" type="datetime-local"
              value={form.visit_date} onChange={handleChange}
            />
          </div>
          <Select
            id="host_id" name="host_id" label="Personne à rencontrer"
            options={members.map((m) => ({ value: m.id, label: m.full_name }))}
            value={form.host_id} onChange={handleChange}
          />
          <Textarea
            id="notes" name="notes" label="Motif de la visite (optionnel)"
            placeholder="Objet du rendez-vous..." value={form.notes} onChange={handleChange}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.full_name}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Supprimer ce visiteur ?"
        message={`Êtes-vous sûr de vouloir supprimer l'enregistrement de ${deleteConfirm?.full_name} ?`}
        confirmLabel="Supprimer"
      />
    </div>
  );
}
