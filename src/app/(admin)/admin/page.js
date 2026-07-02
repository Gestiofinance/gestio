"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { getPlanLabel } from "@/lib/plans";
import { Building2, CreditCard, TrendingUp } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const statusColors = {
  trial: "text-warning-400 bg-warning-400/10",
  active: "text-success-400 bg-success-400/10",
  past_due: "text-danger-400 bg-danger-400/10",
  suspended: "text-danger-400 bg-danger-400/10",
  cancelled: "text-slate-400 bg-slate-700",
  expired: "text-slate-400 bg-slate-700",
};

const statusLabels = {
  trial: "Essai", active: "Actif", past_due: "En retard",
  suspended: "Suspendu", cancelled: "Annulé", expired: "Expiré",
};

const planColors = {
  standard: "text-primary-400 bg-primary-400/10",
  pro: "text-violet-400 bg-violet-400/10",
  business: "text-success-400 bg-success-400/10",
};

function AdminStatCard({ title, value, sub, icon: Icon, color = "primary" }) {
  const colors = {
    primary: "bg-primary-500/10 text-primary-400 border-primary-500/20",
    success: "bg-success-500/10 text-success-400 border-success-500/20",
    violet: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  };
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {sub && <p className="text-xs text-slate-500">{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl border ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function filterPayments(payments, period, customStart, customEnd) {
  const now = new Date();
  return payments.filter((p) => {
    const d = new Date(p.paid_at || p.created_at);
    if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === "quarter") {
      const q = Math.floor(now.getMonth() / 3);
      return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear();
    }
    if (period === "year") return d.getFullYear() === now.getFullYear();
    if (period === "custom" && customStart && customEnd) {
      return d >= new Date(customStart) && d <= new Date(customEnd + "T23:59:59");
    }
    return true;
  });
}

export default function AdminDashboardPage() {
  const [allOrgs, setAllOrgs] = useState([]);
  const [allSubs, setAllSubs] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [usersRes, subsRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/subscriptions"),
      ]);
      const [usersData, subsData] = await Promise.all([usersRes.json(), subsRes.json()]);

      setAllOrgs(usersData.organizations || []);
      setAllSubs(subsData.subscriptions || []);
      setAllPayments((subsData.payments || []).filter((p) => p.status === "completed"));
    } catch (e) {
      console.error("Admin dashboard error:", e);
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const filteredPayments = filterPayments(allPayments, period, customStart, customEnd);

  const active = allSubs.filter((s) => s.status === "active");
  const mrr = active.reduce((acc, s) => {
    if (s.billing_cycle === "annual") return acc + Math.round((s.amount || 0) / 12);
    if (s.billing_cycle === "quarterly") return acc + Math.round((s.amount || 0) / 3);
    return acc + (s.amount || 0);
  }, 0);
  const totalRevenue = filteredPayments.reduce((s, p) => s + (p.amount || 0), 0);

  const recentOrgs = allOrgs.slice(0, 5).map((org) => ({
    ...org,
    sub: allSubs.find((s) => s.organization_id === org.id),
  }));

  const recentPayments = filteredPayments.slice(0, 8);

  // 6-month revenue chart
  const revenueChart = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const label = d.toLocaleDateString("fr-FR", { month: "short" });
    const rev = allPayments.filter((p) => {
      const pd = new Date(p.paid_at || p.created_at);
      return pd.getMonth() === m && pd.getFullYear() === y;
    }).reduce((acc, p) => acc + (p.amount || 0), 0);
    revenueChart.push({ mois: label, revenus: rev });
  }

  return (
    <div className="p-6 sm:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Tableau de bord Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Vue globale de la plateforme Gestio</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300"
          >
            <option value="all">Tout le temps</option>
            <option value="month">Ce mois</option>
            <option value="quarter">Ce trimestre</option>
            <option value="year">Cette année</option>
            <option value="custom">Période personnalisée</option>
          </select>
          {period === "custom" && (
            <>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300"
              />
              <span className="text-slate-500 text-sm">→</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300"
              />
            </>
          )}
        </div>
      </div>

      {/* Stats — 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          title="Revenus total"
          value={formatCurrency(totalRevenue)}
          sub={period === "all" ? "depuis le début" : "période sélectionnée"}
          icon={TrendingUp}
          color="primary"
        />
        <AdminStatCard
          title="Abonnements actifs"
          value={active.length}
          sub={`${allSubs.filter((s) => s.status === "trial").length} en essai`}
          icon={CreditCard}
          color="success"
        />
        <AdminStatCard
          title="MRR estimé"
          value={formatCurrency(mrr)}
          sub="mensuel récurrent"
          icon={Building2}
          color="violet"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-semibold text-white">Revenus des abonnements</h2>
            <span className="text-xs text-slate-500">6 derniers mois</span>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="adminRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5E5CE6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#5E5CE6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="mois" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => v > 0 ? `${(v / 1000).toFixed(0)}k` : "0"} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }}
                  formatter={(v) => [formatCurrency(v), "Revenus"]}
                />
                <Area type="monotone" dataKey="revenus" stroke="#5E5CE6" strokeWidth={2} fill="url(#adminRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <h2 className="font-semibold text-white mb-4">Derniers paiements</h2>
          <div className="space-y-3">
            {recentPayments.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-6">Aucun paiement enregistré</p>
            ) : recentPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{p.organizations?.name || "—"}</p>
                  <p className="text-xs text-slate-500">{getPlanLabel(p.plan_id)} · {p.paid_at ? formatShortDate(p.paid_at) : "—"}</p>
                </div>
                <span className="text-sm font-semibold text-success-400 shrink-0 ml-2">+{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <h2 className="font-semibold text-white">Dernières inscriptions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Organisation</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Inscrit le</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Plan</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500 text-sm">Chargement...</td></tr>
              ) : recentOrgs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-slate-500 text-sm">Aucune organisation</td></tr>
              ) : recentOrgs.map((org) => (
                <tr key={org.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-primary-400" />
                      </div>
                      <span className="text-sm font-medium text-white">{org.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-400">{formatShortDate(org.created_at)}</td>
                  <td className="px-6 py-3">
                    {org.sub ? (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${planColors[org.sub.plan_id] || "text-slate-400 bg-slate-700"}`}>
                        {getPlanLabel(org.sub.plan_id)}
                      </span>
                    ) : <span className="text-xs text-slate-500">—</span>}
                  </td>
                  <td className="px-6 py-3">
                    {org.sub ? (
                      <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[org.sub.status] || "text-slate-400 bg-slate-700"}`}>
                        {statusLabels[org.sub.status] || org.sub.status}
                      </span>
                    ) : <span className="text-xs text-slate-500">Pas d&apos;abonnement</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
