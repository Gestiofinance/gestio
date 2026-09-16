"use client";

import { useState, useEffect } from "react";
import { formatShortDate } from "@/lib/utils";
import {
  Send, X, MessageCircle, Bug, Receipt, Sparkles, UserCog, HelpCircle,
} from "lucide-react";

const CATEGORY_INFO = {
  bug: { label: "Bug technique", icon: Bug },
  facturation: { label: "Facturation / Paiement", icon: Receipt },
  fonctionnalite: { label: "Demande de fonctionnalité", icon: Sparkles },
  compte: { label: "Compte / Accès", icon: UserCog },
  autre: { label: "Autre", icon: HelpCircle },
};

const statusColors = {
  open: "text-warning-400 bg-warning-400/10 border-warning-400/20",
  answered: "text-success-400 bg-success-400/10 border-success-400/20",
  closed: "text-slate-400 bg-slate-700 border-slate-600",
};
const statusLabels = { open: "En attente", answered: "Répondu", closed: "Résolu" };

const severityColors = {
  faible: "text-slate-400 bg-slate-700 border-slate-600",
  moyenne: "text-primary-400 bg-primary-400/10 border-primary-400/20",
  elevee: "text-warning-400 bg-warning-400/10 border-warning-400/20",
  urgente: "text-danger-400 bg-danger-400/10 border-danger-400/20",
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { loadTickets(); }, []);

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

  async function openTicket(ticket) {
    setSelected(ticket);
    setMessages([]);
    const res = await fetch(`/api/support/tickets/${ticket.id}`);
    const json = await res.json();
    if (res.ok) setMessages(json.messages || []);
  }

  async function handleReply() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/support/tickets/${selected.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply }),
      });
      const json = await res.json();
      if (res.ok) {
        setMessages((m) => [...m, json.message]);
        setReply("");
        loadTickets();
        setSelected((s) => (s ? { ...s, status: "answered" } : s));
      }
    } catch {}
    setSending(false);
  }

  const filtered = filterStatus ? tickets.filter((t) => t.status === filterStatus) : tickets;

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    urgente: tickets.filter((t) => t.severity === "urgente" && t.status !== "closed").length,
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Support</h1>
        <p className="text-slate-400 text-sm mt-1">Demandes envoyées par les administrateurs d&apos;organisation</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "En attente", value: stats.open, color: "text-warning-400" },
          { label: "Urgentes", value: stats.urgente, color: "text-danger-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300"
        >
          <option value="">Tous les statuts</option>
          <option value="open">En attente</option>
          <option value="answered">Répondu</option>
          <option value="closed">Résolu</option>
        </select>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Organisation</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Sujet</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Catégorie</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Urgence</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Statut</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Mis à jour</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm">Aucun ticket</td></tr>
              ) : filtered.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => openTicket(t)}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-3 text-sm text-white">{t.organizations?.name || "—"}</td>
                  <td className="px-6 py-3 text-sm text-slate-300 max-w-[220px] truncate">{t.subject}</td>
                  <td className="px-6 py-3 text-sm text-slate-400">{CATEGORY_INFO[t.category]?.label || t.category}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${severityColors[t.severity]}`}>
                      {t.severity}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[t.status]}`}>
                      {statusLabels[t.status]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-500">{formatShortDate(t.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Thread panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSelected(null)} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg mx-4 p-6 flex flex-col max-h-[85vh]">
            <div className="flex items-start justify-between mb-3 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-white">{selected.subject}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{selected.organizations?.name}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-4 shrink-0">
              <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[selected.status]}`}>
                {statusLabels[selected.status]}
              </span>
              <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${severityColors[selected.severity]}`}>
                {selected.severity}
              </span>
              <span className="text-xs text-slate-500">{CATEGORY_INFO[selected.category]?.label}</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {messages.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-6">
                  <MessageCircle className="w-5 h-5 mx-auto mb-2 opacity-40" />
                  Aucun message.
                </p>
              ) : (
                messages.map((m) => (
                  <div key={m.id} className={`flex ${m.is_from_admin ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      m.is_from_admin ? "bg-primary-500 text-white" : "bg-slate-700 text-slate-200"
                    }`}>
                      <p className="whitespace-pre-wrap">{m.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-end gap-2 pt-3 mt-3 border-t border-slate-700 shrink-0">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                placeholder="Répondre..."
                className="flex-1 px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm outline-none focus:border-primary-500 resize-none"
              />
              <button
                onClick={handleReply}
                disabled={sending || !reply.trim()}
                className="p-2.5 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
