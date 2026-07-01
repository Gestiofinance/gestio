"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/layout/header";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useCrud } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import { formatShortDate } from "@/lib/utils";
import {
  CheckSquare, Plus, Search, Calendar, MoreVertical,
  Pencil, Trash2, Folder, CheckCircle2,
} from "lucide-react";

// ─── Labels ───────────────────────────────────────────────────────────────────

const statusOptions = [
  { value: "a_faire",    label: "À faire" },
  { value: "en_cours",   label: "En cours" },
  { value: "en_revision",label: "En révision" },
  { value: "termine",    label: "Terminé" },
];

const priorityOptions = [
  { value: "basse",   label: "Basse" },
  { value: "moyenne", label: "Moyenne" },
  { value: "haute",   label: "Haute" },
  { value: "urgente", label: "Urgente" },
];

const STATUS_LABEL  = { a_faire: "À faire", en_cours: "En cours", en_revision: "En révision", termine: "Terminée" };
const STATUS_BADGE  = { a_faire: "bg-blue-100 text-blue-700", en_cours: "bg-amber-100 text-amber-800", en_revision: "bg-orange-100 text-orange-700", termine: "bg-emerald-100 text-emerald-700" };
const PRIORITY_BADGE = { basse: "bg-slate-100 text-slate-500", moyenne: "bg-blue-100 text-blue-700", haute: "bg-orange-100 text-orange-700", urgente: "bg-red-100 text-red-700" };

// ─── Sticky note colors ────────────────────────────────────────────────────────

const PALETTE = {
  yellow: { bg: "#FFFBEB", pin: "#F59E0B" },
  blue:   { bg: "#EFF6FF", pin: "#3B82F6" },
  green:  { bg: "#F0FDF4", pin: "#22C55E" },
  pink:   { bg: "#FFF1F2", pin: "#F43F5E" },
  purple: { bg: "#F5F3FF", pin: "#8B5CF6" },
  orange: { bg: "#FFF7ED", pin: "#F97316" },
  cyan:   { bg: "#ECFEFF", pin: "#06B6D4" },
  gray:   { bg: "#F8FAFC", pin: "#94A3B8" },
};

const CYCLE = ["blue", "purple", "orange", "cyan", "gray"];

function cardColor(task) {
  if (task.status === "termine")    return "green";
  if (task.priority === "urgente")  return "pink";
  if (task.status === "en_cours")   return "yellow";
  // deterministic variety for à_faire / en_revision
  const seed = (task.id || task.title || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return CYCLE[seed % CYCLE.length];
}

// ─── Avatar helpers ────────────────────────────────────────────────────────────

const AVATAR_BG = ["bg-violet-500","bg-blue-500","bg-emerald-500","bg-rose-500","bg-amber-500","bg-cyan-500","bg-indigo-500","bg-orange-500"];
function initials(name = "") { return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0,2) || "?"; }
function avatarBg(name = "") { return AVATAR_BG[name.split("").reduce((a,c) => a+c.charCodeAt(0),0) % AVATAR_BG.length]; }

// ─── StickyCard component ──────────────────────────────────────────────────────

function StickyCard({ task, userName, onEdit, onDelete, onToggle }) {
  const p = PALETTE[cardColor(task)];
  const [menu, setMenu] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!menu) return;
    function close(e) { if (ref.current && !ref.current.contains(e.target)) setMenu(false); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menu]);

  return (
    <div className="relative pt-3">
      {/* Épingle colorée */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full z-10 shadow-md border-2 border-white"
        style={{ backgroundColor: p.pin }}
      />

      {/* Note */}
      <div
        className="relative rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group overflow-hidden min-h-[180px] flex flex-col"
        style={{ backgroundColor: p.bg }}
        onClick={() => onEdit(task)}
      >
        {/* Menu 3 points */}
        <div ref={ref} className="absolute top-2.5 right-2.5" onClick={e => e.stopPropagation()}>
          <button
            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-black/10 transition-all"
            onClick={() => setMenu(v => !v)}
          >
            <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
          </button>
          {menu && (
            <div className="absolute right-0 top-7 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-36 z-50">
              <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                onClick={() => { onEdit(task); setMenu(false); }}>
                <Pencil className="w-3.5 h-3.5" /> Modifier
              </button>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                onClick={() => { onToggle(task); setMenu(false); }}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {task.status === "termine" ? "Rouvrir" : "Terminer"}
              </button>
              <button className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50"
                onClick={() => { onDelete(task); setMenu(false); }}>
                <Trash2 className="w-3.5 h-3.5" /> Supprimer
              </button>
            </div>
          )}
        </div>

        {/* Titre */}
        <h3 className="font-bold text-slate-800 text-sm pr-5 leading-snug mt-0.5">
          {task.title}
        </h3>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex-1" />

        {/* Projet */}
        {task.projects?.name && (
          <div className="flex items-center gap-1.5 mt-3">
            <Folder className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 font-medium truncate">{task.projects.name}</span>
          </div>
        )}

        {/* Échéance */}
        {task.due_date && (
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500">{formatShortDate(task.due_date)}</span>
          </div>
        )}

        {/* Pied : badge statut / priorité + avatar */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Priorité urgente en premier */}
            {task.priority === "urgente" && (
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${PRIORITY_BADGE.urgente}`}>
                Urgente
              </span>
            )}
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${STATUS_BADGE[task.status]}`}>
              {STATUS_LABEL[task.status]}
            </span>
          </div>
          {/* Avatar */}
          <div className={`w-7 h-7 rounded-full text-white text-xs flex items-center justify-center font-bold border-2 border-white shadow-sm ${avatarBg(userName)}`}>
            {initials(userName)}
          </div>
        </div>

        {/* Coin plié bas-droite */}
        <div
          className="absolute bottom-0 right-0 w-7 h-7"
          style={{ background: "linear-gradient(225deg, rgba(0,0,0,0.10) 50%, transparent 50%)" }}
        />
      </div>
    </div>
  );
}

// ─── Kanban column ─────────────────────────────────────────────────────────────

const KANBAN_COL = {
  a_faire:    { header: "bg-blue-50 text-blue-700 border-blue-100", dot: "bg-blue-400" },
  en_cours:   { header: "bg-amber-50 text-amber-700 border-amber-100", dot: "bg-amber-400" },
  en_revision:{ header: "bg-orange-50 text-orange-700 border-orange-100", dot: "bg-orange-400" },
  termine:    { header: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-400" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const emptyForm = { title: "", description: "", project_id: "", status: "a_faire", priority: "moyenne", due_date: "" };

export default function TachesPage() {
  const { data: tasks, loading, fetchAll, create, update, remove } = useCrud("tasks");
  const { data: projects, fetchAll: fetchProjects } = useCrud("projects");
  const { profile } = useAuth();

  const [view, setView] = useState("liste");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAll({ select: "*, projects(name)" });
    fetchProjects();
  }, [fetchAll, fetchProjects]);

  const filtered = tasks.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterPriority && t.priority !== filterPriority) return false;
    return (t.title || "").toLowerCase().includes(search.toLowerCase());
  });

  function openCreate() { setForm(emptyForm); setEditing(null); setShowForm(true); }
  function openEdit(t) {
    setForm({ title: t.title, description: t.description || "", project_id: t.project_id || "", status: t.status, priority: t.priority, due_date: t.due_date || "" });
    setEditing(t); setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form, project_id: form.project_id || null };
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
    await update(task.id, { status: task.status === "termine" ? "a_faire" : "termine" });
    await fetchAll({ select: "*, projects(name)" });
  }

  const userName = profile?.full_name || "Utilisateur";

  return (
    <div>
      <Header title="Tâches" />

      <div className="p-4 sm:p-6 space-y-5">

        {/* Barre supérieure */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

          {/* Onglets Liste / Kanban */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            {[
              { v: "liste",  label: "Liste",  count: tasks.length },
              { v: "kanban", label: "Kanban" },
            ].map(tab => (
              <button
                key={tab.v}
                onClick={() => setView(tab.v)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  view === tab.v ? "bg-slate-100 text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className="text-xs bg-slate-200 text-slate-600 rounded-full px-1.5 py-0.5 font-semibold min-w-[20px] text-center leading-none">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Filtres + bouton */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white shadow-sm w-44">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="bg-transparent text-sm w-full border-none outline-none text-slate-700 placeholder:text-slate-400"
              />
            </div>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 shadow-sm outline-none cursor-pointer"
            >
              <option value="">Tous les statuts</option>
              <option value="a_faire">À faire</option>
              <option value="en_cours">En cours</option>
              <option value="en_revision">En révision</option>
              <option value="termine">Terminé</option>
            </select>
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 shadow-sm outline-none cursor-pointer"
            >
              <option value="">Toutes priorités</option>
              <option value="basse">Basse</option>
              <option value="moyenne">Moyenne</option>
              <option value="haute">Haute</option>
              <option value="urgente">Urgente</option>
            </select>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nouvelle tâche
            </button>
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="text-center py-16 text-muted text-sm">Chargement...</div>
        ) : tasks.length === 0 ? (
          <EmptyState
            icon={CheckSquare}
            title="Aucune tâche"
            description="Organisez votre travail avec des tâches et suivez l'avancement."
            actionLabel="Créer une tâche"
            onAction={openCreate}
          />
        ) : view === "liste" ? (

          /* ── Vue post-it ── */
          filtered.length === 0 ? (
            <p className="text-center text-muted text-sm py-12">Aucune tâche correspondante.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
              {filtered.map(task => (
                <StickyCard
                  key={task.id}
                  task={task}
                  userName={userName}
                  onEdit={openEdit}
                  onDelete={setDeleteConfirm}
                  onToggle={toggleComplete}
                />
              ))}
            </div>
          )

        ) : (

          /* ── Vue Kanban ── */
          <div className="flex gap-4 overflow-x-auto pb-6">
            {(["a_faire","en_cours","en_revision","termine"]).map(status => {
              const col = KANBAN_COL[status];
              const colTasks = filtered.filter(t => t.status === status);
              return (
                <div key={status} className="min-w-[260px] flex-shrink-0 space-y-3">
                  <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${col.header}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <span className="text-sm font-semibold">{STATUS_LABEL[status]}</span>
                    </div>
                    <span className="text-xs font-bold bg-white/60 px-1.5 py-0.5 rounded-full">{colTasks.length}</span>
                  </div>
                  <div className="space-y-3">
                    {colTasks.map(task => (
                      <StickyCard
                        key={task.id}
                        task={task}
                        userName={userName}
                        onEdit={openEdit}
                        onDelete={setDeleteConfirm}
                        onToggle={toggleComplete}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal création / édition */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Modifier la tâche" : "Nouvelle tâche"} size="md">
        <div className="space-y-4">
          <Input id="title" name="title" label="Titre" placeholder="Titre de la tâche" value={form.title} onChange={e => setForm({...form, [e.target.name]: e.target.value})} required />
          <Select id="project_id" name="project_id" label="Projet" value={form.project_id}
            onChange={e => setForm({...form, [e.target.name]: e.target.value})}
            options={[{ value: "", label: "— Aucun projet —" }, ...projects.map(p => ({ value: p.id, label: p.name }))]} />
          <div className="grid grid-cols-2 gap-4">
            <Select id="status" name="status" label="Statut" options={statusOptions} value={form.status} onChange={e => setForm({...form, [e.target.name]: e.target.value})} />
            <Select id="priority" name="priority" label="Priorité" options={priorityOptions} value={form.priority} onChange={e => setForm({...form, [e.target.name]: e.target.value})} />
          </div>
          <Input id="due_date" name="due_date" label="Échéance" type="date" value={form.due_date} onChange={e => setForm({...form, [e.target.name]: e.target.value})} />
          <Textarea id="description" name="description" label="Description" placeholder="Détails de la tâche..." value={form.description} onChange={e => setForm({...form, [e.target.name]: e.target.value})} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.title}>
              {saving ? "Enregistrement..." : editing ? "Modifier" : "Créer"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Supprimer cette tâche ?"
        message={`Supprimer "${deleteConfirm?.title}" ?`}
        confirmLabel="Supprimer"
      />
    </div>
  );
}
