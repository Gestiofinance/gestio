"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { getPlanLabel, getCycleLabel } from "@/lib/plans";
import {
  Building2, Users, CreditCard, TrendingUp, CheckCircle, AlertCircle,
  Clock, Activity, ArrowUpRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const statusColors = {
  trial: "text-warning-400 bg-warning-400/10",
  active: "text-success-400 bg-success-400/10",
  past_due: "text-danger-400 bg-danger-400/10",
  cancelled: "text-slate-400 bg-slate-700",
  expired: "text-slate-400 bg-slate-700",
};

const statusLabels = {
  trial: "Essai", active: "Actif", past_due: "En retard",
  cancelled: "Annulé", expired: "Expiré",
};

function AdminStatCard({ title, value, sub, icon: Icon, color = "primary" }) {
  const colors = {
    primary: "bg-primary-500/10 text-primary-400 border-primary-500/20",
    success: "bg-success-500/10 text-success-400 border-success-500/20",
    warning: "bg-warning-500/10 text-warning-400 border-warning-500/20",
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

export default function AdminDashboardPage() {
  const supabase = useSupabase();
  const [stats, setStats] = useState({ orgs: 0, active: 0, trial: 0, mrr: 0 });
  const [recentOrgs, setRecentOrgs] = useState([]);
  const [revenueChart, setRevenueChart] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [
      { data: orgs },
      { data: subs },
      { data: payments },
    ] = await Promise.all([
      supabase.from("organizations").select("id, name, created_at").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("subscription_payments").select("*, organizations(name)").eq("status", "completed").order("paid_at", { ascending: false }),
    ]);

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    const active = (subs || []).filter((s) => s.status === "active");
    const trial = (subs || []).filter((s) => s.status === "trial");
    const mrr = active.reduce((acc, s) => {
      if (s.billing_cycle === "annual") return acc + Math.round(s.amount / 12);
      if (s.billing_cycle === "quarterly") return acc + Math.round(s.amount / 3);
      return acc + s.amount;
    }, 0);

    const monthRevenue = (payments || []).filter((p) => {
      const d = new Date(p.paid_at);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    }).reduce((acc, p) => acc + p.amount, 0);

    setStats({ orgs: (orgs || []).length, active: active.length, trial: trial.length, mrr });
    setRecentOrgs((orgs || []).slice(0, 5).map((org) => {
      const sub = (subs || []).find((s) => s.organization_id === org.id);
      return { ...org, sub };
    }));
    setRecentPayments((payments || []).slice(0, 8));

    // Build 6-month revenue chart
    const chart = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(thisYear, thisMonth - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const label = d.toLocaleDateString("fr-FR", { month: "short" });
      const rev = (payments || []).filter((p) => {
        const pd = new Date(p.paid_at);
        return pd.getMonth() === m && pd.getFullYear() === y;
      }).reduce((acc, p) => acc + p.amount, 0);
      chart.push({ mois: label, revenus: rev });
    }
    setRevenueChart(chart);
    setLoading(false);
  }

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Tableau de bord Admin</h1>
        <p className="text-slate-400 text-sm mt-1">Vue globale de la plateforme Gestio</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard title="Organisations" value={stats.orgs} sub="comptes enregistrés" icon={Building2} color="primary" />
        <AdminStatCard title="Abonnements actifs" value={stats.active} sub={`${stats.trial} en essai`} icon={CreditCard} color="success" />
        <AdminStatCard title="MRR estimé" value={formatCurrency(stats.mrr)} sub="mensuel récurrent" icon={TrendingUp} color="violet" />
        <AdminStatCard title="Utilisateurs en essai" value={stats.trial} sub="14 jours offerts" icon={Clock} color="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
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
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => v > 0 ? `${v / 1000}k` : "0"} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }}
                  formatter={(v) => [formatCurrency(v), "Revenus"]}
                />
                <Area type="monotone" dataKey="revenus" stroke="#5E5CE6" strokeWidth={2} fill="url(#adminRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent payments */}
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

      {/* Recent organizations */}
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
                  <td className="px-6 py-3 text-sm text-slate-300">{org.sub ? getPlanLabel(org.sub.plan_id) : "—"}</td>
                  <td className="px-6 py-3">
                    {org.sub ? (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[org.sub.status] || "text-slate-400"}`}>
                        {statusLabels[org.sub.status] || org.sub.status}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Pas d&apos;abonnement</span>
                    )}
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
