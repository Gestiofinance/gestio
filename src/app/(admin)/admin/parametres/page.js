"use client";

import { useState } from "react";
import { Settings, Bell, Shield, Globe, Palette, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminParametresPage() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    appName: "Gestio",
    supportEmail: "support@gestio.sn",
    trialDays: 14,
    maintenanceMode: false,
    allowRegistrations: true,
    emailNotifications: true,
    newUserAlert: true,
    paymentAlert: true,
    expirationAlert: true,
  });

  function handleChange(key, value) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-slate-400 text-sm mt-1">Configuration globale de la plateforme</p>
      </div>

      <div className="space-y-6">
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
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1.5">Email support</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => handleChange("supportEmail", e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
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
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <label className="flex items-center justify-between p-3 bg-slate-900 rounded-lg cursor-pointer">
              <div>
                <p className="text-sm font-medium text-white">Ouverture des inscriptions</p>
                <p className="text-xs text-slate-400 mt-0.5">Autoriser les nouveaux comptes</p>
              </div>
              <button
                onClick={() => handleChange("allowRegistrations", !settings.allowRegistrations)}
                className={`relative w-10 h-6 rounded-full transition-colors ${settings.allowRegistrations ? "bg-violet-600" : "bg-slate-600"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.allowRegistrations ? "translate-x-5" : "translate-x-1"}`} />
              </button>
            </label>

            <label className="flex items-center justify-between p-3 bg-slate-900 rounded-lg cursor-pointer">
              <div>
                <p className="text-sm font-medium text-white">Mode maintenance</p>
                <p className="text-xs text-slate-400 mt-0.5">Bloquer l&apos;accès utilisateurs temporairement</p>
              </div>
              <button
                onClick={() => handleChange("maintenanceMode", !settings.maintenanceMode)}
                className={`relative w-10 h-6 rounded-full transition-colors ${settings.maintenanceMode ? "bg-red-600" : "bg-slate-600"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.maintenanceMode ? "translate-x-5" : "translate-x-1"}`} />
              </button>
            </label>
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
              <p className="text-xs text-slate-400">Configurées via variables d&apos;environnement <code className="text-violet-400">.env.local</code></p>
              <div className="mt-3 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${process.env.NEXT_PUBLIC_APP_URL ? "bg-green-400" : "bg-amber-400"}`} />
                <span className="text-xs text-slate-300">
                  PAYTECH_API_KEY · PAYTECH_API_SECRET · SUPABASE_SERVICE_ROLE_KEY
                </span>
              </div>
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

        {/* Plans */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 bg-slate-700 rounded-lg">
              <Palette className="w-5 h-5 text-slate-300" />
            </div>
            <h2 className="text-base font-semibold text-white">Plans tarifaires actifs</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { name: "Standard", price: "9 000 FCFA/mois", users: "1 utilisateur", invoices: "15 factures/mois" },
              { name: "Pro", price: "14 500 FCFA/mois", users: "Illimité", invoices: "Illimitées" },
              { name: "Business", price: "25 000 FCFA/trim.", users: "Illimité", invoices: "Illimitées" },
            ].map((plan) => (
              <div key={plan.name} className="p-4 bg-slate-900 rounded-xl border border-slate-700">
                <p className="text-sm font-semibold text-white mb-1">{plan.name}</p>
                <p className="text-xs text-violet-400 font-medium mb-2">{plan.price}</p>
                <p className="text-xs text-slate-400">{plan.users}</p>
                <p className="text-xs text-slate-400">{plan.invoices}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">-12% sur tous les plans annuels</p>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${
              saved
                ? "bg-green-600 text-white"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            }`}
          >
            {saved ? (
              <><Check className="w-4 h-4" /> Enregistré</>
            ) : (
              <><Save className="w-4 h-4" /> Enregistrer</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
