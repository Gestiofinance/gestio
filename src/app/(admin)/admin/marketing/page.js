"use client";

import { useState, useEffect, useMemo } from "react";
import { formatShortDate } from "@/lib/utils";
import { EMAIL_THEMES, EMAIL_PRESETS } from "@/lib/email/presets";
import {
  Mail, Send, Users, Save, Check, Loader2, AlertTriangle, X, Bell,
} from "lucide-react";

const INPUT_CLASS =
  "w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent";

const STATUS_OPTIONS = [
  { value: "trial", label: "Essai" },
  { value: "trial_expired", label: "Essai expiré" },
  { value: "active", label: "Actif" },
  { value: "past_due", label: "En retard" },
  { value: "suspended", label: "Suspendu" },
  { value: "cancelled", label: "Annulé" },
  { value: "sans_abonnement", label: "Sans abonnement" },
];

const PLAN_OPTIONS = [
  { value: "standard", label: "Standard" },
  { value: "pro", label: "Pro" },
  { value: "business", label: "Business" },
  { value: "none", label: "Aucun" },
];

const campaignStatusColors = {
  brouillon: "text-slate-400 bg-slate-700 border-slate-600",
  envoi_en_cours: "text-warning-400 bg-warning-400/10 border-warning-400/20",
  envoyee: "text-success-400 bg-success-400/10 border-success-400/20",
  echec: "text-danger-400 bg-danger-400/10 border-danger-400/20",
};
const campaignStatusLabels = {
  brouillon: "Brouillon", envoi_en_cours: "Envoi en cours", envoyee: "Envoyée", echec: "Échec",
};

const emptyComposer = { name: "", theme: "", subject: "", html: "" };

export default function AdminMarketingPage() {
  const [adminNotifyEmail, setAdminNotifyEmail] = useState("");
  const [hasResendKey, setHasResendKey] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);

  const [composer, setComposer] = useState(emptyComposer);
  const [statuses, setStatuses] = useState([]);
  const [plans, setPlans] = useState([]);

  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    loadSettings();
    loadTemplates();
    loadCampaigns();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch("/api/admin/marketing/settings");
      const data = await res.json();
      if (res.ok) {
        setAdminNotifyEmail(data.adminNotifyEmail);
        setHasResendKey(data.hasResendKey);
      }
    } catch {}
  }

  async function loadTemplates() {
    try {
      const res = await fetch("/api/admin/marketing/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {}
  }

  async function loadCampaigns() {
    setLoadingCampaigns(true);
    try {
      const res = await fetch("/api/admin/marketing/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch {}
    setLoadingCampaigns(false);
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      await fetch("/api/admin/marketing/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotifyEmail }),
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } finally {
      setSavingSettings(false);
    }
  }

  function loadPreset(themeKey) {
    const preset = EMAIL_PRESETS[themeKey];
    setComposer((c) => ({
      ...c,
      theme: themeKey,
      name: c.name || preset?.name || "",
      subject: preset?.subject || c.subject,
      html: preset?.html || c.html,
    }));
  }

  function loadSavedTemplate(id) {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setComposer((c) => ({ ...c, name: c.name || tpl.name, theme: tpl.theme || c.theme, subject: tpl.subject, html: tpl.html_body }));
  }

  function toggleValue(list, setList, value) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  const filters = useMemo(() => ({ statuses, plans }), [statuses, plans]);

  async function handlePreviewRecipients() {
    setPreviewing(true);
    try {
      const res = await fetch("/api/admin/marketing/recipients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters }),
      });
      const data = await res.json();
      if (res.ok) setPreview(data);
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSaveTemplate() {
    setSavingTemplate(true);
    try {
      const res = await fetch("/api/admin/marketing/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: composer.theme, name: templateName, subject: composer.subject, html: composer.html }),
      });
      if (res.ok) {
        setShowSaveTemplate(false);
        setTemplateName("");
        loadTemplates();
      }
    } finally {
      setSavingTemplate(false);
    }
  }

  async function handleSend() {
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/admin/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...composer, filters }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue");
      setShowConfirmSend(false);
      setComposer(emptyComposer);
      setStatuses([]);
      setPlans([]);
      setPreview(null);
      loadCampaigns();
    } catch (e) {
      setSendError(e.message);
    } finally {
      setSending(false);
    }
  }

  const canSend = composer.name.trim() && composer.subject.trim() && composer.html.trim();

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white">Marketing</h1>
        <p className="text-slate-400 text-sm mt-1">Campagnes d&apos;emailing et notifications automatiques (via Resend)</p>
      </div>

      {!hasResendKey && (
        <div className="flex items-start gap-3 p-4 bg-warning-400/10 border border-warning-400/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-warning-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-warning-400">Clé API Resend non configurée</p>
            <p className="text-xs text-slate-400 mt-0.5">Ajoutez <span className="font-mono">RESEND_API_KEY</span> (et optionnellement <span className="font-mono">RESEND_FROM_EMAIL</span>) dans les variables d&apos;environnement pour pouvoir envoyer des emails.</p>
          </div>
        </div>
      )}

      {/* Notifications automatiques */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-slate-700 rounded-lg"><Bell className="w-5 h-5 text-slate-300" /></div>
          <div>
            <h2 className="text-base font-semibold text-white">Notifications automatiques</h2>
            <p className="text-xs text-slate-400 mt-0.5">Un email vous est envoyé à cette adresse à chaque nouvelle inscription, paiement reçu, ticket support ou demande de retrait d&apos;affiliation.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email" value={adminNotifyEmail} onChange={(e) => setAdminNotifyEmail(e.target.value)}
            placeholder="vous@gestio.sn" className={`${INPUT_CLASS} sm:flex-1`}
          />
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className={`flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-60 ${settingsSaved ? "bg-green-600 text-white" : "bg-violet-600 hover:bg-violet-700 text-white"}`}
          >
            {savingSettings ? <><Loader2 className="w-4 h-4 animate-spin" /> ...</> : settingsSaved ? <><Check className="w-4 h-4" /> Enregistré</> : <><Save className="w-4 h-4" /> Enregistrer</>}
          </button>
        </div>
      </div>

      {/* Composeur de campagne */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-slate-700 rounded-lg"><Mail className="w-5 h-5 text-slate-300" /></div>
          <h2 className="text-base font-semibold text-white">Nouvelle campagne</h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Nom de la campagne</label>
            <input
              type="text" value={composer.name} onChange={(e) => setComposer({ ...composer, name: e.target.value })}
              placeholder="Ex: Relance essais octobre" className={INPUT_CLASS}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Thématique (modèle prédéfini)</label>
            <select value={composer.theme} onChange={(e) => e.target.value && loadPreset(e.target.value)} className={INPUT_CLASS}>
              <option value="">— Choisir une thématique —</option>
              {EMAIL_THEMES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {templates.length > 0 && (
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Ou charger un modèle enregistré</label>
            <select defaultValue="" onChange={(e) => e.target.value && loadSavedTemplate(e.target.value)} className={INPUT_CLASS}>
              <option value="">— Choisir un modèle enregistré —</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
        )}

        <div className="mb-5">
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Objet de l&apos;email</label>
          <input
            type="text" value={composer.subject} onChange={(e) => setComposer({ ...composer, subject: e.target.value })}
            placeholder="Objet — {{prenom}} et {{entreprise}} disponibles" className={INPUT_CLASS}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-5 mb-5">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Contenu (HTML) — balises {"{{prenom}}"} / {"{{entreprise}}"}</label>
            <textarea
              value={composer.html} onChange={(e) => setComposer({ ...composer, html: e.target.value })}
              rows={14} placeholder="<p>Bonjour {{prenom}}...</p>"
              className={`${INPUT_CLASS} font-mono text-xs resize-y`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1.5">Aperçu</label>
            <div className="bg-white rounded-lg overflow-hidden h-[calc(100%-26px)] min-h-[280px]">
              <div className="p-2 overflow-auto h-full" dangerouslySetInnerHTML={{ __html: composer.html || "<p style='color:#94a3b8;font-family:sans-serif;padding:16px'>L'aperçu s'affichera ici.</p>" }} />
            </div>
          </div>
        </div>

        {/* Filtres destinataires */}
        <div className="mb-5">
          <p className="text-sm font-medium text-slate-400 mb-2">Filtrer les destinataires (laisser vide = tous)</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-xs text-slate-500 mb-2">Statut d&apos;abonnement</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => toggleValue(statuses, setStatuses, s.value)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${statuses.includes(s.value) ? "bg-violet-600 border-violet-600 text-white" : "border-slate-600 text-slate-400 hover:text-white"}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg">
              <p className="text-xs text-slate-500 mb-2">Plan</p>
              <div className="flex flex-wrap gap-2">
                {PLAN_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => toggleValue(plans, setPlans, p.value)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${plans.includes(p.value) ? "bg-violet-600 border-violet-600 text-white" : "border-slate-600 text-slate-400 hover:text-white"}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handlePreviewRecipients}
            disabled={previewing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-60"
          >
            {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            Aperçu destinataires
          </button>
          {preview && <span className="text-sm text-slate-400">{preview.count} destinataire{preview.count > 1 ? "s" : ""}</span>}

          <div className="flex-1" />

          <button
            onClick={() => setShowSaveTemplate(true)}
            disabled={!composer.subject.trim() || !composer.html.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-40"
          >
            <Save className="w-4 h-4" /> Enregistrer comme modèle
          </button>
          <button
            onClick={() => setShowConfirmSend(true)}
            disabled={!canSend || !hasResendKey}
            className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40"
          >
            <Send className="w-4 h-4" /> Envoyer la campagne
          </button>
        </div>
      </div>

      {/* Historique */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700">
          <h2 className="text-base font-semibold text-white">Campagnes envoyées</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Nom</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Destinataires</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Envoyés</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Échecs</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Statut</th>
                <th className="text-left text-xs font-medium text-slate-400 px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {loadingCampaigns ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm">Chargement...</td></tr>
              ) : campaigns.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500 text-sm">Aucune campagne envoyée</td></tr>
              ) : campaigns.map((c) => (
                <tr key={c.id} className="border-b border-slate-700/50">
                  <td className="px-6 py-3 text-sm text-white">{c.name}</td>
                  <td className="px-6 py-3 text-sm text-slate-300">{c.recipient_count}</td>
                  <td className="px-6 py-3 text-sm text-success-400">{c.sent_count}</td>
                  <td className="px-6 py-3 text-sm text-danger-400">{c.failed_count || 0}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex text-xs font-medium px-2 py-0.5 rounded-full border ${campaignStatusColors[c.status]}`}>
                      {campaignStatusLabels[c.status]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-slate-500">{c.sent_at ? formatShortDate(c.sent_at) : formatShortDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal enregistrer modèle */}
      {showSaveTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => setShowSaveTemplate(false)} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Enregistrer comme modèle</h3>
              <button onClick={() => setShowSaveTemplate(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <input
              type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Nom du modèle" className={`${INPUT_CLASS} mb-4`}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowSaveTemplate(false)} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600">Annuler</button>
              <button
                onClick={handleSaveTemplate}
                disabled={savingTemplate || !templateName.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {savingTemplate ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation envoi */}
      {showConfirmSend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60" onClick={() => !sending && setShowConfirmSend(false)} />
          <div className="relative bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-sm mx-4 p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-5 h-5 text-warning-400" />
              <h3 className="text-lg font-bold text-white">Confirmer l&apos;envoi</h3>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Cette campagne sera envoyée à {preview ? `${preview.count} destinataire${preview.count > 1 ? "s" : ""}` : "tous les destinataires correspondant aux filtres"}. Cette action est irréversible.
            </p>
            {sendError && <p className="text-sm text-danger-400 bg-danger-400/10 border border-danger-400/20 rounded-lg px-3 py-2 mb-4">{sendError}</p>}
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirmSend(false)} disabled={sending} className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-60">Annuler</button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-60"
              >
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> Envoi...</> : <><Send className="w-4 h-4" /> Envoyer</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
