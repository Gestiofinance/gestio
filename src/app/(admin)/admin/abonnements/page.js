"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { getPlanLabel, getCycleLabel } from "@/lib/plans";
import { Search, CreditCard, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";

const statusColors = {
  trial: "text-warning-400 bg-warning-400/10 border-warning-400/20",
  active: "text-success-400 bg-success-400/10 border-success-400/20",
  past_due: "text-danger-400 bg-danger-400/10 border-danger-400/20",
  cancelled: "text-slate-400 bg-slate-700/50 border-slate-600",
  expired: "text-slate-400 bg-slate-700/50 border-slate-600",
  pending: "text-warning-400 bg-warning-400/10 border-warning-400/20",
  completed: "text-success-400 bg-success-400/10 border-success-400/20",
  failed: "text-danger-400 bg-danger-400/10 border-danger-400/20",
};
const statusLabels = {
  trial: "Essai", active: "Actif", past_due: "En retard",
  cancelled: "Annulé", expired: "Expiré", pending: "En attente",
  completed: "Payé", failed: "Échoué",
};

const planColors = {
  standard: "text-primary-400 bg-primary-400/10",
  pro: "text-violet-400 bg-violet-400/10",
  business: "text-success-400 bg-success-400/10",
};

export default function AdminAbonnementsPage() {
  const supabase = useSupabase();
  const [subscriptions, setSubscriptions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("subscriptions");
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [{ data: subs }, { data: pays }] = await Promise.all([
      supabase.from("subscriptions").select("*, organizations(name, email)").order("created_at", { ascending: false }),
      supabase.from("subscription_payments").select("*, organizations(name)").order("created_at", { ascending: false }),
    ]);
    setSubscriptions(subs || []);
    setPayments(pays || []);
    setLoading(false);
  }

  const planStats = {
    standard: subscriptions.filter((s) => s.plan_id === "standard" && s.status === "active").length,
    pro: subscriptions.filter((s) => s.plan_id === "pro" && s.status === "active").length,
    business: subscriptions.filter((s) => s.plan_id === "business" && s.status === "active").length,
  };

  const filteredSubs = subscriptions.filter((s) => {
    if (filterPlan && s.plan_id !== filterPlan) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    const q = search.toLowerCase();
    return (s.organizations?.name || "").toLowerCase().includes(q);
  });

  const filteredPayments = payments.filter((p) => {
    const q = search.toLowerCase();
    return (p.organizations?.name || "").toLowerCase().includes(q);
  });

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Abonnements</h1>
        <p className="text-slate-400 text-sm mt-1">Suivi des plans et paiements</p>
      </div>

      {/* Plan stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { id: "standard", label: "Standard", count: planStats.standard, price: "9 000 FCFA/mois" },
          { id: "pro", label: "Pro", count: planStats.pro, price: "14 500 FCFA/mois" },
          { id: "business", label: "Business", count: planStats.business, price: "25 000 FCFA/trim." },
        ].map((p) => (
          <div key={p.id} className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${planColors[p.id]}`}>{p.label}</span>
              <CreditCard className="w-4 h-4 text-slate-500" />
            </div>
            <p className="text-2xl font-bold text-white">{p.count}</p>
            <p className="text-xs text-slate-500 mt-1">abonnement{p.count > 1 ? "s" : ""} actif{p.count > 1 ? "s" : ""}</p>
            <p className="text-xs text-slate-400 mt-0.5">{p.price}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-800 rounded-xl w-fit border border-slate-700">
        {[
          { id: "subscriptions", label: `Abonnements (${subscriptions.length})` },
          { id: "payments", label: `Paiements (${payments.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${tab === t.id ? "bg-primary-500 text-white" : "text-slate-400 hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="bg-transparent text-white placeholder-slate-500 outline-none w-40" />
        </div>
        {tab === "subscriptions" && (
          <>
            <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300">
              <option value="">Tous les plans</option>
              <option value="standard">Standard</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300">
              <option value="">Tous les statuts</option>
              <option value="trial">En essai</option>
              <option value="active">Actif</option>
              <option value="past_due">En retard</option>
              <option value="expired">Expiré</option>
              <option value="cancelled">Annulé</option>
            </select>
          </>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          {tab === "subscriptions" ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Organisation</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Plan</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Facturation</th>
                  <th className="text-right text-xs font-medium text-slate-400 px-6 py-3">Montant</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Statut</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Fin de période</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-500 text-sm">Chargement...</td></tr>
                ) : filteredSubs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-500 text-sm">Aucun abonnement</td></tr>
                ) : filteredSubs.map((s) => (
                  <tr key={s.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-white">{s.organizations?.name || "—"}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${planColors[s.plan_id]}`}>{getPlanLabel(s.plan_id)}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-400">{getCycleLabel(s.billing_cycle)}</td>
                    <td className="px-6 py-3 text-sm font-medium text-white text-right">{s.amount > 0 ? formatCurrency(s.amount) : "—"}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[s.status]}`}>
                        {statusLabels[s.status] || s.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-400">
                      {s.current_period_end ? formatShortDate(s.current_period_end) : s.trial_end ? formatShortDate(s.trial_end) : "—"}
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500">{formatShortDate(s.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Organisation</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Plan</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Facturation</th>
                  <th className="text-right text-xs font-medium text-slate-400 px-6 py-3">Montant</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Méthode</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Statut</th>
                  <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-500 text-sm">Chargement...</td></tr>
                ) : filteredPayments.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-slate-500 text-sm">Aucun paiement</td></tr>
                ) : filteredPayments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-white">{p.organizations?.name || "—"}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${planColors[p.plan_id]}`}>{getPlanLabel(p.plan_id)}</span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-400">{getCycleLabel(p.billing_cycle)}</td>
                    <td className="px-6 py-3 text-sm font-semibold text-success-400 text-right">+{formatCurrency(p.amount)}</td>
                    <td className="px-6 py-3 text-sm text-slate-400">{p.payment_method || "—"}</td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[p.status]}`}>
                        {statusLabels[p.status] || p.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-500">{p.paid_at ? formatShortDate(p.paid_at) : formatShortDate(p.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
