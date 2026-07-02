"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCrud } from "@/hooks/useSupabase";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import {
  FolderKanban, Plus, Search, Calendar, Wallet, MoreVertical, Pencil, Trash2, Layers, CheckCircle, PlayCircle, Eye, Clock, User,
} from "lucide-react";

const statusOptions = [
  { value: "a_demarrer", label: "À démarrer" },
  { value: "en_cours", label: "En cours" },
  { value: "en_pause", label: "En pause" },
  { value: "termine", label: "Terminé" },
  { value: "annule", label: "Annulé" },
];

const statusColors = {
  a_demarrer: "default", en_cours: "primary", en_pause: "warning", termine: "success", annule: "danger",
};

const statusLabels = {
  a_demarrer: "À démarrer", en_cours: "En cours", en_pause: "En pause", termine: "Terminé", annule: "Annulé",
};

const emptyForm = {
  name: "", description: "", client_id: "", status: "a_demarrer",
  start_date: "", due_date: "", budget: "",
};

export default function ProjetsPage() {
  const { data: projects, loading, fetchAll, create, update, remove } = useCrud("projects");
  const { data: clients, fetchAll: fetchClients } = useCrud("clients");
  const [view, setView] = useState("liste");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [showDetail, setShowDetail] = useState(null);

  useEffect(() => {
    fetchAll({ select: "*, clients(company_name, contact_name)" });
    fetchClients();
  }, [fetchAll, fetchClients]);

  const filtered = projects.filter((p) => {
    if (filterStatus && p.status !== filterStatus) return false;
    return p.name.toLowerCase().includes(search.toLowerCase());
  });

  function openCreate() { setForm(emptyForm); setEditing(null); setShowForm(true); }
  function openEdit(p) {
    setForm({
      name: p.name, description: p.description || "", client_id: p.client_id || "",
      status: p.status, start_date: p.start_date || "", due_date: p.due_date || "",
      budget: p.budget || "",
    });
    setEditing(p); setShowForm(true); setActiveMenu(null);
  }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form, budget: form.budget ? parseFloat(form.budget) : 0, client_id: form.client_id || null };
    try {
      if (editing) await update(editing.id, payload);
      else await create(payload);
      await fetchAll({ select: "*, clients(company_name, contact_name)" });
      setShowForm(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    await remove(deleteConfirm.id);
    await fetchAll({ select: "*, clients(company_name, contact_name)" });
    setDeleteConfirm(null);
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  const clientName = (row) => row.clients?.company_name || row.clients?.contact_name || "—";

  const columns = [
    {
      key: "name", label: "Projet",
      render: (v, row) => (
        <div>
          <p className="font-medium text-foreground">{v}</p>
          <p className="text-xs text-muted">{clientName(row)}</p>
        </div>
      ),
    },
    { key: "status", label: "Statut", render: (v) => <Badge variant={statusColors[v]}>{statusLabels[v]}</Badge> },
    { key: "due_date", label: "Échéance", render: (v) => <span className="text-slate-600">{v ? formatShortDate(v) : "—"}</span> },
    { key: "budget", label: "Budget", align: "right", render: (v) => <span className="font-medium">{v ? formatCurrency(v) : "—"}</span> },
    {
      key: "actions", label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setShowDetail(row)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Aperçu"><Eye className="w-4 h-4 text-slate-500" /></button>
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Modifier"><Pencil className="w-4 h-4 text-slate-500" /></button>
          <button onClick={() => setDeleteConfirm(row)} className="p-1.5 rounded-lg hover:bg-danger-50" title="Supprimer"><Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-500" /></button>
        </div>
      ),
    },
  ];

  const kanbanStatuses = ["a_demarrer", "en_cours", "en_pause", "termine"];

  return (
    <div onClick={() => setActiveMenu(null)}>
      <Header title="Projets" />
      <div className="p-4 sm:p-6 space-y-4">
        {projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total projets" value={projects.length} icon={Layers} />
            <StatCard title="Projets actifs" value={projects.filter((p) => p.status === "en_cours").length} icon={PlayCircle} />
            <StatCard title="Projets terminés" value={projects.filter((p) => p.status === "termine").length} icon={CheckCircle} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Tabs tabs={[{ value: "liste", label: "Liste", count: projects.length }, { value: "kanban", label: "Kanban" }]} activeTab={view} onChange={setView} />
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white sm:flex-1">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm w-full border-none outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600">
                <option value="">Statut</option>
                <option value="a_demarrer">À démarrer</option>
                <option value="en_cours">En cours</option>
                <option value="en_pause">En pause</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
              <Button onClick={openCreate} className="flex-shrink-0"><Plus className="w-4 h-4" /> Nouveau projet</Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted">Chargement...</div>
        ) : projects.length === 0 ? (
          <EmptyState icon={FolderKanban} title="Aucun projet" description="Créez votre premier projet et organisez vos tâches et livrables." actionLabel="Créer un projet" onAction={openCreate} />
        ) : view === "liste" ? (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {filtered.length === 0 ? (
                <p className="text-center py-8 text-muted text-sm">Aucun projet trouvé</p>
              ) : filtered.map((project) => (
                <div key={project.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 cursor-pointer active:bg-slate-50" onClick={() => setShowDetail(project)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm">{project.name}</p>
                        <p className="text-slate-500 text-xs mt-0.5">{clientName(project)}</p>
                      </div>
                      <Badge variant={statusColors[project.status]} className="flex-shrink-0">{statusLabels[project.status]}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
                      <div className="flex items-center gap-3">
                        {project.start_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatShortDate(project.start_date)}</span>}
                        {project.due_date && <span className="flex items-center gap-1">→ {formatShortDate(project.due_date)}</span>}
                      </div>
                      {project.budget > 0 && <span className="font-medium text-foreground text-sm">{formatCurrency(project.budget)}</span>}
                    </div>
                    {project.description && <p className="text-xs text-slate-500 mt-2 line-clamp-2">{project.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="secondary" className="flex-1 text-xs" onClick={() => setShowDetail(project)}>
                      <Eye className="w-3.5 h-3.5" /> Voir
                    </Button>
                    <button onClick={() => openEdit(project)} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100" title="Modifier">
                      <Pencil className="w-4 h-4 text-slate-500" />
                    </button>
                    <button onClick={() => setDeleteConfirm(project)} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-danger-50" title="Supprimer">
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <Card className="hidden sm:block"><DataTable columns={columns} data={filtered} emptyMessage="Aucun projet trouvé" /></Card>
          </>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanStatuses.map((status) => (
              <div key={status} className="space-y-3 min-w-[240px] flex-shrink-0">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-slate-700">{statusLabels[status]}</h3>
                  <Badge variant={statusColors[status]}>{filtered.filter((p) => p.status === status).length}</Badge>
                </div>
                <div className="space-y-2">
                  {filtered.filter((p) => p.status === status).map((project) => (
                    <Card key={project.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(project)}>
                      <p className="text-sm font-medium text-foreground mb-1">{project.name}</p>
                      <p className="text-xs text-muted mb-2">{clientName(project)}</p>
                      <div className="flex items-center justify-between text-xs text-muted">
                        {project.due_date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatShortDate(project.due_date)}</span>}
                        {project.budget > 0 && <span className="flex items-center gap-1"><Wallet className="w-3 h-3" />{formatCurrency(project.budget)}</span>}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Modifier le projet" : "Nouveau projet"} size="lg">
        <div className="space-y-4">
          <Input id="name" name="name" label="Nom du projet" placeholder="Site web client X" value={form.name} onChange={handleChange} required />
          <Select id="client_id" name="client_id" label="Client" value={form.client_id} onChange={handleChange}
            options={[{ value: "", label: "— Aucun client —" }, ...clients.map((c) => ({ value: c.id, label: c.company_name || c.contact_name }))]} />
          <Select id="status" name="status" label="Statut" options={statusOptions} value={form.status} onChange={handleChange} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input id="start_date" name="start_date" label="Date de début" type="date" value={form.start_date} onChange={handleChange} />
            <Input id="due_date" name="due_date" label="Échéance" type="date" value={form.due_date} onChange={handleChange} />
            <Input id="budget" name="budget" label="Budget (FCFA)" type="number" placeholder="0" value={form.budget} onChange={handleChange} />
          </div>
          <Textarea id="description" name="description" label="Description" placeholder="Description du projet..." value={form.description} onChange={handleChange} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.name}>{saving ? "Enregistrement..." : editing ? "Modifier" : "Créer"}</Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!showDetail} onClose={() => setShowDetail(null)} title="Aperçu du projet" size="lg">
        {showDetail && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground">{showDetail.name}</h3>
                <p className="text-sm text-muted mt-1">{clientName(showDetail)}</p>
              </div>
              <Badge variant={statusColors[showDetail.status]}>{statusLabels[showDetail.status]}</Badge>
            </div>

            {showDetail.description && (
              <div>
                <p className="text-xs text-muted mb-1">Description</p>
                <p className="text-sm text-slate-600">{showDetail.description}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {showDetail.start_date && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-muted mb-1"><Calendar className="w-3 h-3" /> Début</div>
                  <p className="text-sm font-medium">{formatShortDate(showDetail.start_date)}</p>
                </div>
              )}
              {showDetail.due_date && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-muted mb-1"><Clock className="w-3 h-3" /> Échéance</div>
                  <p className="text-sm font-medium">{formatShortDate(showDetail.due_date)}</p>
                </div>
              )}
              {showDetail.budget > 0 && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-muted mb-1"><Wallet className="w-3 h-3" /> Budget</div>
                  <p className="text-sm font-medium">{formatCurrency(showDetail.budget)}</p>
                </div>
              )}
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-1.5 text-xs text-muted mb-1"><User className="w-3 h-3" /> Client</div>
                <p className="text-sm font-medium">{clientName(showDetail)}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button size="sm" onClick={() => { openEdit(showDetail); setShowDetail(null); }}><Pencil className="w-4 h-4" /> Modifier</Button>
              <Button size="sm" variant="danger" onClick={() => { setDeleteConfirm(showDetail); setShowDetail(null); }}><Trash2 className="w-4 h-4" /> Supprimer</Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Supprimer ce projet ?" message={`Supprimer "${deleteConfirm?.name}" ? Les tâches liées seront aussi supprimées.`} confirmLabel="Supprimer" />
    </div>
  );
}
