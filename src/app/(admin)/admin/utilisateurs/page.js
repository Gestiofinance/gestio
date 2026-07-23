"use client";

import { useState, useEffect } from "react";
import { formatShortDate } from "@/lib/utils";
import { getPlanLabel, getCycleLabel } from "@/lib/plans";
import {
  Building2, Search, Users, CheckCircle, Clock, XCircle, Eye, EyeOff,
  Pencil, Key, PauseCircle, PlayCircle, Trash2, X, AlertTriangle,
} from "lucide-react";

const statusColors = {
  trial: "text-warning-400 bg-warning-400/10 border-warning-400/20",
  active: "text-success-400 bg-success-400/10 border-success-400/20",
  past_due: "text-danger-400 bg-danger-400/10 border-danger-400/20",
  suspended: "text-danger-400 bg-danger-400/10 border-danger-400/20",
  cancelled: "text-slate-400 bg-slate-700 border-slate-600",
  expired: "text-slate-400 bg-slate-700 border-slate-600",
};
const statusLabels = {
  trial: "Essai", active: "Actif", past_due: "En retard",
  suspended: "Suspendu", cancelled: "Annulé", expired: "Expiré",
};

function ActionButton({ icon: Icon, label, onClick, variant = "default" }) {
  const styles = {
    default: "text-slate-300 hover:bg-slate-600 hover:text-white",
    danger: "text-danger-400 hover:bg-danger-400/10",
    warning: "text-warning-400 hover:bg-warning-400/10",
    success: "text-success-400 hover:bg-success-400/10",
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm transition-all ${styles[variant]}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}

export default function AdminUsersPage() {
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState(null);

  // Modal states
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", email: "" });
  const [pwModal, setPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) throw new Error("Erreur API");
      const { organizations, subscriptions, profiles } = await res.json();

      const list = (organizations || []).map((org) => {
        const sub = (subscriptions || []).find((s) => s.organization_id === org.id);
        const members = (profiles || []).filter((p) => p.organization_id === org.id);
        const owner = members.find((m) => m.role === "proprietaire") || members[0];
        return { ...org, sub, members, owner };
      });
      setOrgs(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openDetail(org) {
    setSelected(org);
    setActionError("");
  }

  function openEdit() {
    setEditForm({ full_name: selected.owner?.full_name || "", email: selected.owner?.email || "" });
    setEditModal(true);
    setActionError("");
  }

  function openPw() {
    setPwForm({ password: "", confirm: "" });
    setPwModal(true);
    setActionError("");
  }

  async function apiAction(body, onSuccess) {
    setSaving(true);
    setActionError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) { setActionError(json.error || "Erreur"); setSaving(false); return; }
      await loadData();
      onSuccess?.();
    } catch (e) {
      setActionError("Une erreur est survenue.");
    }
    setSaving(false);
  }

  async function handleSaveInfo() {
    await apiAction(
      { action: "update_info", ownerId: selected.owner?.id, orgId: selected.id, ...editForm },
      () => { setEditModal(false); setSelected((s) => s ? { ...s, owner: { ...s.owner, ...editForm } } : s); }
    );
  }

  async function handleSavePw() {
    if (pwForm.password !== pwForm.confirm) { setActionError("Les mots de passe ne correspondent pas."); return; }
    await apiAction(
      { action: "update_password", ownerId: selected.owner?.id, password: pwForm.password },
      () => setPwModal(false)
    );
  }

  async function handleSuspend() {
    const isSuspended = selected.sub?.status === "suspended";
    await apiAction(
      { action: isSuspended ? "unsuspend" : "suspend", orgId: selected.id },
      () => setSelected((s) => s ? { ...s, sub: { ...s.sub, status: isSuspended ? "active" : "suspended" } } : s)
    );
  }

  async function handleDelete() {
    setSaving(true);
    setActionError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: selected.id }),
      });
      const json = await res.json();
      if (!res.ok) { setActionError(json.error || "Erreur"); setSaving(false); return; }
      await loadData();
      setSelected(null);
      setConfirmDelete(false);
    } catch (e) {
      setActionError("Une erreur est survenue.");
    }
    setSaving(false);
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
    expired: orgs.filter((o) => ["expired", "cancelled", "suspended"].includes(o.sub?.status)).length,
  };

  const isSuspended = selected?.sub?.status === "suspended";

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
          { label: "Inactifs", value: stats.expired, icon: XCircle, color: "text-slate-400" },
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
          <option value="suspended">Suspendu</option>
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
                  <td className="px-6 py-3 text-sm text-slate-300">
                    {org.sub ? `${getPlanLabel(org.sub.plan_id)} · ${getCycleLabel(org.sub.billing_cycle)}` : "—"}
                  </td>
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
                    {org.sub?.current_period_end
                      ? formatShortDate(org.sub.current_period_end)
                      : org.sub?.trial_end
                      ? `Essai → ${formatShortDate(org.sub.trial_end)}`
                      : "—"}
                  </td>
                  <td className="px-6 py-3">
                    <button onClick={() => openDetail(org)} className="p-1.5 rounded-lg hover:bg-slate-600 transition-colors">
                      <Eye className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail + action panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => { setSelected(null); setEditModal(false); setPwModal(false); setConfirmDelete(false); }} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md mx-4 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">{selected.name}</h3>
              <button onClick={() => { setSelected(null); setEditModal(false); setPwModal(false); setConfirmDelete(false); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info grid */}
            {!editModal && !pwModal && !confirmDelete && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-700 rounded-lg">
                    <p className="text-xs text-slate-400 mb-1">Propriétaire</p>
                    <p className="text-sm text-white">{selected.owner?.full_name || "—"}</p>
                    <p className="text-xs text-slate-400 mt-0.5 break-all">{selected.owner?.email || "—"}</p>
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
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusColors[selected.sub.status] || "text-slate-400"}`}>
                          {statusLabels[selected.sub.status] || selected.sub.status}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                <div className="border-t border-slate-700 pt-3 space-y-1">
                  <p className="text-xs text-slate-500 px-3 mb-2">Actions</p>
                  <ActionButton icon={Pencil} label="Modifier les informations" onClick={openEdit} />
                  <ActionButton icon={Key} label="Changer le mot de passe" onClick={openPw} />
                  <ActionButton
                    icon={isSuspended ? PlayCircle : PauseCircle}
                    label={isSuspended ? "Réactiver le compte" : "Suspendre le compte"}
                    onClick={handleSuspend}
                    variant={isSuspended ? "success" : "warning"}
                  />
                  <ActionButton icon={Trash2} label="Supprimer le compte" onClick={() => setConfirmDelete(true)} variant="danger" />
                </div>
                {actionError && <p className="text-xs text-danger-400 bg-danger-400/10 px-3 py-2 rounded-lg">{actionError}</p>}
              </>
            )}

            {/* Edit info form */}
            {editModal && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Modifier les informations</h4>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nom complet</label>
                  <input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm outline-none focus:border-primary-500"
                  />
                </div>
                {actionError && <p className="text-xs text-danger-400 bg-danger-400/10 px-3 py-2 rounded-lg">{actionError}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setEditModal(false); setActionError(""); }} className="flex-1 px-3 py-2 rounded-lg bg-slate-700 text-sm text-slate-300 hover:bg-slate-600">Annuler</button>
                  <button onClick={handleSaveInfo} disabled={saving} className="flex-1 px-3 py-2 rounded-lg bg-primary-500 text-sm text-white font-medium hover:bg-primary-600 disabled:opacity-50">
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </div>
              </div>
            )}

            {/* Change password form */}
            {pwModal && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-white">Changer le mot de passe</h4>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nouveau mot de passe</label>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      value={pwForm.password}
                      onChange={(e) => setPwForm({ ...pwForm, password: e.target.value })}
                      className="w-full px-3 py-2 pr-10 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm outline-none focus:border-primary-500"
                      placeholder="Min. 6 caractères"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      tabIndex={-1}
                      aria-label={showPw ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Confirmer</label>
                  <input
                    type={showPw ? "text" : "password"}
                    value={pwForm.confirm}
                    onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm outline-none focus:border-primary-500"
                    placeholder="Répéter le mot de passe"
                  />
                </div>
                {actionError && <p className="text-xs text-danger-400 bg-danger-400/10 px-3 py-2 rounded-lg">{actionError}</p>}
                <div className="flex gap-2 pt-1">
                  <button onClick={() => { setPwModal(false); setActionError(""); }} className="flex-1 px-3 py-2 rounded-lg bg-slate-700 text-sm text-slate-300 hover:bg-slate-600">Annuler</button>
                  <button onClick={handleSavePw} disabled={saving || !pwForm.password} className="flex-1 px-3 py-2 rounded-lg bg-primary-500 text-sm text-white font-medium hover:bg-primary-600 disabled:opacity-50">
                    {saving ? "Enregistrement..." : "Confirmer"}
                  </button>
                </div>
              </div>
            )}

            {/* Delete confirmation */}
            {confirmDelete && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-danger-400/10 border border-danger-400/20 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-danger-400 shrink-0" />
                  <p className="text-sm text-slate-200">
                    Cette action est <strong>irréversible</strong>. Tous les comptes, données et abonnements de <strong>{selected.name}</strong> seront supprimés définitivement.
                  </p>
                </div>
                {actionError && <p className="text-xs text-danger-400 bg-danger-400/10 px-3 py-2 rounded-lg">{actionError}</p>}
                <div className="flex gap-2">
                  <button onClick={() => { setConfirmDelete(false); setActionError(""); }} className="flex-1 px-3 py-2 rounded-lg bg-slate-700 text-sm text-slate-300 hover:bg-slate-600">Annuler</button>
                  <button onClick={handleDelete} disabled={saving} className="flex-1 px-3 py-2 rounded-lg bg-danger-500 text-sm text-white font-medium hover:bg-danger-600 disabled:opacity-50">
                    {saving ? "Suppression..." : "Supprimer définitivement"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
