"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCrud } from "@/hooks/useSupabase";
import { formatCurrency } from "@/lib/utils";
import {
  Building2, FileText, CreditCard, Palette, Save, Plus, Pencil, Trash2, Check, Upload, X, Image as ImageIcon, Stamp,
} from "lucide-react";

const emptyProduct = { name: "", description: "", unit_price: "", tax_rate: "18", unit: "unité", type: "service" };

const DEFAULT_ORG = {
  name: "", ninea: "", rccm: "", address: "", city: "", country: "Sénégal",
  phone: "", email: "", website: "", tax_rate: "18", currency: "XOF",
  invoice_prefix: "FAC", quote_prefix: "DEV", bank_name: "", bank_account: "",
  bank_iban: "", mobile_money: "", conditions_generales: "",
};

export default function ParametresPage() {
  const { data: catalog, fetchAll: fetchCatalog, create, update, remove } = useCrud("catalog_items");

  const [tab, setTab] = useState("entreprise");
  const [orgId, setOrgId] = useState(null);
  const [orgForm, setOrgForm] = useState(DEFAULT_ORG);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showProduct, setShowProduct] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [pdfTemplate, setPdfTemplate] = useState("moderne");
  const [brandColor, setBrandColor] = useState("#5E5CE6");
  const [logoUrl, setLogoUrl] = useState("");
  const [stampUrl, setStampUrl] = useState("");
  const [uploading, setUploading] = useState({ logo: false, stamp: false });

  // Load org data from server API (bypasses RLS)
  useEffect(() => {
    fetch("/api/settings/org")
      .then(r => r.json())
      .then(({ org }) => {
        if (!org) return;
        setOrgId(org.id);
        setOrgForm({
          name: org.name || "", ninea: org.ninea || "", rccm: org.rccm || "",
          address: org.address || "", city: org.city || "", country: org.country || "Sénégal",
          phone: org.phone || "", email: org.email || "", website: org.website || "",
          tax_rate: String(org.tax_rate || 18), currency: org.currency || "XOF",
          invoice_prefix: org.invoice_prefix || "FAC", quote_prefix: org.quote_prefix || "DEV",
          bank_name: org.bank_name || "", bank_account: org.bank_account || "",
          bank_iban: org.bank_iban || "", mobile_money: org.mobile_money || "",
          conditions_generales: org.conditions_generales || "",
        });
        setPdfTemplate(org.pdf_template || "moderne");
        setBrandColor(org.brand_color || "#5E5CE6");
        setLogoUrl(org.logo_url || "");
        setStampUrl(org.stamp_url || "");
      })
      .catch(console.error);
    fetchCatalog();
  }, [fetchCatalog]);

  async function saveOrg() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/org", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...orgForm, tax_rate: parseFloat(orgForm.tax_rate) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error("Erreur sauvegarde:", e);
    } finally {
      setSaving(false);
    }
  }

  async function saveField(field, value) {
    try {
      await fetch("/api/settings/org", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
    } catch (e) {
      console.error("Erreur sauvegarde champ:", e);
    }
  }

  async function handleUpload(file, type) {
    if (!file) return;
    setUploading(u => ({ ...u, [type]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", type);
      const res = await fetch("/api/settings/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (type === "logo") setLogoUrl(data.url);
      else setStampUrl(data.url);
    } catch (e) {
      console.error("Erreur upload:", e);
      alert("Erreur lors de l'envoi : " + e.message);
    } finally {
      setUploading(u => ({ ...u, [type]: false }));
    }
  }

  async function removeImage(type) {
    if (type === "logo") setLogoUrl("");
    else setStampUrl("");
    await saveField(type === "logo" ? "logo_url" : "stamp_url", null);
  }

  function openCreateProduct() { setProductForm(emptyProduct); setEditProduct(null); setShowProduct(true); }
  function openEditProduct(p) {
    setProductForm({ name: p.name, description: p.description || "", unit_price: String(p.unit_price), tax_rate: String(p.tax_rate), unit: p.unit, type: p.type });
    setEditProduct(p); setShowProduct(true);
  }

  async function saveProduct() {
    setSaving(true);
    const payload = { ...productForm, unit_price: parseFloat(productForm.unit_price), tax_rate: parseFloat(productForm.tax_rate) };
    try {
      if (editProduct) await update(editProduct.id, payload);
      else await create(payload);
      await fetchCatalog();
      setShowProduct(false);
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function handleDeleteProduct() {
    if (!deleteConfirm) return;
    await remove(deleteConfirm.id);
    await fetchCatalog();
    setDeleteConfirm(null);
  }

  const catalogColumns = [
    { key: "name", label: "Nom", render: (v, r) => (
      <div><p className="font-medium text-foreground">{v}</p>{r.description && <p className="text-xs text-muted">{r.description}</p>}</div>
    )},
    { key: "type", label: "Type", render: (v) => <Badge>{v === "service" ? "Service" : "Produit"}</Badge> },
    { key: "unit_price", label: "Prix unitaire", align: "right", render: (v) => <span className="font-medium">{formatCurrency(v)}</span> },
    { key: "unit", label: "Unité", render: (v) => <span className="text-slate-600">{v}</span> },
    { key: "actions", label: "", render: (_, row) => (
      <div className="flex gap-1">
        <button onClick={() => openEditProduct(row)} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil className="w-4 h-4 text-slate-400" /></button>
        <button onClick={() => setDeleteConfirm(row)} className="p-1.5 rounded-lg hover:bg-danger-50"><Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-500" /></button>
      </div>
    )},
  ];

  const SaveButton = ({ onClick }) => (
    <div className="flex items-center gap-3 justify-end">
      {saved && <span className="text-sm text-success-500 font-medium">✓ Enregistré !</span>}
      <Button onClick={onClick || saveOrg} disabled={saving}>
        <Save className="w-4 h-4" />
        {saving ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </div>
  );

  return (
    <div>
      <Header title="Paramètres" />
      <div className="p-4 sm:p-6 space-y-6">
        <Tabs
          wrap
          mobileGrid={3}
          tabs={[
            { value: "entreprise", label: "Entreprise" },
            { value: "facturation", label: "Facturation" },
            { value: "catalogue", label: "Catalogue", count: catalog.length },
            { value: "paiement", label: "Paiement" },
            { value: "theme", label: "Thème PDF" },
          ]}
          activeTab={tab} onChange={setTab}
        />

        {/* ── Entreprise ── */}
        {tab === "entreprise" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold">Profil de l&apos;entreprise</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Raison sociale" value={orgForm.name} onChange={e => setOrgForm({ ...orgForm, name: e.target.value })} />
                <Input label="NINEA" value={orgForm.ninea} onChange={e => setOrgForm({ ...orgForm, ninea: e.target.value })} />
                <Input label="RCCM" value={orgForm.rccm} onChange={e => setOrgForm({ ...orgForm, rccm: e.target.value })} />
                <Input label="Téléphone" value={orgForm.phone} onChange={e => setOrgForm({ ...orgForm, phone: e.target.value })} />
                <Input label="Email" type="email" value={orgForm.email} onChange={e => setOrgForm({ ...orgForm, email: e.target.value })} />
                <Input label="Site web" value={orgForm.website} onChange={e => setOrgForm({ ...orgForm, website: e.target.value })} />
                <Input label="Adresse" value={orgForm.address} onChange={e => setOrgForm({ ...orgForm, address: e.target.value })} />
                <Input label="Ville" value={orgForm.city} onChange={e => setOrgForm({ ...orgForm, city: e.target.value })} />
              </div>
              <SaveButton />
            </CardContent>
          </Card>
        )}

        {/* ── Facturation ── */}
        {tab === "facturation" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold">Paramètres de facturation</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Input label="Taux de TVA (%)" type="number" value={orgForm.tax_rate} onChange={e => setOrgForm({ ...orgForm, tax_rate: e.target.value })} />
                <Input label="Préfixe factures" value={orgForm.invoice_prefix} onChange={e => setOrgForm({ ...orgForm, invoice_prefix: e.target.value })} />
                <Input label="Préfixe devis" value={orgForm.quote_prefix} onChange={e => setOrgForm({ ...orgForm, quote_prefix: e.target.value })} />
              </div>
              <Select label="Devise" value={orgForm.currency} onChange={e => setOrgForm({ ...orgForm, currency: e.target.value })}
                options={[{ value: "XOF", label: "FCFA (XOF)" }, { value: "EUR", label: "Euro (EUR)" }, { value: "USD", label: "Dollar (USD)" }]} />
              <Textarea label="Conditions générales de vente" value={orgForm.conditions_generales} onChange={e => setOrgForm({ ...orgForm, conditions_generales: e.target.value })}
                placeholder="Vos conditions générales apparaîtront sur les devis et factures..." />
              <SaveButton />
            </CardContent>
          </Card>
        )}

        {/* ── Catalogue ── */}
        {tab === "catalogue" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted">Produits et services réutilisables dans vos devis et factures.</p>
              <Button onClick={openCreateProduct}><Plus className="w-4 h-4" /> Ajouter un article</Button>
            </div>
            <Card><DataTable columns={catalogColumns} data={catalog} emptyMessage="Aucun article dans le catalogue" /></Card>
          </div>
        )}

        {/* ── Paiement ── */}
        {tab === "paiement" && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold">Coordonnées de paiement</h3>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted">Ces informations apparaîtront sur vos factures.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <Input label="Banque" value={orgForm.bank_name} onChange={e => setOrgForm({ ...orgForm, bank_name: e.target.value })} placeholder="Nom de la banque" />
                <Input label="N° de compte" value={orgForm.bank_account} onChange={e => setOrgForm({ ...orgForm, bank_account: e.target.value })} />
                <Input label="IBAN" value={orgForm.bank_iban} onChange={e => setOrgForm({ ...orgForm, bank_iban: e.target.value })} />
                <Input label="Mobile Money (Wave, OM...)" value={orgForm.mobile_money} onChange={e => setOrgForm({ ...orgForm, mobile_money: e.target.value })} placeholder="77 000 00 00" />
              </div>
              <SaveButton />
            </CardContent>
          </Card>
        )}

        {/* ── Thème PDF ── */}
        {tab === "theme" && (
          <div className="space-y-8">

            {/* Logo */}
            <Card>
              <CardHeader><div className="flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary-500" /><h3 className="font-semibold">Logo de l&apos;entreprise</h3></div></CardHeader>
              <CardContent>
                <p className="text-sm text-muted mb-4">Ce logo apparaîtra en en-tête de vos devis et factures PDF.</p>
                <div className="flex items-center gap-6">
                  {logoUrl ? (
                    <div className="relative group">
                      <img src={logoUrl} alt="Logo" className="h-16 max-w-[200px] object-contain rounded-lg border border-slate-200 p-2" />
                      <button
                        onClick={() => removeImage("logo")}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-danger-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-40 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-slate-300" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="hidden"
                      onChange={e => handleUpload(e.target.files?.[0], "logo")}
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <Upload className="w-4 h-4" />
                      {uploading.logo ? "Envoi..." : "Importer un logo"}
                    </span>
                  </label>
                </div>
                <p className="text-xs text-muted mt-3">PNG, JPG ou SVG. Taille recommandée : 400×150px.</p>
              </CardContent>
            </Card>

            {/* Cachet & Signature */}
            <Card>
              <CardHeader><div className="flex items-center gap-2"><Stamp className="w-5 h-5 text-primary-500" /><h3 className="font-semibold">Cachet &amp; Signature</h3></div></CardHeader>
              <CardContent>
                <p className="text-sm text-muted mb-4">Importez le cachet ou la signature de votre entreprise. Il pourra être apposé sur vos devis et factures.</p>
                <div className="flex items-center gap-6">
                  {stampUrl ? (
                    <div className="relative group">
                      <img src={stampUrl} alt="Cachet" className="h-20 max-w-[200px] object-contain rounded-lg border border-slate-200 p-2 bg-white" />
                      <button
                        onClick={() => removeImage("stamp")}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-danger-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-20 w-40 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center">
                      <Stamp className="w-6 h-6 text-slate-300" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="hidden"
                      onChange={e => handleUpload(e.target.files?.[0], "stamp")}
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <Upload className="w-4 h-4" />
                      {uploading.stamp ? "Envoi..." : "Importer cachet / signature"}
                    </span>
                  </label>
                </div>
                <p className="text-xs text-muted mt-3">PNG avec fond transparent recommandé. Taille idéale : 300×150px.</p>
              </CardContent>
            </Card>

            {/* Couleur de marque */}
            <Card>
              <CardHeader><div className="flex items-center gap-2"><Palette className="w-5 h-5 text-primary-500" /><h3 className="font-semibold">Couleur de l&apos;entreprise</h3></div></CardHeader>
              <CardContent>
                <p className="text-sm text-muted mb-4">Cette couleur sera appliquée sur les en-têtes, tableaux et accents de vos documents PDF.</p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex gap-3 flex-wrap">
                    {["#5E5CE6","#2563eb","#0891b2","#059669","#d97706","#dc2626","#7c3aed","#db2777","#0f172a"].map(color => (
                      <button
                        key={color}
                        onClick={() => { setBrandColor(color); saveField("brand_color", color); }}
                        className={`w-9 h-9 rounded-full transition-all ${brandColor === color ? "ring-2 ring-offset-2 ring-primary-500 scale-110" : "hover:scale-105"}`}
                        style={{ backgroundColor: color }}
                      >
                        {brandColor === color && <Check className="w-4 h-4 text-white mx-auto" />}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
                    <label className="text-xs text-muted">Personnalisée :</label>
                    <input
                      type="color"
                      value={brandColor}
                      onChange={e => { setBrandColor(e.target.value); saveField("brand_color", e.target.value); }}
                      className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-muted">{brandColor}</span>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg border border-slate-100 flex items-center gap-3">
                  <div className="h-8 flex-1 rounded" style={{ backgroundColor: brandColor }} />
                  <span className="text-xs text-muted">Aperçu de votre couleur sur un en-tête</span>
                </div>
              </CardContent>
            </Card>

            {/* Templates */}
            <div>
              <h3 className="font-semibold text-foreground mb-1">Modèle de document</h3>
              <p className="text-sm text-muted mb-4">Cliquez sur un modèle pour le sélectionner comme design par défaut.</p>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { id: "moderne", label: "Moderne", desc: "Dégradé coloré, coins arrondis, style premium", barStyle: `linear-gradient(to right, ${brandColor}, #8B5CF6)`, tableColor: brandColor },
                  { id: "classique", label: "Classique", desc: "Bordures nettes, encadrés, professionnel", barStyle: null, tableColor: "#1e293b" },
                  { id: "minimaliste", label: "Minimaliste", desc: "Épuré, beaucoup d'espace, élégant", barStyle: null, tableColor: "#0f172a" },
                ].map(tpl => (
                  <div
                    key={tpl.id}
                    onClick={() => { setPdfTemplate(tpl.id); saveField("pdf_template", tpl.id); }}
                    className={`cursor-pointer rounded-2xl border-2 transition-all overflow-hidden ${pdfTemplate === tpl.id ? "border-primary-500 shadow-lg ring-2 ring-primary-500/20" : "border-slate-200 hover:border-slate-300 hover:shadow-md"}`}
                  >
                    <div className="relative p-5 bg-white">
                      {pdfTemplate === tpl.id && (
                        <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center z-10" style={{ backgroundColor: brandColor }}>
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-3">
                        <div><div className="w-16 h-3 rounded mb-1.5" style={{ backgroundColor: tpl.tableColor }} /><div className="w-10 h-1.5 rounded bg-slate-200" /></div>
                        <div className="text-right"><div className="w-8 h-1.5 rounded bg-slate-400 mb-1" /><div className="w-14 h-2.5 rounded bg-slate-800" /></div>
                      </div>
                      {tpl.barStyle ? (
                        <div className="h-1 rounded-full mb-3" style={{ background: tpl.barStyle }} />
                      ) : tpl.id === "classique" ? (
                        <div className="h-0.5 mb-3" style={{ backgroundColor: tpl.tableColor }} />
                      ) : (
                        <div className="h-px bg-slate-200 mb-3" />
                      )}
                      <div className="flex gap-3 mb-3">
                        <div className="flex-1 space-y-1"><div className="w-8 h-1 rounded bg-slate-300" /><div className="w-full h-1.5 rounded bg-slate-200" /></div>
                        <div className="flex-1 space-y-1"><div className="w-8 h-1 rounded bg-slate-300" /><div className="w-full h-1.5 rounded bg-slate-200" /></div>
                      </div>
                      <div className="h-5 mb-1" style={{ backgroundColor: tpl.tableColor, borderRadius: tpl.id === "moderne" ? "4px" : "0" }} />
                      <div className="space-y-0.5">
                        {[0,1,2].map(i => <div key={i} className={`h-4 rounded border border-slate-100 ${i % 2 === 0 ? "bg-slate-50" : "bg-white"}`} />)}
                      </div>
                      <div className="flex justify-end mt-3">
                        <div className="w-24 space-y-1 p-2 rounded bg-slate-50">
                          <div className="flex justify-between"><div className="w-10 h-1 bg-slate-300 rounded" /><div className="w-8 h-1 bg-slate-400 rounded" /></div>
                          <div className="border-t pt-1 flex justify-between" style={{ borderColor: tpl.tableColor }}>
                            <div className="w-10 h-1.5 rounded" style={{ backgroundColor: tpl.tableColor }} />
                            <div className="w-10 h-1.5 rounded" style={{ backgroundColor: tpl.tableColor }} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`px-5 py-3 border-t ${pdfTemplate === tpl.id ? "bg-primary-50 border-primary-100" : "bg-slate-50 border-slate-100"}`}>
                      <p className="font-semibold text-sm text-foreground">{tpl.label}</p>
                      <p className="text-xs text-muted">{tpl.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product modal */}
      <Modal open={showProduct} onClose={() => setShowProduct(false)} title={editProduct ? "Modifier l'article" : "Nouvel article"} size="md">
        <div className="space-y-4">
          <Input label="Nom" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
          <Input label="Description" value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Prix unitaire (FCFA)" type="number" value={productForm.unit_price} onChange={e => setProductForm({ ...productForm, unit_price: e.target.value })} />
            <Input label="TVA (%)" type="number" value={productForm.tax_rate} onChange={e => setProductForm({ ...productForm, tax_rate: e.target.value })} />
            <Input label="Unité" value={productForm.unit} onChange={e => setProductForm({ ...productForm, unit: e.target.value })} />
          </div>
          <Select label="Type" value={productForm.type} onChange={e => setProductForm({ ...productForm, type: e.target.value })}
            options={[{ value: "service", label: "Service" }, { value: "produit", label: "Produit" }]} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowProduct(false)}>Annuler</Button>
            <Button onClick={saveProduct} disabled={saving || !productForm.name}>{saving ? "Enregistrement..." : editProduct ? "Modifier" : "Créer"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleDeleteProduct}
        title="Supprimer cet article ?" message={`Supprimer "${deleteConfirm?.name}" du catalogue ?`} confirmLabel="Supprimer" />
    </div>
  );
}
