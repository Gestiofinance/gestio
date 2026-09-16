"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSupabase } from "@/hooks/useSupabase";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import {
  Receipt, TrendingUp, Wallet, AlertCircle, Plus, FileText, Users, ArrowRight,
  CheckSquare, Flag, FolderKanban,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { DateFilter } from "@/components/ui/date-filter";

const statusColors = {
  payee: "success", envoyee: "primary", en_retard: "danger",
  brouillon: "default", partiellement_payee: "warning", annulee: "default",
};
const priorityColors = { basse: "default", moyenne: "primary", haute: "warning", urgente: "danger" };

export default function DashboardPage() {
  const supabase = useSupabase();
  const [allPayments, setAllPayments] = useState([]);
  const [allRevenues, setAllRevenues] = useState([]);
  const [allExpenses, setAllExpenses] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [todayTasks, setTodayTasks] = useState([]);
  const [activeProjects, setActiveProjects] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState("month");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => { loadDashboard(); }, []);

  async function loadDashboard() {
    try {
      const [{ data: invoices }, { data: payments }, { data: expenses }, { data: revenues }, { data: tasks }, { data: projects }] = await Promise.all([
        supabase.from("invoices").select("*, clients(company_name, contact_name)").order("created_at", { ascending: false }),
        supabase.from("payments").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("revenues").select("*"),
        supabase.from("tasks").select("*, projects(name)").neq("status", "termine").order("due_date").limit(5),
        supabase.from("projects").select("id").eq("status", "en_cours"),
      ]);
      setAllInvoices(invoices || []);
      setAllPayments(payments || []);
      setAllExpenses(expenses || []);
      setAllRevenues(revenues || []);
      setTodayTasks(tasks || []);
      setActiveProjects((projects || []).length);
    } catch (e) {
      console.error("Dashboard load error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(task) {
    await supabase.from("tasks").update({ status: "termine" }).eq("id", task.id);
    loadDashboard();
  }

  // Compute stats from period-filtered data
  function inPeriod(dateStr) {
    if (!filterPeriod || !dateStr) return true;
    const d = new Date(dateStr);
    const now = new Date();
    if (filterPeriod === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (filterPeriod === "quarter") { const q = Math.floor(now.getMonth() / 3); return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear(); }
    if (filterPeriod === "year") return d.getFullYear() === now.getFullYear();
    if (filterPeriod === "custom" && customStart && customEnd) return d >= new Date(customStart) && d <= new Date(customEnd + "T23:59:59");
    return true;
  }

  const ca = allPayments.filter((p) => inPeriod(p.payment_date)).reduce((s, p) => s + Number(p.amount), 0)
    + allRevenues.filter((r) => inPeriod(r.revenue_date)).reduce((s, r) => s + Number(r.amount), 0);
  const expensesTotal = allExpenses.filter((e) => inPeriod(e.expense_date)).reduce((s, e) => s + Number(e.amount), 0);
  const invoiceCount = allInvoices.filter((i) => inPeriod(i.created_at)).length;
  const recentInvoices = allInvoices.filter((i) => inPeriod(i.issue_date || i.created_at)).slice(0, 5);

  const now = new Date();
  const revenueData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const label = d.toLocaleDateString("fr-FR", { month: "short" });
    const payCA = allPayments.filter((p) => { const pd = new Date(p.payment_date); return pd.getMonth() === m && pd.getFullYear() === y; }).reduce((s, p) => s + Number(p.amount), 0);
    const revCA = allRevenues.filter((r) => { const rd = new Date(r.revenue_date); return rd.getMonth() === m && rd.getFullYear() === y; }).reduce((s, r) => s + Number(r.amount), 0);
    revenueData.push({ mois: label, ca: payCA + revCA });
  }

  if (loading) {
    return (
      <div>
        <Header title="Tableau de bord" />
        <div className="flex items-center justify-center h-64 text-muted">Chargement...</div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Tableau de bord" />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Quick actions + date filter */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/factures"><Button size="sm"><Plus className="w-4 h-4" /> Nouvelle facture</Button></Link>
            <Link href="/dashboard/devis"><Button variant="secondary" size="sm"><FileText className="w-4 h-4" /> Nouveau devis</Button></Link>
            <Link href="/dashboard/clients"><Button variant="secondary" size="sm"><Users className="w-4 h-4" /> Nouveau client</Button></Link>
          </div>
          <DateFilter period={filterPeriod} setPeriod={setFilterPeriod} customStart={customStart} setCustomStart={setCustomStart} customEnd={customEnd} setCustomEnd={setCustomEnd} />
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Chiffre d'affaires" value={formatCurrency(ca)} icon={TrendingUp} />
          <StatCard title="Dépenses" value={formatCurrency(expensesTotal)} icon={Wallet} />
          <StatCard title="Factures" value={invoiceCount} icon={Receipt} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Évolution du chiffre d&apos;affaires</h3>
                <span className="text-sm text-muted">6 derniers mois</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorCa" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#5E5CE6" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#5E5CE6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="mois" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => v > 0 ? `${v / 1000}k` : "0"} />
                    <Tooltip formatter={(value) => [formatCurrency(value), "CA"]} contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }} />
                    <Area type="monotone" dataKey="ca" stroke="#5E5CE6" strokeWidth={2} fill="url(#colorCa)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">Tâches à faire</h3>
                <Link href="/dashboard/taches" className="text-sm text-primary-500 hover:text-primary-600 font-medium inline-flex items-center gap-1">
                  Voir tout <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayTasks.length === 0 ? (
                <p className="text-sm text-muted text-center py-4">Aucune tâche en cours</p>
              ) : (
                todayTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <input type="checkbox" onChange={() => toggleTask(task)} className="mt-0.5 rounded border-slate-300" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                      {task.projects?.name && <p className="text-xs text-muted mt-0.5">{task.projects.name}</p>}
                    </div>
                    <Badge variant={priorityColors[task.priority]}>{task.priority}</Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent invoices */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Dernières factures</h3>
              <Link href="/dashboard/factures" className="text-sm text-primary-500 hover:text-primary-600 font-medium inline-flex items-center gap-1">
                Toutes les factures <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </CardHeader>
          {recentInvoices.length === 0 ? (
            <CardContent>
              <p className="text-sm text-muted text-center py-4">Aucune facture créée</p>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left text-xs font-medium text-muted px-6 py-3">N° Facture</th>
                    <th className="text-left text-xs font-medium text-muted px-6 py-3">Client</th>
                    <th className="text-left text-xs font-medium text-muted px-6 py-3">Date</th>
                    <th className="text-right text-xs font-medium text-muted px-6 py-3">Montant</th>
                    <th className="text-left text-xs font-medium text-muted px-6 py-3">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-sm font-medium text-foreground">{inv.invoice_number}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{inv.clients?.company_name || inv.clients?.contact_name || "—"}</td>
                      <td className="px-6 py-3 text-sm text-slate-600">{inv.issue_date ? formatShortDate(inv.issue_date) : "—"}</td>
                      <td className="px-6 py-3 text-sm font-medium text-foreground text-right">{formatCurrency(inv.total)}</td>
                      <td className="px-6 py-3"><Badge variant={statusColors[inv.status]}>{inv.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
