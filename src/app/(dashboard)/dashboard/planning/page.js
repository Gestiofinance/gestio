"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSupabase, getOrgId } from "@/hooks/useSupabase";
import { formatCurrency } from "@/lib/utils";
import {
  ChevronLeft, ChevronRight, Calendar, CheckSquare, Receipt, FolderKanban,
  Plus, Clock, Flag, X,
} from "lucide-react";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

const priorityOptions = [
  { value: "basse", label: "Basse" },
  { value: "moyenne", label: "Moyenne" },
  { value: "haute", label: "Haute" },
  { value: "urgente", label: "Urgente" },
];
const priorityColors = { basse: "default", moyenne: "primary", haute: "warning", urgente: "danger" };
const statusLabels = { a_faire: "À faire", en_cours: "En cours", en_revision: "En révision", termine: "Terminé" };
const statusColors = { a_faire: "default", en_cours: "primary", en_revision: "warning", termine: "success" };
const invoiceStatusLabels = { brouillon: "Brouillon", envoyee: "Envoyée", partiellement_payee: "Partiel", payee: "Payée", en_retard: "En retard", annulee: "Annulée" };
const invoiceStatusColors = { brouillon: "default", envoyee: "primary", partiellement_payee: "warning", payee: "success", en_retard: "danger", annulee: "default" };
const projectStatusLabels = { a_demarrer: "À démarrer", en_cours: "En cours", en_pause: "En pause", termine: "Terminé", annule: "Annulé" };
const projectStatusColors = { a_demarrer: "default", en_cours: "primary", en_pause: "warning", termine: "success", annule: "danger" };

export default function PlanningPage() {
  const supabase = useSupabase();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projectsList, setProjectsList] = useState([]);

  const [form, setForm] = useState({
    title: "", description: "", priority: "moyenne", due_date: "", project_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [{ data: t }, { data: i }, { data: p }, { data: allProjects }] = await Promise.all([
      supabase.from("tasks").select("id, title, due_date, priority, status, description, projects(name)").not("due_date", "is", null),
      supabase.from("invoices").select("id, invoice_number, due_date, status, total, clients(company_name, contact_name)").not("due_date", "is", null),
      supabase.from("projects").select("id, name, due_date, status, budget, clients(company_name, contact_name)").not("due_date", "is", null),
      supabase.from("projects").select("id, name"),
    ]);
    setTasks(t || []);
    setInvoices(i || []);
    setProjects(p || []);
    setProjectsList(allProjects || []);
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    let startDay = firstDay.getDay() - 1;
    if (startDay < 0) startDay = 6;

    const days = [];
    for (let i = startDay - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({ date: d, isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  }, [year, month]);

  function getEventsForDate(date) {
    const dateStr = date.toISOString().split("T")[0];
    const events = [];
    tasks.filter((t) => t.due_date === dateStr).forEach((t) => {
      events.push({
        type: "task", label: t.title, icon: CheckSquare,
        color: t.status === "termine" ? "text-success-500" : "text-primary-500",
        data: t,
      });
    });
    invoices.filter((i) => i.due_date === dateStr).forEach((i) => {
      events.push({
        type: "invoice", label: i.invoice_number, icon: Receipt,
        color: i.status === "en_retard" ? "text-danger-500" : "text-warning-500",
        data: i,
      });
    });
    projects.filter((p) => p.due_date === dateStr).forEach((p) => {
      events.push({
        type: "project", label: p.name, icon: FolderKanban,
        color: "text-violet-500",
        data: p,
      });
    });
    return events;
  }

  function handleDateClick(date, events) {
    if (events.length > 0) {
      setSelectedDate(date);
      setSelectedEvents(events);
    }
  }

  function openCreateForDate(date) {
    const dateStr = date ? date.toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
    setForm({ title: "", description: "", priority: "moyenne", due_date: dateStr, project_id: "" });
    setShowCreate(true);
    setSelectedDate(null);
    setSelectedEvents([]);
  }

  async function handleCreateTask() {
    setSaving(true);
    try {
      const orgId = await getOrgId(supabase);
      await supabase.from("tasks").insert({
        organization_id: orgId,
        title: form.title,
        description: form.description || null,
        priority: form.priority,
        due_date: form.due_date,
        project_id: form.project_id || null,
        status: "a_faire",
      });
      await loadData();
      setShowCreate(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); }
  function goToday() { setCurrentDate(new Date()); }

  const today = new Date();
  const isToday = (d) => d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();

  const formatDateLabel = (d) => new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const upcomingEvents = [];
  const next7 = new Date(Date.now() + 7 * 86400000);
  tasks.filter((t) => t.status !== "termine" && new Date(t.due_date) <= next7 && new Date(t.due_date) >= today).forEach((t) => {
    upcomingEvents.push({ date: t.due_date, label: t.title, type: "Tâche", icon: CheckSquare, color: "text-primary-500" });
  });
  invoices.filter((i) => !["payee", "annulee"].includes(i.status) && new Date(i.due_date) <= next7 && new Date(i.due_date) >= today).forEach((i) => {
    upcomingEvents.push({ date: i.due_date, label: i.invoice_number, type: "Facture", icon: Receipt, color: "text-warning-500" });
  });
  projects.filter((p) => !["termine", "annule"].includes(p.status) && new Date(p.due_date) <= next7 && new Date(p.due_date) >= today).forEach((p) => {
    upcomingEvents.push({ date: p.due_date, label: p.name, type: "Projet", icon: FolderKanban, color: "text-violet-500" });
  });
  upcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div>
      <Header title="Planning" />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-muted">Visualisez vos tâches, échéances et projets sur le calendrier.</p>
          <Button onClick={() => openCreateForDate(null)} className="w-full sm:w-auto flex-shrink-0">
            <Plus className="w-4 h-4" /> Ajouter au planning
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card>
              <div className="px-3 py-3 sm:p-4 flex items-center justify-between gap-2 border-b border-slate-100">
                <div className="flex items-center gap-1 sm:gap-3">
                  <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" /></button>
                  <h2 className="text-sm sm:text-lg font-semibold text-foreground min-w-[110px] sm:min-w-[200px] text-center">
                    {MONTHS[month]} {year}
                  </h2>
                  <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100"><ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" /></button>
                </div>
                <Button variant="secondary" size="sm" onClick={goToday} className="text-xs sm:text-sm px-2 sm:px-3 flex-shrink-0">Aujourd&apos;hui</Button>
              </div>
              <div className="p-1 sm:p-4">
                <div className="grid grid-cols-7 mb-1">
                  {DAYS.map((d) => (
                    <div key={d} className="text-center text-[10px] sm:text-xs font-medium text-muted py-1.5">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {calendarDays.map(({ date, isCurrentMonth }, i) => {
                    const events = getEventsForDate(date);
                    const hasEvents = events.length > 0;

                    let cellBg = "";
                    let cellBorder = "border-slate-50";
                    let textColor = "text-slate-600";
                    if (hasEvents && isCurrentMonth) {
                      const dominant = events[0].type;
                      if (dominant === "task") {
                        const done = events.every((e) => e.type === "task" && e.data.status === "termine");
                        if (done) {
                          cellBg = "bg-success-50"; cellBorder = "border-success-500/30"; textColor = "text-success-600";
                        } else {
                          cellBg = "bg-primary-50"; cellBorder = "border-primary-500/30"; textColor = "text-primary-700";
                        }
                      } else if (dominant === "invoice") {
                        const hasLate = events.some((e) => e.type === "invoice" && e.data.status === "en_retard");
                        if (hasLate) {
                          cellBg = "bg-danger-50"; cellBorder = "border-danger-500/30"; textColor = "text-danger-600";
                        } else {
                          cellBg = "bg-warning-50"; cellBorder = "border-warning-500/30"; textColor = "text-warning-600";
                        }
                      } else if (dominant === "project") {
                        cellBg = "bg-violet-500/10"; cellBorder = "border-violet-500/30"; textColor = "text-violet-600";
                      }
                    }

                    return (
                      <div
                        key={i}
                        onClick={() => hasEvents ? handleDateClick(date, events) : openCreateForDate(date)}
                        className={`min-h-[52px] sm:min-h-[90px] border p-0.5 sm:p-1 cursor-pointer transition-all rounded-md sm:rounded-lg m-0.5 ${cellBorder} ${
                          !isCurrentMonth ? "bg-slate-50/50" : hasEvents ? `${cellBg} hover:shadow-md` : "hover:bg-slate-50"
                        }`}
                      >
                        <div className={`text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full ${
                          isToday(date) ? "gradient-bg text-white" : isCurrentMonth ? "text-foreground" : "text-slate-300"
                        }`}>
                          {date.getDate()}
                        </div>
                        {/* Mobile: colored dot only; Desktop: text labels */}
                        {hasEvents && (
                          <div className="sm:hidden flex flex-col gap-0.5">
                            {events.slice(0, 2).map((ev, j) => (
                              <ev.icon key={j} className={`w-2.5 h-2.5 ${ev.color}`} />
                            ))}
                            {events.length > 2 && <span className={`text-[8px] leading-none ${textColor}`}>+{events.length - 2}</span>}
                          </div>
                        )}
                        <div className="hidden sm:block space-y-0.5">
                          {events.slice(0, 3).map((ev, j) => (
                            <div key={j} className={`flex items-center gap-1 text-[10px] truncate ${textColor}`}>
                              <ev.icon className={`w-3 h-3 shrink-0 ${ev.color}`} />
                              <span className="truncate">{ev.label}</span>
                            </div>
                          ))}
                          {events.length > 3 && (
                            <span className={`text-[10px] ${textColor} opacity-70`}>+{events.length - 3} autres</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card>
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-foreground">Prochaines échéances</h3>
                <p className="text-xs text-muted">7 prochains jours</p>
              </div>
              <div className="p-4 space-y-3">
                {upcomingEvents.length === 0 ? (
                  <p className="text-sm text-muted text-center py-4">Aucune échéance proche</p>
                ) : (
                  upcomingEvents.map((ev, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50">
                      <ev.icon className={`w-4 h-4 mt-0.5 ${ev.color}`} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{ev.label}</p>
                        <p className="text-xs text-muted">{ev.type} — {new Date(ev.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-primary-500" />
                <h3 className="text-sm font-semibold">Légende</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2"><CheckSquare className="w-3 h-3 text-primary-500" /> Tâches</div>
                <div className="flex items-center gap-2"><Receipt className="w-3 h-3 text-warning-500" /> Échéances factures</div>
                <div className="flex items-center gap-2"><FolderKanban className="w-3 h-3 text-violet-500" /> Échéances projets</div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Date detail modal */}
      <Modal
        open={!!selectedDate}
        onClose={() => { setSelectedDate(null); setSelectedEvents([]); }}
        title={selectedDate ? formatDateLabel(selectedDate) : ""}
        size="md"
      >
        <div className="space-y-3">
          {selectedEvents.map((ev, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  ev.type === "task" ? "bg-primary-50" : ev.type === "invoice" ? "bg-warning-50" : "bg-violet-500/10"
                }`}>
                  <ev.icon className={`w-5 h-5 ${ev.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-foreground">{ev.label}</p>
                    {ev.type === "task" && (
                      <Badge variant={statusColors[ev.data.status]}>{statusLabels[ev.data.status]}</Badge>
                    )}
                    {ev.type === "invoice" && (
                      <Badge variant={invoiceStatusColors[ev.data.status]}>{invoiceStatusLabels[ev.data.status]}</Badge>
                    )}
                    {ev.type === "project" && (
                      <Badge variant={projectStatusColors[ev.data.status]}>{projectStatusLabels[ev.data.status]}</Badge>
                    )}
                  </div>

                  <p className="text-xs text-muted mt-0.5">
                    {ev.type === "task" && "Tâche"}
                    {ev.type === "invoice" && "Échéance facture"}
                    {ev.type === "project" && "Échéance projet"}
                  </p>

                  {/* Task details */}
                  {ev.type === "task" && (
                    <div className="mt-2 space-y-1">
                      {ev.data.projects?.name && (
                        <p className="text-xs text-slate-600 flex items-center gap-1.5">
                          <FolderKanban className="w-3 h-3 text-muted" /> {ev.data.projects.name}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Flag className="w-3 h-3 text-muted" />
                        <Badge variant={priorityColors[ev.data.priority]}>{ev.data.priority}</Badge>
                      </div>
                      {ev.data.description && (
                        <p className="text-xs text-slate-500 mt-1">{ev.data.description}</p>
                      )}
                    </div>
                  )}

                  {/* Invoice details */}
                  {ev.type === "invoice" && (
                    <div className="mt-2 space-y-1">
                      {(ev.data.clients?.company_name || ev.data.clients?.contact_name) && (
                        <p className="text-xs text-slate-600">
                          Client : {ev.data.clients.company_name || ev.data.clients.contact_name}
                        </p>
                      )}
                      <p className="text-sm font-semibold text-foreground">
                        {formatCurrency(ev.data.total)}
                      </p>
                    </div>
                  )}

                  {/* Project details */}
                  {ev.type === "project" && (
                    <div className="mt-2 space-y-1">
                      {(ev.data.clients?.company_name || ev.data.clients?.contact_name) && (
                        <p className="text-xs text-slate-600">
                          Client : {ev.data.clients.company_name || ev.data.clients.contact_name}
                        </p>
                      )}
                      {ev.data.budget > 0 && (
                        <p className="text-xs text-slate-600">
                          Budget : {formatCurrency(ev.data.budget)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <Button variant="secondary" size="sm" className="w-full" onClick={() => openCreateForDate(selectedDate)}>
              <Plus className="w-4 h-4" /> Ajouter une tâche ce jour
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create task modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Ajouter au planning" size="md">
        <div className="space-y-4">
          <Input
            id="title" label="Titre de la tâche" placeholder="Ex: Rendez-vous client, Livraison maquette..."
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="due_date" label="Date" type="date"
              value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
            <Select
              id="priority" label="Priorité" options={priorityOptions}
              value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
            />
          </div>
          <Select
            id="project_id" label="Projet (optionnel)"
            value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}
            options={[{ value: "", label: "— Aucun projet —" }, ...projectsList.map((p) => ({ value: p.id, label: p.name }))]}
          />
          <Textarea
            id="description" label="Description (optionnel)" placeholder="Détails..."
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Annuler</Button>
            <Button onClick={handleCreateTask} disabled={saving || !form.title || !form.due_date}>
              {saving ? "Enregistrement..." : "Ajouter au planning"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
