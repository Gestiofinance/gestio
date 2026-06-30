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
import { formatShortDate } from "@/lib/utils";
import {
  CheckSquare, Plus, Search, Calendar, MoreVertical, Pencil, Trash2, Flag,
} from "lucide-react";

const statusOptions = [
  { value: "a_faire", label: "À faire" },
  { value: "en_cours", label: "En cours" },
  { value: "en_revision", label: "En révision" },
  { value: "termine", label: "Terminé" },
];

const priorityOptions = [
  { value: "basse", label: "Basse" },
  { value: "moyenne", label: "Moyenne" },
  { value: "haute", label: "Haute" },
  { value: "urgente", label: "Urgente" },
];

const statusColors = { a_faire: "default", en_cours: "primary", en_revision: "warning", termine: "success" };
const statusLabels = { a_faire: "À faire", en_cours: "En cours", en_revision: "En révision", termine: "Terminé" };
const priorityColors = { basse: "default", moyenne: "primary", haute: "warning", urgente: "danger" };

const emptyForm = {
  title: "", description: "", project_id: "", status: "a_faire",
  priority: "moyenne", due_date: "",
};

export default function TachesPage() {
  const { data: tasks, loading, fetchAll, create, update, remove } = useCrud("tasks");
  const { data: projects, fetchAll: fetchProjects } = useCrud("projects");
  const [view, setView] = useState("liste");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  useEffect(() => {
    fetchAll({ select: "*, projects(name)" });
    fetchProjects();
  }, [fetchAll, fetchProjects]);

  const filtered = tasks.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return t.title.toLowerCase().includes(search.toLowerCase());
  });

  function openCreate() { setForm(emptyForm); setEditing(null); setShowForm(true); }
  function openEdit(t) {
    setForm({
      title: t.title, description: t.description || "", project_id: t.project_id || "",
      status: t.status, priority: t.priority, due_date: t.due_date || "",
    });
    setEditing(t); setShowForm(true); setActiveMenu(null);
  }

  async function handleSave() {
    setSaving(true);
    const payload = { ...form, project_id: form.project_id || null };
    try {
      if (editing) await update(editing.id, payload);
      else await create(payload);
      await fetchAll({ select: "*, projects(name)" });
      setShowForm(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    await remove(deleteConfirm.id);
    await fetchAll({ select: "*, projects(name)" });
    setDeleteConfirm(null);
  }

  async function toggleComplete(task) {
    const newStatus = task.status === "termine" ? "a_faire" : "termine";
    await update(task.id, { status: newStatus });
    await fetchAll({ select: "*, projects(name)" });
  }

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }); }

  const columns = [
    {
      key: "title", label: "Tâche",
      render: (v, row) => (
        <div className="flex items-center gap-3">
          <input type="checkbox" checked={row.status === "termine"} onChange={() => toggleComplete(row)}
            className="rounded border-slate-300 text-primary-500" onClick={(e) => e.stopPropagation()} />
          <div>
            <p className={`font-medium ${row.status === "termine" ? "line-through text-muted" : "text-foreground"}`}>{v}</p>
            {row.projects?.name && <p className="text-xs text-muted">{row.projects.name}</p>}
          </div>
        </div>
      ),
    },
    { key: "priority", label: "Priorité", render: (v) => <Badge variant={priorityColors[v]}>{v}</Badge> },
    { key: "status", label: "Statut", render: (v) => <Badge variant={statusColors[v]}>{statusLabels[v]}</Badge> },
    { key: "due_date", label: "Échéance", render: (v) => <span className="text-slate-600">{v ? formatShortDate(v) : "—"}</span> },
    {
      key: "actions", label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Modifier"><Pencil className="w-4 h-4 text-slate-500" /></button>
          <button onClick={() => setDeleteConfirm(row)} className="p-1.5 rounded-lg hover:bg-danger-50" title="Supprimer"><Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-500" /></button>
        </div>
      ),
    },
  ];

  const kanbanStatuses = ["a_faire", "en_cours", "en_revision", "termine"];

  return (
    <div onClick={() => setActiveMenu(null)}>
      <Header title="Tâches" />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Tabs tabs={[{ value: "liste", label: "Liste", count: tasks.length }, { value: "kanban", label: "Kanban" }]} activeTab={view} onChange={setView} />
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white w-48">
              <Search className="w-4 h-4 text-slate-400" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm w-full border-none outline-none" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600">
              <option value="">Tous les statuts</option>
              <option value="a_faire">À faire</option>
              <option value="en_cours">En cours</option>
              <option value="en_revision">En révision</option>
              <option value="termine">Terminé</option>
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600">
              <option value="">Toutes priorités</option>
              <option value="basse">Basse</option>
              <option value="moyenne">Moyenne</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </select>
            <Button onClick={openCreate}><Plus className="w-4 h-4" /> Nouvelle tâche</Button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted">Chargement...</div>
        ) : tasks.length === 0 ? (
          <EmptyState icon={CheckSquare} title="Aucune tâche" description="Organisez votre travail avec des tâches et suivez l'avancement." actionLabel="Créer une tâche" onAction={openCreate} />
        ) : view === "liste" ? (
          <Card><DataTable columns={columns} data={filtered} emptyMessage="Aucune tâche trouvée" /></Card>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanStatuses.map((status) => (
              <div key={status} className="space-y-3 min-w-[240px] flex-shrink-0">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-slate-700">{statusLabels[status]}</h3>
                  <Badge variant={statusColors[status]}>{filtered.filter((t) => t.status === status).length}</Badge>
                </div>
                <div className="space-y-2">
                  {filtered.filter((t) => t.status === status).map((task) => (
                    <Card key={task.id} className="p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openEdit(task)}>
                      <p className="text-sm font-medium text-foreground mb-1">{task.title}</p>
                      {task.projects?.name && <p className="text-xs text-muted mb-2">{task.projects.name}</p>}
                      <div className="flex items-center justify-between">
                        <Badge variant={priorityColors[task.priority]}><Flag className="w-3 h-3 mr-1" />{task.priority}</Badge>
                        {task.due_date && <span className="flex items-center gap-1 text-xs text-muted"><Calendar className="w-3 h-3" />{formatShortDate(task.due_date)}</span>}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Modifier la tâche" : "Nouvelle tâche"} size="md">
        <div className="space-y-4">
          <Input id="title" name="title" label="Titre" placeholder="Titre de la tâche" value={form.title} onChange={handleChange} required />
          <Select id="project_id" name="project_id" label="Projet" value={form.project_id} onChange={handleChange}
            options={[{ value: "", label: "— Aucun projet —" }, ...projects.map((p) => ({ value: p.id, label: p.name }))]} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select id="status" name="status" label="Statut" options={statusOptions} value={form.status} onChange={handleChange} />
            <Select id="priority" name="priority" label="Priorité" options={priorityOptions} value={form.priority} onChange={handleChange} />
          </div>
          <Input id="due_date" name="due_date" label="Échéance" type="date" value={form.due_date} onChange={handleChange} />
          <Textarea id="description" name="description" label="Description" placeholder="Détails de la tâche..." value={form.description} onChange={handleChange} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.title}>{saving ? "Enregistrement..." : editing ? "Modifier" : "Créer"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDelete}
        title="Supprimer cette tâche ?" message={`Supprimer "${deleteConfirm?.title}" ?`} confirmLabel="Supprimer" />
    </div>
  );
}
