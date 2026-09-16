"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus, ArrowLeft, Send, MessageCircle, Bug, Receipt, Sparkles, UserCog, HelpCircle,
} from "lucide-react";

export const CATEGORIES = [
  { value: "bug", label: "Bug technique", icon: Bug },
  { value: "facturation", label: "Facturation / Paiement", icon: Receipt },
  { value: "fonctionnalite", label: "Demande de fonctionnalité", icon: Sparkles },
  { value: "compte", label: "Compte / Accès", icon: UserCog },
  { value: "autre", label: "Autre", icon: HelpCircle },
];

export const SEVERITIES = [
  { value: "faible", label: "Faible — peut attendre", color: "default" },
  { value: "moyenne", label: "Moyenne — gêne le travail", color: "primary" },
  { value: "elevee", label: "Élevée — bloque une fonctionnalité", color: "warning" },
  { value: "urgente", label: "Urgente — bloque tout le compte", color: "danger" },
];

const statusLabels = { open: "En attente", answered: "Répondu", closed: "Résolu" };
const statusColors = { open: "warning", answered: "success", closed: "default" };

function categoryLabel(value) {
  return CATEGORIES.find((c) => c.value === value)?.label || value;
}
function severityInfo(value) {
  return SEVERITIES.find((s) => s.value === value) || SEVERITIES[1];
}

export function SupportModal({ open, onClose, onUnreadChange }) {
  const [view, setView] = useState("list"); // list | new | thread
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [form, setForm] = useState({ category: "bug", severity: "moyenne", subject: "", message: "" });
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setView("list");
      setError("");
      loadTickets();
    }
  }, [open]);

  async function loadTickets() {
    setLoading(true);
    try {
      const res = await fetch("/api/support/tickets");
      const json = await res.json();
      setTickets(json.tickets || []);
    } catch {
      setTickets([]);
    }
    setLoading(false);
  }

  async function openThread(ticket) {
    setSelectedTicket(ticket);
    setView("thread");
    setMessages([]);
    const res = await fetch(`/api/support/tickets/${ticket.id}`);
    const json = await res.json();
    if (res.ok) {
      setSelectedTicket(json.ticket);
      setMessages(json.messages || []);
      onUnreadChange?.();
    }
  }

  async function handleCreate() {
    if (!form.subject.trim() || !form.message.trim()) {
      setError("Le sujet et le message sont requis.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error || "Une erreur est survenue."); setSaving(false); return; }
      setForm({ category: "bug", severity: "moyenne", subject: "", message: "" });
      await loadTickets();
      openThread(json.ticket);
    } catch {
      setError("Une erreur est survenue.");
    }
    setSaving(false);
  }

  async function handleReply() {
    if (!reply.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessages((m) => [...m, json.message]);
        setReply("");
      }
    } catch {}
    setSaving(false);
  }

  const title = view === "new" ? "Nouvelle demande" : view === "thread" ? selectedTicket?.subject : "Support";

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      {view === "list" && (
        <div className="space-y-4">
          <Button onClick={() => setView("new")} className="w-full">
            <Plus className="w-4 h-4" /> Nouvelle demande
          </Button>

          {loading ? (
            <p className="text-sm text-muted text-center py-6">Chargement...</p>
          ) : tickets.length === 0 ? (
            <p className="text-sm text-muted text-center py-6">Aucune demande envoyée pour l&apos;instant.</p>
          ) : (
            <div className="space-y-2">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openThread(t)}
                  className="w-full flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 text-left transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{t.subject}</p>
                      {t.org_has_unread && <span className="w-2 h-2 rounded-full bg-danger-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted mt-0.5">{categoryLabel(t.category)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={statusColors[t.status]}>{statusLabels[t.status]}</Badge>
                    <Badge variant={severityInfo(t.severity).color}>{t.severity}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "new" && (
        <div className="space-y-4">
          <button onClick={() => setView("list")} className="flex items-center gap-1 text-xs text-muted hover:text-foreground">
            <ArrowLeft className="w-3.5 h-3.5" /> Retour
          </button>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Quel est le problème ?</label>
            <div className="grid grid-cols-1 gap-2">
              {CATEGORIES.map((c) => (
                <label
                  key={c.value}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                    form.category === c.value ? "border-primary-400 bg-primary-50 text-primary-700" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    className="sr-only"
                    checked={form.category === c.value}
                    onChange={() => setForm((f) => ({ ...f, category: c.value }))}
                  />
                  <c.icon className="w-4 h-4 shrink-0" />
                  {c.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Niveau d&apos;urgence</label>
            <select
              value={form.severity}
              onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:border-primary-400"
            >
              {SEVERITIES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <Input
            id="support_subject"
            label="Sujet"
            placeholder="Résumez votre demande en une phrase"
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            required
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Décrivez le problème</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
              rows={4}
              placeholder="Expliquez ce qui se passe, ce que vous attendiez, et les étapes pour reproduire si possible."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:border-primary-400 resize-none"
            />
          </div>

          {error && <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>}

          <Button onClick={handleCreate} disabled={saving} className="w-full">
            {saving ? "Envoi..." : "Envoyer la demande"}
          </Button>
        </div>
      )}

      {view === "thread" && selectedTicket && (
        <div className="flex flex-col h-[60vh]">
          <button onClick={() => setView("list")} className="flex items-center gap-1 text-xs text-muted hover:text-foreground mb-3 shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" /> Retour
          </button>

          <div className="flex items-center gap-2 mb-3 shrink-0">
            <Badge variant={statusColors[selectedTicket.status]}>{statusLabels[selectedTicket.status]}</Badge>
            <Badge variant={severityInfo(selectedTicket.severity).color}>{selectedTicket.severity}</Badge>
            <span className="text-xs text-muted">{categoryLabel(selectedTicket.category)}</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {messages.length === 0 ? (
              <p className="text-sm text-muted text-center py-6">
                <MessageCircle className="w-5 h-5 mx-auto mb-2 opacity-40" />
                Aucun message.
              </p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.is_from_admin ? "justify-start" : "justify-end"}`}>
                  <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    m.is_from_admin ? "bg-slate-100 text-slate-700" : "bg-primary-500 text-white"
                  }`}>
                    {!m.is_from_admin ? null : <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60 mb-0.5">Support Gestio</p>}
                    <p className="whitespace-pre-wrap">{m.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex items-end gap-2 pt-3 mt-3 border-t border-slate-100 shrink-0">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={2}
              placeholder="Répondre..."
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-700 outline-none focus:border-primary-400 resize-none"
            />
            <Button onClick={handleReply} disabled={saving || !reply.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
