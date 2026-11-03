"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useCrud } from "@/hooks/useSupabase";
import {
  Megaphone, Send, Users, Save, Loader2, AlertTriangle, Lock, CheckCircle2,
  ArrowRight, FileText, Trash2, Eye, Pencil, Plus, Sparkles,
} from "lucide-react";
import { ORG_EMAIL_THEMES, ORG_EMAIL_PRESETS } from "@/lib/email/org-presets";
import { wrapWithOrgBranding } from "@/lib/email/org-branding";

const INPUT_CLASS =
  "w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-400";

const CLIENT_STATUS_OPTIONS = [
  { value: "client", label: "Client" },
  { value: "prospect", label: "Prospect" },
  { value: "non_converti", label: "Non converti" },
];

const campaignStatusColors = { brouillon: "default", envoi_en_cours: "warning", envoyee: "success", echec: "danger" };
const campaignStatusLabels = { brouillon: "Brouillon", envoi_en_cours: "Envoi en cours", envoyee: "Envoyée", echec: "Échec" };

const emptyComposer = { name: "", theme: "", subject: "", html: "" };

function themeLabel(key) {
  return ORG_EMAIL_THEMES.find((t) => t.key === key)?.label || key || "—";
}

function UpsellGate() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-primary-500" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2 text-center">Module Marketing réservé au Plan Business</h2>
      <p className="text-sm text-muted text-center max-w-sm mb-6">
        Passez au Plan Business pour envoyer des campagnes email à vos clients, avec filtres et modèles personnalisables.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 items-center mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <CheckCircle2 className="w-4 h-4 text-success-500" /> Jusqu&apos;à 250 emails/mois
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <CheckCircle2 className="w-4 h-4 text-success-500" /> Modèles personnalisables
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <CheckCircle2 className="w-4 h-4 text-success-500" /> Filtres par statut client
        </div>
      </div>
      <Button onClick={() => router.push("/dashboard/abonnement")}>
        Voir les plans <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

export default function MarketingPage() {
  const [access, setAccess] = useState(undefined); // undefined = loading
  const [tab, setTab] = useState("campagnes");
  const [org, setOrg] = useState(null);

  const { data: catalogItems, fetchAll: fetchCatalogItems } = useCrud("catalog_items");

  const [templates, setTemplates] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [deleteTemplate, setDeleteTemplate] = useState(null);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  const [composer, setComposer] = useState(emptyComposer);
  const [statuses, setStatuses] = useState([]);
  const [productIds, setProductIds] = useState([]);

  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [templateEditor, setTemplateEditor] = useState(null); // null fermé, {id?, name, theme, subject, html}
  const [savingTemplateEditor, setSavingTemplateEditor] = useState(false);

  const [showConfirmSend, setShowConfirmSend] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  useEffect(() => {
    loadAccess();
    loadTemplates();
    loadCampaigns();
    loadOrg();
    fetchCatalogItems({ filters: [["is_active", "eq", true]], order: { column: "name", ascending: true } });
  }, [fetchCatalogItems]);

  async function loadOrg() {
    try {
      const res = await fetch("/api/settings/org");
      const data = await res.json();
      setOrg(data.org || null);
    } catch {}
  }

  async function loadAccess() {
    try {
      const res = await fetch("/api/marketing/access");
      const data = await res.json();
      setAccess(res.ok ? data : { allowed: false });
    } catch {
      setAccess({ allowed: false });
    }
  }

  async function loadTemplates() {
    try {
      const res = await fetch("/api/marketing/templates");
      const data = await res.json();
      setTemplates(data.templates || []);
    } catch {}
  }

  async function loadCampaigns() {
    setLoadingCampaigns(true);
    try {
      const res = await fetch("/api/marketing/campaigns");
      const data = await res.json();
      setCampaigns(data.campaigns || []);
    } catch {}
    setLoadingCampaigns(false);
  }

  function loadPreset(themeKey) {
    if (themeKey === "custom") {
      setComposer((c) => ({ ...c, theme: "custom", subject: "", html: "" }));
      return;
    }
    const preset = ORG_EMAIL_PRESETS[themeKey];
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

  const filters = useMemo(() => ({ statuses, productIds }), [statuses, productIds]);

  async function handlePreviewRecipients() {
    setPreviewing(true);
    try {
      const res = await fetch("/api/marketing/recipients", {
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
      const res = await fetch("/api/marketing/templates", {
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

  function openNewTemplate() {
    setTemplateEditor({ name: "", theme: "", subject: "", html: "" });
  }

  function openEditTemplate(t) {
    setTemplateEditor({ id: t.id, name: t.name, theme: t.theme || "", subject: t.subject, html: t.html_body });
  }

  async function handleSaveTemplateEditor() {
    setSavingTemplateEditor(true);
    try {
      const url = templateEditor.id ? `/api/marketing/templates/${templateEditor.id}` : "/api/marketing/templates";
      const method = templateEditor.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: templateEditor.theme || null, name: templateEditor.name, subject: templateEditor.subject, html: templateEditor.html }),
      });
      if (res.ok) {
        setTemplateEditor(null);
        loadTemplates();
      }
    } finally {
      setSavingTemplateEditor(false);
    }
  }

  // t = modèle enregistré ({id, theme, name, subject, html_body}) ou prédéfini ({key, name, subject, html})
  function applyTemplateToComposer(t) {
    setComposer((c) => ({
      ...c,
      theme: t.theme ?? t.key ?? "custom",
      name: c.name || t.name,
      subject: t.subject,
      html: t.html ?? t.html_body,
    }));
    setTab("campagnes");
  }

  async function handleDeleteTemplate() {
    if (!deleteTemplate) return;
    try {
      await fetch(`/api/marketing/templates/${deleteTemplate.id}`, { method: "DELETE" });
      setDeleteTemplate(null);
      loadTemplates();
    } catch {}
  }

  async function handleSend() {
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...composer, filters }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue");
      setShowConfirmSend(false);
      setComposer(emptyComposer);
      setStatuses([]);
      setProductIds([]);
      setPreview(null);
      loadCampaigns();
      loadAccess();
    } catch (e) {
      setSendError(e.message);
    } finally {
      setSending(false);
    }
  }

  const canSend = composer.name.trim() && composer.subject.trim() && composer.html.trim();
  const quota = access?.quota;
  const dailyExhausted = quota && quota.dailyUsed >= quota.dailyLimit;

  return (
    <div>
      <Header title="Marketing" />
      <div className="p-4 sm:p-6 space-y-6">
        {access === undefined ? (
          <div className="text-center py-12 text-muted">Chargement...</div>
        ) : !access.allowed ? (
          <Card><UpsellGate /></Card>
        ) : (
          <>
            {!access.hasResendKey && (
              <div className="flex items-start gap-3 p-4 bg-warning-50 border border-warning-200 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-warning-500 shrink-0 mt-0.5" />
                <p className="text-sm text-warning-700">L&apos;envoi d&apos;emails n&apos;est pas encore configuré. Contactez le support.</p>
              </div>
            )}

            {/* Quota */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="p-4">
                <p className="text-xs text-muted">Envois aujourd&apos;hui</p>
                <p className="text-lg font-bold text-foreground">{quota?.dailyUsed ?? 0} / {quota?.dailyLimit ?? 1}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted">Emails ce mois-ci</p>
                <p className="text-lg font-bold text-foreground">{quota?.monthlyUsed ?? 0} / {quota?.monthlyLimit ?? 250}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted">Max par envoi</p>
                <p className="text-lg font-bold text-foreground">{quota?.recipientLimit ?? 100}</p>
              </Card>
            </div>

            {/* Onglets */}
            <div className="flex gap-1 border-b border-slate-200">
              {[
                { value: "campagnes", label: "Campagnes", icon: Megaphone },
                { value: "modeles", label: "Modèles", icon: FileText },
              ].map((t) => (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                    tab === t.value ? "border-primary-500 text-foreground" : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </div>

            {tab === "campagnes" && (
              <>
                {dailyExhausted && (
                  <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-slate-600">Vous avez déjà envoyé une campagne aujourd&apos;hui — réessayez demain (1 envoi/jour maximum).</p>
                  </div>
                )}

                <Card className="p-5 space-y-5">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-primary-500" />
                    <h3 className="font-semibold text-foreground">Nouvelle campagne</h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input label="Nom de la campagne" value={composer.name} onChange={(e) => setComposer({ ...composer, name: e.target.value })} placeholder="Ex: Promo novembre" />
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Thématique (modèle prédéfini)</label>
                      <select value={composer.theme} onChange={(e) => e.target.value && loadPreset(e.target.value)} className={INPUT_CLASS}>
                        <option value="">— Choisir une thématique —</option>
                        {ORG_EMAIL_THEMES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {templates.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Ou charger un de vos modèles enregistrés</label>
                      <select defaultValue="" onChange={(e) => e.target.value && loadSavedTemplate(e.target.value)} className={INPUT_CLASS}>
                        <option value="">— Choisir un modèle —</option>
                        {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                  )}

                  <Input label="Objet de l'email" value={composer.subject} onChange={(e) => setComposer({ ...composer, subject: e.target.value })} placeholder="Objet — {{prenom}} et {{entreprise}} disponibles" />

                  <div className="grid lg:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Message — balises {"{{prenom}}"} / {"{{entreprise}}"}</label>
                      <RichTextEditor
                        value={composer.html}
                        onChange={(html) => setComposer((c) => ({ ...c, html }))}
                        placeholder="Bonjour {{prenom}}..."
                        minHeight={220}
                      />
                      <p className="text-xs text-muted mt-1.5">Le logo de votre entreprise (s&apos;il est défini) et vos coordonnées sont ajoutés automatiquement en en-tête et pied de page.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Aperçu</label>
                      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden h-[calc(100%-26px)] min-h-[260px]">
                        <div
                          className="p-2 overflow-auto h-full"
                          dangerouslySetInnerHTML={{
                            __html: composer.html
                              ? wrapWithOrgBranding(composer.html, org)
                              : "<p style='color:#94a3b8;font-family:sans-serif;padding:16px'>L'aperçu s'affichera ici.</p>",
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Filtrer les destinataires (laisser vide = tous vos clients)</p>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-muted mb-2">Statut</p>
                        <div className="flex flex-wrap gap-2">
                          {CLIENT_STATUS_OPTIONS.map((s) => (
                            <button
                              key={s.value}
                              onClick={() => toggleValue(statuses, setStatuses, s.value)}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${statuses.includes(s.value) ? "bg-primary-500 border-primary-500 text-white" : "border-slate-300 text-slate-600 hover:border-slate-400"}`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-muted mb-2">Produit / service intéressé</p>
                        <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                          {catalogItems.length === 0 ? (
                            <span className="text-xs text-muted">Aucun produit dans le catalogue</span>
                          ) : catalogItems.map((p) => (
                            <button
                              key={p.id}
                              onClick={() => toggleValue(productIds, setProductIds, p.id)}
                              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${productIds.includes(p.id) ? "bg-primary-500 border-primary-500 text-white" : "border-slate-300 text-slate-600 hover:border-slate-400"}`}
                            >
                              {p.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button variant="secondary" onClick={handlePreviewRecipients} disabled={previewing}>
                      {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                      Aperçu destinataires
                    </Button>
                    {preview && (
                      <span className={`text-sm ${preview.count > (quota?.recipientLimit ?? 100) ? "text-danger-500 font-medium" : "text-muted"}`}>
                        {preview.count} destinataire{preview.count > 1 ? "s" : ""}{preview.count > (quota?.recipientLimit ?? 100) ? ` — max ${quota?.recipientLimit}` : ""}
                      </span>
                    )}

                    <div className="flex-1" />

                    <Button variant="secondary" onClick={() => setShowSaveTemplate(true)} disabled={!composer.subject.trim() || !composer.html.trim()}>
                      <Save className="w-4 h-4" /> Enregistrer comme modèle
                    </Button>
                    <Button onClick={() => setShowConfirmSend(true)} disabled={!canSend || dailyExhausted || !access.hasResendKey}>
                      <Send className="w-4 h-4" /> Envoyer la campagne
                    </Button>
                  </div>
                </Card>

                <Card>
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-foreground">Vos campagnes envoyées</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted border-b border-slate-100">
                          <th className="px-4 py-2 font-medium">Nom</th>
                          <th className="px-4 py-2 font-medium">Destinataires</th>
                          <th className="px-4 py-2 font-medium">Envoyés</th>
                          <th className="px-4 py-2 font-medium">Statut</th>
                          <th className="px-4 py-2 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loadingCampaigns ? (
                          <tr><td colSpan={5} className="text-center py-8 text-muted">Chargement...</td></tr>
                        ) : campaigns.length === 0 ? (
                          <tr><td colSpan={5} className="text-center py-8 text-muted">Aucune campagne envoyée</td></tr>
                        ) : campaigns.map((c) => (
                          <tr key={c.id} className="border-b border-slate-50 last:border-0">
                            <td className="px-4 py-2.5 font-medium text-foreground">{c.name}</td>
                            <td className="px-4 py-2.5 text-slate-600">{c.recipient_count}</td>
                            <td className="px-4 py-2.5 text-success-600">{c.sent_count}</td>
                            <td className="px-4 py-2.5"><Badge variant={campaignStatusColors[c.status]}>{campaignStatusLabels[c.status]}</Badge></td>
                            <td className="px-4 py-2.5 text-slate-500">{new Date(c.sent_at || c.created_at).toLocaleDateString("fr-FR")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </>
            )}

            {tab === "modeles" && (
              <>
                <Card>
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-foreground flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary-500" /> Modèles prédéfinis</h3>
                    <p className="text-xs text-muted mt-0.5">Prêts à l&apos;emploi, vous pouvez les utiliser tels quels ou les personnaliser dans le composeur.</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {ORG_EMAIL_THEMES.filter((t) => t.key !== "custom").map((t) => {
                      const preset = ORG_EMAIL_PRESETS[t.key];
                      return (
                        <div key={t.key} className="flex items-start justify-between gap-4 p-4">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground">{t.label}</p>
                            <p className="text-xs text-muted mt-1 truncate">{preset?.subject}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setPreviewTemplate({ name: t.label, subject: preset?.subject, html_body: preset?.html })} className="p-2 rounded-lg hover:bg-slate-100" title="Aperçu"><Eye className="w-4 h-4 text-slate-500" /></button>
                            <Button size="sm" variant="secondary" onClick={() => applyTemplateToComposer({ key: t.key, name: t.label, subject: preset?.subject, html: preset?.html })}>Utiliser</Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100">
                    <div>
                      <h3 className="font-semibold text-foreground">Vos modèles</h3>
                      <p className="text-xs text-muted mt-0.5">Vos modèles personnalisés, créés depuis zéro ou enregistrés depuis le composeur.</p>
                    </div>
                    <Button size="sm" onClick={openNewTemplate}><Plus className="w-4 h-4" /> Nouveau modèle</Button>
                  </div>
                  {templates.length === 0 ? (
                    <p className="text-center py-10 text-muted text-sm">Aucun modèle personnalisé pour le moment.</p>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {templates.map((t) => (
                        <div key={t.id} className="flex items-start justify-between gap-4 p-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-medium text-foreground">{t.name}</p>
                              {t.theme && <Badge>{themeLabel(t.theme)}</Badge>}
                            </div>
                            <p className="text-xs text-muted mt-1 truncate">{t.subject}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => setPreviewTemplate(t)} className="p-2 rounded-lg hover:bg-slate-100" title="Aperçu"><Eye className="w-4 h-4 text-slate-500" /></button>
                            <button onClick={() => openEditTemplate(t)} className="p-2 rounded-lg hover:bg-slate-100" title="Modifier"><Pencil className="w-4 h-4 text-slate-500" /></button>
                            <button onClick={() => setDeleteTemplate(t)} className="p-2 rounded-lg hover:bg-danger-50" title="Supprimer"><Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-500" /></button>
                            <Button size="sm" variant="secondary" onClick={() => applyTemplateToComposer(t)}>Utiliser</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}
          </>
        )}
      </div>

      {/* Aperçu modèle */}
      <Modal open={!!previewTemplate} onClose={() => setPreviewTemplate(null)} title={previewTemplate?.name || ""} size="md">
        {previewTemplate && (
          <div className="bg-white border border-slate-200 rounded-lg overflow-auto max-h-[60vh]">
            <div className="p-2" dangerouslySetInnerHTML={{ __html: wrapWithOrgBranding(previewTemplate.html_body, org) }} />
          </div>
        )}
      </Modal>

      {/* Confirmation suppression modèle */}
      <Modal open={!!deleteTemplate} onClose={() => setDeleteTemplate(null)} title="Supprimer ce modèle ?" size="sm">
        <p className="text-sm text-muted mb-6">« {deleteTemplate?.name} » sera définitivement supprimé.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTemplate(null)}>Annuler</Button>
          <Button variant="danger" onClick={handleDeleteTemplate}>Supprimer</Button>
        </div>
      </Modal>

      {/* Modal enregistrer modèle */}
      <Modal open={showSaveTemplate} onClose={() => setShowSaveTemplate(false)} title="Enregistrer comme modèle" size="sm">
        <div className="space-y-4">
          <Input label="Nom du modèle" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Ex: Promo mensuelle" />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowSaveTemplate(false)}>Annuler</Button>
            <Button onClick={handleSaveTemplate} disabled={savingTemplate || !templateName.trim()}>
              {savingTemplate ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Créer / modifier un modèle */}
      <Modal open={!!templateEditor} onClose={() => setTemplateEditor(null)} title={templateEditor?.id ? "Modifier le modèle" : "Nouveau modèle"} size="lg">
        {templateEditor && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Nom du modèle" value={templateEditor.name} onChange={(e) => setTemplateEditor({ ...templateEditor, name: e.target.value })} placeholder="Ex: Relance devis" />
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Thématique (optionnel)</label>
                <select value={templateEditor.theme} onChange={(e) => setTemplateEditor({ ...templateEditor, theme: e.target.value })} className={INPUT_CLASS}>
                  <option value="">— Aucune —</option>
                  {ORG_EMAIL_THEMES.filter((t) => t.key !== "custom").map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <Input label="Objet de l'email" value={templateEditor.subject} onChange={(e) => setTemplateEditor({ ...templateEditor, subject: e.target.value })} placeholder="Objet — {{prenom}} et {{entreprise}} disponibles" />
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Message — balises {"{{prenom}}"} / {"{{entreprise}}"}</label>
              <RichTextEditor
                value={templateEditor.html}
                onChange={(html) => setTemplateEditor((t) => ({ ...t, html }))}
                placeholder="Bonjour {{prenom}}..."
                minHeight={200}
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setTemplateEditor(null)}>Annuler</Button>
              <Button
                onClick={handleSaveTemplateEditor}
                disabled={savingTemplateEditor || !templateEditor.name.trim() || !templateEditor.subject.trim() || !templateEditor.html.trim()}
              >
                {savingTemplateEditor ? "Enregistrement..." : templateEditor.id ? "Enregistrer les modifications" : "Créer le modèle"}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation envoi */}
      <Modal open={showConfirmSend} onClose={() => !sending && setShowConfirmSend(false)} title="Confirmer l'envoi" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Cette campagne sera envoyée à {preview ? `${preview.count} destinataire${preview.count > 1 ? "s" : ""}` : "tous les destinataires correspondant aux filtres"}. Cette action est irréversible et compte dans votre quota mensuel.
          </p>
          {sendError && <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg">{sendError}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowConfirmSend(false)} disabled={sending}>Annuler</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? "Envoi..." : <><Send className="w-4 h-4" /> Envoyer</>}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
