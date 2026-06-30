"use client";

import { useState, useEffect } from "react";
import { Settings, Bell, Shield, Globe, CreditCard, Save, Check, Loader2 } from "lucide-react";

const INPUT_CLASS =
  "w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

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

  const [prices, setPrices] = useState({
    standard: { monthly: 9000, annual: 95040 },
    pro:      { monthly: 14500, annual: 153120 },
    business: { quarterly: 25000 },
  });

  const [loadingPrices, setLoadingPrices] = useState(true);
  const [savingPrices, setSavingPrices] = useState(false);
  const [pricesSaved, setPricesSaved] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/plan-prices")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) setPrices(data);
      })
      .finally(() => setLoadingPrices(false));
  }, []);

  function handleChange(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function updatePrice(plan, cycle, value) {
    setPrices((prev) => ({
      ...prev,
      [plan]: { ...prev[plan], [cycle]: parseInt(value) || 0 },
    }));
  }

  async function handleSavePrices() {
    setSavingPrices(true);
    try {
      const res = await fetch("/api/admin/plan-prices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prices),
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

  const annualDiscount = prices.standard?.monthly && prices.standard?.annual
    ? Math.round((1 - prices.standard.annual / (prices.standard.monthly * 12)) * 100)
    : 12;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-slate-400 text-sm mt-1">Configuration globale de la plateforme</p>
      </div>

      <div className="space-y-6">
        {/* Prix des abonnements */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-700 rounded-lg">
                <CreditCard className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Prix des abonnements</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Les modifications s&apos;appliquent immédiatement aux nouveaux paiements
                </p>
              </div>
            </div>
            <button
              onClick={handleSavePrices}
              disabled={savingPrices || loadingPrices}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60 ${
                pricesSaved ? "bg-green-600 text-white" : "bg-violet-600 hover:bg-violet-700 text-white"
              }`}
            >
              {savingPrices ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</>
              ) : pricesSaved ? (
                <><Check className="w-4 h-4" /> Enregistré</>
              ) : (
                <><Save className="w-4 h-4" /> Enregistrer les prix</>
              )}
            </button>
          </div>

          {loadingPrices ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Chargement des prix...
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-5">
              {/* Standard */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                <p className="text-sm font-bold text-white mb-4">Standard</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Mensuel (FCFA)</label>
                    <input
                      type="number"
                      min="0"
                      value={prices.standard?.monthly ?? ""}
                      onChange={(e) => updatePrice("standard", "monthly", e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Annuel (FCFA){" "}
                      <span className="text-green-400">−{annualDiscount}%</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={prices.standard?.annual ?? ""}
                      onChange={(e) => updatePrice("standard", "annual", e.target.value)}
                      className={INPUT_CLASS}
                    />
                    {prices.standard?.annual && prices.standard?.monthly > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        ≈ {Math.round(prices.standard.annual / 12).toLocaleString("fr-FR")} FCFA/mois
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pro */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                <p className="text-sm font-bold text-white mb-4">Pro</p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Mensuel (FCFA)</label>
                    <input
                      type="number"
                      min="0"
                      value={prices.pro?.monthly ?? ""}
                      onChange={(e) => updatePrice("pro", "monthly", e.target.value)}
                      className={INPUT_CLASS}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Annuel (FCFA){" "}
                      <span className="text-green-400">−{annualDiscount}%</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={prices.pro?.annual ?? ""}
                      onChange={(e) => updatePrice("pro", "annual", e.target.value)}
                      className={INPUT_CLASS}
                    />
                    {prices.pro?.annual && prices.pro?.monthly > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        ≈ {Math.round(prices.pro.annual / 12).toLocaleString("fr-FR")} FCFA/mois
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Business */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
                <p className="text-sm font-bold text-white mb-4">Business</p>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Trimestriel (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    value={prices.business?.quarterly ?? ""}
                    onChange={(e) => updatePrice("business", "quarterly", e.target.value)}
                    className={INPUT_CLASS}
                  />
                  <p className="text-xs text-slate-500 mt-2">Plan trimestriel uniquement (pas d&apos;annuel)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* App settings */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Globe className="w-5 h-5 text-slate-300" />
            </div>
            <h2 className="text-base font-semibold text-white">Application</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Nom de l&apos;application</label>
              <input
                type="text"
                value={settings.appName}
                onChange={(e) => handleChange("appName", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email support</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleChange("supportEmail", e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Durée essai gratuit (jours)</label>
              <input
                type="number"
                min="1"
                max="90"
                value={settings.trialDays}
                onChange={(e) => handleChange("trialDays", parseInt(e.target.value))}
                className={INPUT_CLASS}
              />
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
                <button
                  onClick={() => handleChange(key, !settings[key])}
                  className={`relative w-10 h-6 rounded-full transition-colors ${settings[key] ? color : "bg-slate-600"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[key] ? "translate-x-5" : "translate-x-1"}`} />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Bell className="w-5 h-5 text-slate-300" />
            </div>
            <h2 className="text-base font-semibold text-white">Notifications admin</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: "newUserAlert", label: "Nouveau compte créé", desc: "Alerter lors d'une inscription" },
              { key: "paymentAlert", label: "Paiement reçu", desc: "Alerter à chaque paiement PayTech" },
              { key: "expirationAlert", label: "Abonnement expiré", desc: "Alerter quand un abonnement expire" },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-white">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                </div>
                <button
                  onClick={() => handleChange(key, !settings[key])}
                  className={`relative w-10 h-6 rounded-full transition-colors ${settings[key] ? "bg-violet-600" : "bg-slate-600"}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings[key] ? "translate-x-5" : "translate-x-1"}`} />
                </button>
              </label>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Shield className="w-5 h-5 text-slate-300" />
            </div>
            <h2 className="text-base font-semibold text-white">Sécurité</h2>
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <p className="text-sm font-medium text-white mb-1">Clés d&apos;API PayTech</p>
              <p className="text-xs text-slate-400">Configurées via variables d&apos;environnement Netlify</p>
              <p className="text-xs text-slate-500 mt-1">PAYTECH_API_KEY · PAYTECH_API_SECRET · SUPABASE_SERVICE_ROLE_KEY</p>
            </div>
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <p className="text-sm font-medium text-white mb-1">Authentification Supabase</p>
              <p className="text-xs text-slate-400">Gestion des sessions, RLS multi-tenant, politiques d&apos;accès</p>
              <div className="mt-3">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-violet-400 hover:text-violet-300 underline"
                >
                  Ouvrir le dashboard Supabase →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Save settings */}
        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              settingsSaved ? "bg-green-600 text-white" : "bg-violet-600 hover:bg-violet-700 text-white"
            }`}
          >
            {settingsSaved ? (
              <><Check className="w-4 h-4" /> Enregistré</>
            ) : (
              <><Save className="w-4 h-4" /> Enregistrer les paramètres</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
