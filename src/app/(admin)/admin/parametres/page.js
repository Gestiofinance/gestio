"use client";

import { useState, useEffect } from "react";
import { Bell, Shield, Globe, CreditCard, Save, Check, Loader2, Percent } from "lucide-react";

const INPUT_CLASS =
  "w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

const READONLY_CLASS =
  "w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-violet-300 text-sm font-medium cursor-default select-none";

export default function AdminParametresPage() {
  const [settings, setSettings] = useState({
    appName: "Gestio",
    supportEmail: "support@gestio.sn",
    trialDays: 14,
    maintenanceMode: false,
    allowRegistrations: true,
    newUserAlert: true,
    paymentAlert: true,
    expirationAlert: true,
  });

  // Monthly prices (editable)
  const [monthlyPrices, setMonthlyPrices] = useState({ standard: 9000, pro: 14500, business: 25000 });
  // Annual discount % (editable) — applies to Standard and Pro
  const [discountPct, setDiscountPct] = useState(12);

  const [loadingPrices, setLoadingPrices] = useState(true);
  const [savingPrices, setSavingPrices] = useState(false);
  const [pricesSaved, setPricesSaved] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Computed annual prices
  const annualStandard = Math.round(monthlyPrices.standard * 12 * (1 - discountPct / 100));
  const annualPro = Math.round(monthlyPrices.pro * 12 * (1 - discountPct / 100));

  useEffect(() => {
    fetch("/api/admin/plan-prices")
      .then((r) => r.json())
      .then((data) => {
        if (!data || data.error) return;
        // Load monthly prices
        const sm = data.standard?.monthly || 9000;
        const pm = data.pro?.monthly || 14500;
        const bq = data.business?.quarterly || 25000;
        setMonthlyPrices({ standard: sm, pro: pm, business: bq });
        // Derive discount from Standard annual/monthly ratio
        if (data.standard?.monthly && data.standard?.annual) {
          const derived = Math.round((1 - data.standard.annual / (data.standard.monthly * 12)) * 100);
          setDiscountPct(Math.max(0, Math.min(50, derived)));
        }
      })
      .finally(() => setLoadingPrices(false));
  }, []);

  function handleChange(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSavePrices() {
    setSavingPrices(true);
    try {
      const body = {
        standard: { monthly: monthlyPrices.standard, annual: annualStandard },
        pro:      { monthly: monthlyPrices.pro,      annual: annualPro },
        business: { quarterly: monthlyPrices.business },
      };
      const res = await fetch("/api/admin/plan-prices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setPricesSaved(true);
        setTimeout(() => setPricesSaved(false), 2500);
      }
    } finally {
      setSavingPrices(false);
    }
  }

  function handleSaveSettings() {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2500);
  }

  function fmtFcfa(n) {
    return Math.round(n || 0).toLocaleString("fr-FR") + " FCFA";
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-slate-400 text-sm mt-1">Configuration globale de la plateforme</p>
      </div>

      <div className="space-y-6">

        {/* ── Prix des abonnements ── */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-700 rounded-lg"><CreditCard className="w-5 h-5 text-slate-300" /></div>
              <div>
                <h2 className="text-base font-semibold text-white">Prix des abonnements</h2>
                <p className="text-xs text-slate-400 mt-0.5">Les modifications s&apos;appliquent immédiatement aux nouveaux paiements</p>
              </div>
            </div>
            <button
              onClick={handleSavePrices}
              disabled={savingPrices || loadingPrices}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60 ${pricesSaved ? "bg-green-600 text-white" : "bg-violet-600 hover:bg-violet-700 text-white"}`}
            >
              {savingPrices
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
                : pricesSaved
                ? <><Check className="w-4 h-4" /> Enregistré</>
                : <><Save className="w-4 h-4" /> Enregistrer les prix</>}
            </button>
          </div>

          {loadingPrices ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement...
            </div>
          ) : (
            <>
              {/* Réduction annuelle */}
              <div className="mb-6 p-4 bg-slate-900 rounded-xl border border-violet-500/30">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-violet-400" />
                    <span className="text-sm font-medium text-white">Réduction annuelle</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={discountPct}
                      onChange={(e) => setDiscountPct(Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))}
                      className="w-20 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <span className="text-sm text-slate-400">%</span>
                  </div>
                  <span className="text-xs text-slate-500">S&apos;applique aux plans Standard et Pro uniquement</span>
                </div>
              </div>

              {/* Plans grid */}
              <div className="grid sm:grid-cols-3 gap-5">

                {/* Standard */}
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                  <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-500 inline-block" />
                    Standard
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Mensuel (FCFA)</label>
                      <input
                        type="number" min="0"
                        value={monthlyPrices.standard}
                        onChange={(e) => setMonthlyPrices(p => ({ ...p, standard: parseInt(e.target.value) || 0 }))}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Annuel (FCFA) — calculé automatiquement
                      </label>
                      <div className={READONLY_CLASS}>{fmtFcfa(annualStandard)}</div>
                      <p className="text-xs text-slate-500 mt-1">
                        {fmtFcfa(monthlyPrices.standard)} × 12 − {discountPct}% = {fmtFcfa(Math.round(annualStandard / 12))}/mois
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pro */}
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                  <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
                    Pro
                  </p>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Mensuel (FCFA)</label>
                      <input
                        type="number" min="0"
                        value={monthlyPrices.pro}
                        onChange={(e) => setMonthlyPrices(p => ({ ...p, pro: parseInt(e.target.value) || 0 }))}
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">
                        Annuel (FCFA) — calculé automatiquement
                      </label>
                      <div className={READONLY_CLASS}>{fmtFcfa(annualPro)}</div>
                      <p className="text-xs text-slate-500 mt-1">
                        {fmtFcfa(monthlyPrices.pro)} × 12 − {discountPct}% = {fmtFcfa(Math.round(annualPro / 12))}/mois
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business */}
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                  <p className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    Business
                  </p>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Trimestriel (FCFA)</label>
                    <input
                      type="number" min="0"
                      value={monthlyPrices.business}
                      onChange={(e) => setMonthlyPrices(p => ({ ...p, business: parseInt(e.target.value) || 0 }))}
                      className={INPUT_CLASS}
                    />
                    <p className="text-xs text-slate-500 mt-2">Trimestriel uniquement · Pas d&apos;option annuelle</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Application ── */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-slate-700 rounded-lg"><Globe className="w-5 h-5 text-slate-300" /></div>
            <h2 className="text-base font-semibold text-white">Application</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Nom de l&apos;application</label>
              <input type="text" value={settings.appName} onChange={(e) => handleChange("appName", e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email support</label>
              <input type="email" value={settings.supportEmail} onChange={(e) => handleChange("supportEmail", e.target.value)} className={INPUT_CLASS} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Durée essai gratuit (jours)</label>
              <input type="number" min="1" max="90" value={settings.trialDays} onChange={(e) => handleChange("trialDays", parseInt(e.target.value))} className={INPUT_CLASS} />
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {[
              { key: "allowRegistrations", label: "Ouverture des inscriptions", desc: "Autoriser les nouveaux comptes", color: "bg-violet-600" },
              { key: "maintenanceMode", label: "Mode maintenance", desc: "Bloquer l'accès utilisateurs temporairement", color: "bg-red-600" },
            ].map(({ key, label, desc, color }) => (
              <label key={key} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <button onClick={() => handleChange(key, !settings[key])} className={`relative w-10 h-6 rounded-full transition-colors ${settings[key] ? color : "bg-slate-600"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[key] ? "translate-x-5" : "translate-x-1"}`} />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* ── Notifications ── */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-slate-700 rounded-lg"><Bell className="w-5 h-5 text-slate-300" /></div>
            <h2 className="text-base font-semibold text-white">Notifications admin</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: "newUserAlert", label: "Nouveau compte créé", desc: "Alerter lors d'une inscription" },
              { key: "paymentAlert", label: "Paiement reçu", desc: "Alerter à chaque paiement Bictorys" },
              { key: "expirationAlert", label: "Abonnement expiré", desc: "Alerter quand un abonnement expire" },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <button onClick={() => handleChange(key, !settings[key])} className={`relative w-10 h-6 rounded-full transition-colors ${settings[key] ? "bg-violet-600" : "bg-slate-600"}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[key] ? "translate-x-5" : "translate-x-1"}`} />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* ── Sécurité ── */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-slate-700 rounded-lg"><Shield className="w-5 h-5 text-slate-300" /></div>
            <h2 className="text-base font-semibold text-white">Sécurité</h2>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <p className="text-sm font-medium text-white mb-1">Clés d&apos;API Bictorys</p>
              <p className="text-xs text-slate-400">Configurées via variables d&apos;environnement Netlify</p>
              <p className="text-xs text-slate-500 mt-1">BICTORYS_API_URL · BICTORYS_API_KEY · BICTORYS_WEBHOOK_SECRET · SUPABASE_SERVICE_ROLE_KEY</p>
            </div>
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <p className="text-sm font-medium text-white mb-1">Authentification Supabase</p>
              <p className="text-xs text-slate-400">Gestion des sessions, RLS multi-tenant, politiques d&apos;accès</p>
              <div className="mt-3">
                <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-xs text-violet-400 hover:text-violet-300 underline">
                  Ouvrir le dashboard Supabase →
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${settingsSaved ? "bg-green-600 text-white" : "bg-violet-600 hover:bg-violet-700 text-white"}`}
          >
            {settingsSaved ? <><Check className="w-4 h-4" /> Enregistré</> : <><Save className="w-4 h-4" /> Enregistrer les paramètres</>}
          </button>
        </div>
      </div>
    </div>
  );
}
