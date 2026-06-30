"use client";

import { useState, useEffect } from "react";
import { useSupabase } from "@/hooks/useSupabase";
import { formatShortDate } from "@/lib/utils";
import { getPlanLabel, getCycleLabel } from "@/lib/plans";
import { Building2, Search, Users, CheckCircle, Clock, XCircle, Eye } from "lucide-react";

const statusColors = {
  trial: "text-warning-400 bg-warning-400/10 border-warning-400/20",
  active: "text-success-400 bg-success-400/10 border-success-400/20",
  past_due: "text-danger-400 bg-danger-400/10 border-danger-400/20",
  cancelled: "text-slate-400 bg-slate-700 border-slate-600",
  expired: "text-slate-400 bg-slate-700 border-slate-600",
};
const statusLabels = {
  trial: "Essai", active: "Actif", past_due: "En retard",
  cancelled: "Annulé", expired: "Expiré",
};

export default function AdminUsersPage() {
  const supabase = useSupabase();
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [{ data: organizations }, { data: subscriptions }, { data: profiles }] = await Promise.all([
      supabase.from("organizations").select("*").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("*"),
      supabase.from("profiles").select("id, full_name, email, role, organization_id, created_at"),
    ]);

    const list = (organizations || []).map((org) => {
      const sub = (subscriptions || []).find((s) => s.organization_id === org.id);
      const members = (profiles || []).filter((p) => p.organization_id === org.id);
      const owner = members.find((m) => m.role === "proprietaire") || members[0];
      return { ...org, sub, members, owner };
    });
    setOrgs(list);
    setLoading(false);
  }

  const filtered = orgs.filter((o) => {
    if (filterStatus && o.sub?.status !== filterStatus) return false;
    const q = search.toLowerCase();
    return o.name.toLowerCase().includes(q) || (o.owner?.email || "").toLowerCase().includes(q);
  });

  const stats = {
    total: orgs.length,
    active: orgs.filter((o) => o.sub?.status === "active").length,
    trial: orgs.filter((o) => o.sub?.status === "trial" || !o.sub).length,
    expired: orgs.filter((o) => ["expired", "cancelled"].includes(o.sub?.status)).length,
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
        <p className="text-slate-400 text-sm mt-1">Toutes les organisations enregistrées sur Gestio</p>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Building2, color: "text-white" },
          { label: "Actifs", value: stats.active, icon: CheckCircle, color: "text-success-400" },
          { label: "En essai", value: stats.trial, icon: Clock, color: "text-warning-400" },
          { label: "Expirés", value: stats.expired, icon: XCircle, color: "text-slate-400" },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center gap-3">
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-lg font-bold text-white">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="bg-transparent text-white placeholder-slate-500 outline-none w-48"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-sm text-slate-300"
        >
          <option value="">Tous les statuts</option>
          <option value="trial">En essai</option>
          <option value="active">Actif</option>
          <option value="past_due">En retard</option>
          <option value="cancelled">Annulé</option>
          <option value="expired">Expiré</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Organisation</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Propriétaire</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Inscrit le</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Membres</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Plan</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Statut</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Fin période</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500 text-sm">Chargement...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-slate-500 text-sm">Aucune organisation trouvée</td></tr>
              ) : filtered.map((org) => (
                <tr key={org.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/20 flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-primary-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{org.name}</p>
                        {org.city && <p className="text-xs text-slate-500">{org.city}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-sm text-slate-300">{org.owner?.full_name || "—"}</p>
                    <p className="text-xs text-slate-500">{org.owner?.email || "—"}</p>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-400">{formatShortDate(org.created_at)}</td>
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-1 text-sm text-slate-400">
                      <Users className="w-3.5 h-3.5" />
                      {org.members.length}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-300">{org.sub ? `${getPlanLabel(org.sub.plan_id)} · ${getCycleLabel(org.sub.billing_cycle)}` : "—"}</td>
                  <td className="px-6 py-3">
                    {org.sub ? (
                      <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[org.sub.status] || "text-slate-400"}`}>
                        {statusLabels[org.sub.status] || org.sub.status}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">Pas d&apos;abo.</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-500">
                    {org.sub?.current_period_end ? formatShortDate(org.sub.current_period_end) : org.sub?.trial_end ? `Essai → ${formatShortDate(org.sub.trial_end)}` : "—"}
                  </td>
                  <td className="px-6 py-3">
                    <button onClick={() => setSelected(org)} className="p-1.5 rounded-lg hover:bg-slate-600 transition-colors">
                      <Eye className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSelected(null)} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg mx-4 p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-white text-xl leading-none">×</button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Propriétaire</p>
                <p className="text-sm text-white">{selected.owner?.full_name || "—"}</p>
                <p className="text-xs text-slate-400">{selected.owner?.email || "—"}</p>
              </div>
              <div className="p-3 bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Membres</p>
                <p className="text-sm text-white">{selected.members.length} utilisateur{selected.members.length > 1 ? "s" : ""}</p>
              </div>
              {selected.sub && (
                <>
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Plan</p>
                    <p className="text-sm text-white">{getPlanLabel(selected.sub.plan_id)}</p>
                    <p className="text-xs text-slate-400">{getCycleLabel(selected.sub.billing_cycle)}</p>
                  </div>
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Statut</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[selected.sub.status]}`}>
                      {statusLabels[selected.sub.status]}
                    </span>
                  </div>
                </>
              )}
            </div>
            {selected.phone && (
              <div className="p-3 bg-slate-700 rounded-lg">
                <p className="text-xs text-slate-400 mb-1">Téléphone</p>
                <p className="text-sm text-white">{selected.phone}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
