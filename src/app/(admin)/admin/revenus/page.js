"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import { getPlanLabel, getCycleLabel } from "@/lib/plans";
import { TrendingUp, DollarSign, Award } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const PLAN_COLORS = { standard: "#5E5CE6", pro: "#8B5CF6", business: "#22c55e" };

export default function AdminRevenusPage() {
  const [allPayments, setAllPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/admin/subscriptions");
      if (!res.ok) throw new Error("Erreur API");
      const { payments } = await res.json();
      // Keep only completed payments
      setAllPayments((payments || []).filter((p) => p.status === "completed"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();

  const filtered = allPayments.filter((p) => {
    const d = new Date(p.paid_at || p.created_at);
    if (period === "month") {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (period === "quarter") {
      const q = Math.floor(now.getMonth() / 3);
      return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear();
    }
    if (period === "year") {
      return d.getFullYear() === now.getFullYear();
    }
    if (period === "custom" && customStart && customEnd) {
      return d >= new Date(customStart) && d <= new Date(customEnd + "T23:59:59");
    }
    return true;
  });

  const totalRevenue = filtered.reduce((s, p) => s + (p.amount || 0), 0);
  const avgPayment = filtered.length > 0 ? Math.round(totalRevenue / filtered.length) : 0;

  // Monthly chart (last 12 months, always from allPayments)
  const monthlyChart = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    const rev = allPayments.filter((p) => {
      const pd = new Date(p.paid_at || p.created_at);
      return pd.getMonth() === m && pd.getFullYear() === y;
    }).reduce((s, p) => s + (p.amount || 0), 0);
    monthlyChart.push({ mois: label, revenus: rev });
  }

  const planDist = ["standard", "pro", "business"].map((planId) => ({
    name: getPlanLabel(planId),
    value: filtered.filter((p) => p.plan_id === planId).reduce((s, p) => s + (p.amount || 0), 0),
    count: filtered.filter((p) => p.plan_id === planId).length,
    color: PLAN_COLORS[planId],
  })).filter((p) => p.value > 0);

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Revenus</h1>
          <p className="text-slate-400 text-sm mt-1">Analyse des revenus des abonnements</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Revenus total", value: formatCurrency(totalRevenue), icon: TrendingUp, color: "text-primary-400 bg-primary-400/10" },
          { label: "Paiements", value: filtered.length, icon: DollarSign, color: "text-success-400 bg-success-400/10" },
          { label: "Panier moyen", value: formatCurrency(avgPayment), icon: Award, color: "text-violet-400 bg-violet-400/10" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800 rounded-xl border border-slate-700 p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{s.label}</p>
              <p className="text-xl font-bold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Monthly bar chart */}
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <h2 className="font-semibold text-white mb-4">Revenus mensuels (12 mois)</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => v > 0 ? `${(v / 1000).toFixed(0)}k` : "0"} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }}
                  formatter={(v) => [formatCurrency(v), "Revenus"]}
                />
                <Bar dataKey="revenus" fill="#5E5CE6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan distribution */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <h2 className="font-semibold text-white mb-4">Par plan</h2>
          {planDist.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Aucune donnée</p>
          ) : (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={planDist} cx="50%" cy="50%" outerRadius={60} dataKey="value" nameKey="name">
                      {planDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: "8px", color: "#fff" }}
                      formatter={(v) => formatCurrency(v)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {planDist.map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                      <span className="text-slate-300">{p.name}</span>
                      <span className="text-slate-500 text-xs">({p.count})</span>
                    </div>
                    <span className="font-medium text-white">{formatCurrency(p.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="font-semibold text-white">Historique des paiements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Organisation</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Plan</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Cycle</th>
                <th className="text-right text-xs font-medium text-slate-400 px-6 py-3">Montant</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Méthode</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500 text-sm">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-slate-500 text-sm">Aucun paiement</td></tr>
              ) : filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-3 text-sm font-medium text-white">{p.organizations?.name || "—"}</td>
                  <td className="px-6 py-3">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: PLAN_COLORS[p.plan_id], background: (PLAN_COLORS[p.plan_id] || "#666") + "20" }}>
                      {getPlanLabel(p.plan_id)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-400">{getCycleLabel(p.billing_cycle)}</td>
                  <td className="px-6 py-3 text-sm font-semibold text-success-400 text-right">+{formatCurrency(p.amount)}</td>
                  <td className="px-6 py-3 text-sm text-slate-400">{p.payment_method || "—"}</td>
                  <td className="px-6 py-3 text-sm text-slate-500">{p.paid_at ? formatShortDate(p.paid_at) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
