"use client";

import { useState, useEffect } from "react";
import { formatShortDate } from "@/lib/utils";
import { Percent, Save, Check, Loader2, Share2, Banknote, X } from "lucide-react";

const INPUT_CLASS =
  "w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

const affiliateStatusColors = {
  actif: "text-success-400 bg-success-400/10 border-success-400/20",
  suspendu: "text-slate-400 bg-slate-700 border-slate-600",
};

const withdrawalStatusColors = {
  en_attente: "text-warning-400 bg-warning-400/10 border-warning-400/20",
  approuvee: "text-primary-400 bg-primary-400/10 border-primary-400/20",
  payee: "text-success-400 bg-success-400/10 border-success-400/20",
  rejetee: "text-danger-400 bg-danger-400/10 border-danger-400/20",
};
const withdrawalStatusLabels = { en_attente: "En attente", approuvee: "Approuvée", payee: "Payée", rejetee: "Rejetée" };

function fmtFcfa(n) {
  return Math.round(n || 0).toLocaleString("fr-FR") + " FCFA";
}

export default function AdminAffiliationPage() {
  const [commissionRate, setCommissionRate] = useState(10);
  const [minWithdrawal, setMinWithdrawal] = useState(10000);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [affiliates, setAffiliates] = useState([]);
  const [loadingAffiliates, setLoadingAffiliates] = useState(true);

  const [withdrawals, setWithdrawals] = useState([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadSettings();
    loadAffiliates();
    loadWithdrawals();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/affiliate/settings");
      const data = await res.json();
      if (res.ok) {
        setCommissionRate(data.commissionRate);
        setMinWithdrawal(data.minWithdrawal);
      }
    } catch {}
  }

  async function loadAffiliates() {
    setLoadingAffiliates(true);
    try {
      const res = await fetch("/api/admin/affiliate/list");
      const data = await res.json();
      setAffiliates(data.affiliates || []);
    } catch {}
    setLoadingAffiliates(false);
  }

  async function loadWithdrawals() {
    setLoadingWithdrawals(true);
    try {
      const res = await fetch("/api/admin/affiliate/withdrawals");
      const data = await res.json();
      setWithdrawals(data.withdrawals || []);
    } catch {}
    setLoadingWithdrawals(false);
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      await fetch("/api/admin/affiliate/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commissionRate, minWithdrawal }),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } finally {
      setSavingSettings(false);
    }
  }

  async function toggleAffiliateStatus(affiliate) {
    const newStatus = affiliate.status === "actif" ? "suspendu" : "actif";
    await fetch(`/api/admin/affiliate/${affiliate.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    loadAffiliates();
  }

  function openWithdrawal(w) {
    setSelectedWithdrawal(w);
    setAdminNote(w.admin_note || "");
  }

  async function processWithdrawal(status) {
    if (!selectedWithdrawal) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/affiliate/withdrawals/${selectedWithdrawal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedWithdrawal(null);
        loadWithdrawals();
        loadAffiliates();
      } else {
        alert(data.error || "Une erreur est survenue");
      }
    } finally {
      setProcessing(false);
    }
  }

  const pendingCount = withdrawals.filter((w) => w.status === "en_attente").length;

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Affiliation</h1>
        <p className="text-slate-400 text-sm mt-1">Programme de parrainage — commissions, affiliés, demandes de retrait</p>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <p className="text-xs text-slate-500">Affiliés</p>
          <p className="text-lg font-bold text-white">{affiliates.length}</p>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <p className="text-xs text-slate-500">Solde total dû</p>
          <p className="text-lg font-bold text-white">{fmtFcfa(affiliates.reduce((s, a) => s + Number(a.balance || 0), 0))}</p>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <p className="text-xs text-slate-500">Retraits en attente</p>
          <p className="text-lg font-bold text-warning-400">{pendingCount}</p>
        </div>
      </div>

      {/* Paramètres de commission */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-slate-700 rounded-lg"><Percent className="w-5 h-5 text-slate-300" /></div>
          <h2 className="text-base font-semibold text-white">Paramètres de commission</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Taux de commission (%)</label>
            <input
              type="number" min="0" max="100" value={commissionRate}
              onChange={(e) => setCommissionRate(parseFloat(e.target.value))} className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Retrait minimum (FCFA)</label>
            <input
              type="number" min="0" value={minWithdrawal}
              onChange={(e) => setMinWithdrawal(parseFloat(e.target.value))} className={INPUT_CLASS}
            />
          </div>
        </div>
        <div className="flex justify-end mt-5">
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60 ${settingsSaved ? "bg-green-600 text-white" : "bg-violet-600 hover:bg-violet-700 text-white"}`}
          >
            {savingSettings
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              : settingsSaved
              ? <><Check className="w-4 h-4" /> Enregistré</>
              : <><Save className="w-4 h-4" /> Enregistrer</>}
          </button>
        </div>
      </div>

      {/* Affiliés */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-700">
          <Share2 className="w-5 h-5 text-slate-300" />
          <h2 className="text-base font-semibold text-white">Affiliés</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Organisation</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Code</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Filleuls</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Solde</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Total gagné</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Statut</th>
                <th className="text-right text-xs font-medium text-slate-400 px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loadingAffiliates ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500 text-sm">Chargement...</td></tr>
              ) : affiliates.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500 text-sm">Aucun affilié pour le moment</td></tr>
              ) : affiliates.map((a) => (
                <tr key={a.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-3 text-sm text-white">{a.organizations?.name || "—"}</td>
                  <td className="px-6 py-3 text-sm text-slate-400 font-mono">{a.code}</td>
                  <td className="px-6 py-3 text-sm text-slate-300">{a.referredCount}</td>
                  <td className="px-6 py-3 text-sm text-slate-300">{fmtFcfa(a.balance)}</td>
                  <td className="px-6 py-3 text-sm text-slate-300">{fmtFcfa(a.total_earned)}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${affiliateStatusColors[a.status]}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => toggleAffiliateStatus(a)}
                      className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      {a.status === "actif" ? "Suspendre" : "Activer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demandes de retrait */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-700">
          <Banknote className="w-5 h-5 text-slate-300" />
          <h2 className="text-base font-semibold text-white">Demandes de retrait</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Organisation</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Montant</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Téléphone</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Demandé le</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {loadingWithdrawals ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500 text-sm">Chargement...</td></tr>
              ) : withdrawals.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-500 text-sm">Aucune demande de retrait</td></tr>
              ) : withdrawals.map((w) => (
                <tr
                  key={w.id}
                  onClick={() => openWithdrawal(w)}
                  className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-3 text-sm text-white">{w.affiliates?.organizations?.name || "—"}</td>
                  <td className="px-6 py-3 text-sm text-slate-300">{fmtFcfa(w.amount)}</td>
                  <td className="px-6 py-3 text-sm text-slate-400">{w.phone}</td>
                  <td className="px-6 py-3 text-sm text-slate-500">{formatShortDate(w.requested_at)}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${withdrawalStatusColors[w.status]}`}>
                      {withdrawalStatusLabels[w.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Détail / traitement d'une demande */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setSelectedWithdrawal(null)} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedWithdrawal.affiliates?.organizations?.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Code {selectedWithdrawal.affiliates?.code}</p>
              </div>
              <button onClick={() => setSelectedWithdrawal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <p className="text-slate-300">Montant : <span className="font-semibold text-white">{fmtFcfa(selectedWithdrawal.amount)}</span></p>
              <p className="text-slate-300">Téléphone Mobile Money : <span className="font-semibold text-white">{selectedWithdrawal.phone}</span></p>
              <p className="text-slate-300">Demandé le : <span className="text-white">{formatShortDate(selectedWithdrawal.requested_at)}</span></p>
              <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${withdrawalStatusColors[selectedWithdrawal.status]}`}>
                {withdrawalStatusLabels[selectedWithdrawal.status]}
              </span>
            </div>

            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              placeholder="Note interne (optionnel)..."
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-white text-sm outline-none focus:border-violet-500 resize-none mb-4"
            />

            {["en_attente", "approuvee"].includes(selectedWithdrawal.status) ? (
              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  onClick={() => processWithdrawal("rejetee")}
                  disabled={processing}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-60"
                >
                  Rejeter
                </button>
                {selectedWithdrawal.status === "en_attente" && (
                  <button
                    onClick={() => processWithdrawal("approuvee")}
                    disabled={processing}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
                  >
                    Approuver
                  </button>
                )}
                <button
                  onClick={() => processWithdrawal("payee")}
                  disabled={processing}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-success-600 text-white hover:bg-success-700 disabled:opacity-60"
                >
                  Marquer payée
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-right">Demande déjà traitée.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
