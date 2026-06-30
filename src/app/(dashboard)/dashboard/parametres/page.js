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
import { useAuth } from "@/hooks/useAuth";
import { useSupabase, useCrud } from "@/hooks/useSupabase";
import { formatCurrency } from "@/lib/utils";
import {
  Building2, FileText, CreditCard, Palette, Save, Plus, Pencil, Trash2, Check, Upload, X, Image as ImageIcon, Stamp,
} from "lucide-react";

const emptyProduct = { name: "", description: "", unit_price: "", tax_rate: "18", unit: "unité", type: "service" };

export default function ParametresPage() {
  const { organization } = useAuth();
  const supabase = useSupabase();
  const { data: catalog, fetchAll: fetchCatalog, create, update, remove } = useCrud("catalog_items");

  const [tab, setTab] = useState("entreprise");
  const [orgForm, setOrgForm] = useState({
    name: "", ninea: "", rccm: "", address: "", city: "", country: "Sénégal",
    phone: "", email: "", website: "", tax_rate: "18", currency: "XOF",
    invoice_prefix: "FAC", quote_prefix: "DEV", bank_name: "", bank_account: "",
    bank_iban: "", mobile_money: "", conditions_generales: "",
  });
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
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (organization) {
      setOrgForm({
        name: organization.name || "", ninea: organization.ninea || "", rccm: organization.rccm || "",
        address: organization.address || "", city: organization.city || "", country: organization.country || "Sénégal",
        phone: organization.phone || "", email: organization.email || "", website: organization.website || "",
        tax_rate: String(organization.tax_rate || 18), currency: organization.currency || "XOF",
        invoice_prefix: organization.invoice_prefix || "FAC", quote_prefix: organization.quote_prefix || "DEV",
        bank_name: organization.bank_name || "", bank_account: organization.bank_account || "",
        bank_iban: organization.bank_iban || "", mobile_money: organization.mobile_money || "",
        conditions_generales: organization.conditions_generales || "",
      });
      setPdfTemplate(organization.pdf_template || "moderne");
      setBrandColor(organization.brand_color || "#5E5CE6");
      setLogoUrl(organization.logo_url || "");
      setStampUrl(organization.stamp_url || "");
    }
    fetchCatalog();
  }, [organization, fetchCatalog]);

  async function saveOrg() {
    setSaving(true);
    await supabase.from("organizations").update({
      ...orgForm, tax_rate: parseFloat(orgForm.tax_rate),
    }).eq("id", organization.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
    {
      key: "actions", label: "",
      render: (_, row) => (
        <div className="flex gap-1">
          <button onClick={() => openEditProduct(row)} className="p-1.5 rounded-lg hover:bg-slate-100"><Pencil className="w-4 h-4 text-slate-400" /></button>
          <button onClick={() => setDeleteConfirm(row)} className="p-1.5 rounded-lg hover:bg-danger-50"><Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-500" /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Header title="Paramètres" />
      <div className="p-4 sm:p-6 space-y-6">
        <Tabs
          tabs={[
            { value: "entreprise", label: "Entreprise" },
            { value: "facturation", label: "Facturation" },
            { value: "catalogue", label: "Catalogue", count: catalog.length },
            { value: "paiement", label: "Paiement" },
            { value: "theme", label: "Thème PDF" },
          ]}
          activeTab={tab} onChange={setTab}
        />

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
                <Input label="Raison sociale" value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
                <Input label="NINEA" value={orgForm.ninea} onChange={(e) => setOrgForm({ ...orgForm, ninea: e.target.value })} />
                <Input label="RCCM" value={orgForm.rccm} onChange={(e) => setOrgForm({ ...orgForm, rccm: e.target.value })} />
                <Input label="Téléphone" value={orgForm.phone} onChange={(e) => setOrgForm({ ...orgForm, phone: e.target.value })} />
                <Input label="Email" type="email" value={orgForm.email} onChange={(e) => setOrgForm({ ...orgForm, email: e.target.value })} />
                <Input label="Site web" value={orgForm.website} onChange={(e) => setOrgForm({ ...orgForm, website: e.target.value })} />
                <Input label="Adresse" value={orgForm.address} onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })} />
                <Input label="Ville" value={orgForm.city} onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3">
                {saved && <span className="text-sm text-success-500 self-center">Enregistré !</span>}
                <Button onClick={saveOrg} disabled={saving}><Save className="w-4 h-4" />{saving ? "Enregistrement..." : "Enregistrer"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                <Input label="Taux de TVA (%)" type="number" value={orgForm.tax_rate} onChange={(e) => setOrgForm({ ...orgForm, tax_rate: e.target.value })} />
                <Input label="Préfixe factures" value={orgForm.invoice_prefix} onChange={(e) => setOrgForm({ ...orgForm, invoice_prefix: e.target.value })} />
                <Input label="Préfixe devis" value={orgForm.quote_prefix} onChange={(e) => setOrgForm({ ...orgForm, quote_prefix: e.target.value })} />
              </div>
              <Select label="Devise" value={orgForm.currency} onChange={(e) => setOrgForm({ ...orgForm, currency: e.target.value })}
                options={[{ value: "XOF", label: "FCFA (XOF)" }, { value: "EUR", label: "Euro (EUR)" }, { value: "USD", label: "Dollar (USD)" }]} />
              <Textarea label="Conditions générales de vente" value={orgForm.conditions_generales} onChange={(e) => setOrgForm({ ...orgForm, conditions_generales: e.target.value })}
                placeholder="Vos conditions générales apparaîtront sur les devis et factures..." />
              <div className="flex justify-end gap-3">
                {saved && <span className="text-sm text-success-500 self-center">Enregistré !</span>}
                <Button onClick={saveOrg} disabled={saving}><Save className="w-4 h-4" />{saving ? "Enregistrement..." : "Enregistrer"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === "catalogue" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted">Produits et services réutilisables dans vos devis et factures.</p>
              <Button onClick={openCreateProduct}><Plus className="w-4 h-4" /> Ajouter un article</Button>
            </div>
            <Card><DataTable columns={catalogColumns} data={catalog} emptyMessage="Aucun article dans le catalogue" /></Card>
          </div>
        )}

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
                <Input label="Banque" value={orgForm.bank_name} onChange={(e) => setOrgForm({ ...orgForm, bank_name: e.target.value })} placeholder="Nom de la banque" />
                <Input label="N° de compte" value={orgForm.bank_account} onChange={(e) => setOrgForm({ ...orgForm, bank_account: e.target.value })} />
                <Input label="IBAN" value={orgForm.bank_iban} onChange={(e) => setOrgForm({ ...orgForm, bank_iban: e.target.value })} />
                <Input label="Mobile Money (Wave, OM...)" value={orgForm.mobile_money} onChange={(e) => setOrgForm({ ...orgForm, mobile_money: e.target.value })} placeholder="77 000 00 00" />
              </div>
              <div className="flex justify-end gap-3">
                {saved && <span className="text-sm text-success-500 self-center">Enregistré !</span>}
                <Button onClick={saveOrg} disabled={saving}><Save className="w-4 h-4" />{saving ? "Enregistrement..." : "Enregistrer"}</Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                        onClick={async () => {
                          setLogoUrl("");
                          await supabase.from("organizations").update({ logo_url: null }).eq("id", organization.id);
                        }}
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
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        const ext = file.name.split(".").pop();
                        const path = `${organization.id}/logo.${ext}`;
                        await supabase.storage.from("logos").upload(path, file, { upsert: true });
                        const { data: { publicUrl } } = supabase.storage.from("logos").getPublicUrl(path);
                        const url = `${publicUrl}?t=${Date.now()}`;
                        setLogoUrl(url);
                        await supabase.from("organizations").update({ logo_url: url }).eq("id", organization.id);
                        setUploading(false);
                      }}
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <Upload className="w-4 h-4" /> {uploading ? "Envoi..." : "Importer un logo"}
                    </span>
                  </label>
                </div>
                <p className="text-xs text-muted mt-3">PNG, JPG ou SVG. Taille recommandée : 400x150px.</p>
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
                        onClick={async () => {
                          setStampUrl("");
                          await supabase.from("organizations").update({ stamp_url: null }).eq("id", organization.id);
                        }}
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
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploading(true);
                        const ext = file.name.split(".").pop();
                        const path = `${organization.id}/stamp.${ext}`;
                        await supabase.storage.from("stamps").upload(path, file, { upsert: true });
                        const { data: { publicUrl } } = supabase.storage.from("stamps").getPublicUrl(path);
                        const url = `${publicUrl}?t=${Date.now()}`;
                        setStampUrl(url);
                        await supabase.from("organizations").update({ stamp_url: url }).eq("id", organization.id);
                        setUploading(false);
                      }}
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <Upload className="w-4 h-4" /> {uploading ? "Envoi..." : "Importer cachet / signature"}
                    </span>
                  </label>
                </div>
                <p className="text-xs text-muted mt-3">PNG avec fond transparent recommandé. Taille idéale : 300x150px.</p>
              </CardContent>
            </Card>

            {/* Couleur */}
            <Card>
              <CardHeader><div className="flex items-center gap-2"><Palette className="w-5 h-5 text-primary-500" /><h3 className="font-semibold">Couleur de l&apos;entreprise</h3></div></CardHeader>
              <CardContent>
                <p className="text-sm text-muted mb-4">Cette couleur sera appliquée sur les en-têtes, tableaux et accents de vos documents PDF.</p>
                <div className="flex items-center gap-4">
                  <div className="flex gap-3">
                    {["#5E5CE6", "#2563eb", "#0891b2", "#059669", "#d97706", "#dc2626", "#7c3aed", "#db2777", "#0f172a"].map((color) => (
                      <button
                        key={color}
                        onClick={async () => {
                          setBrandColor(color);
                          await supabase.from("organizations").update({ brand_color: color }).eq("id", organization.id);
                        }}
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
                      onChange={async (e) => {
                        setBrandColor(e.target.value);
                        await supabase.from("organizations").update({ brand_color: e.target.value }).eq("id", organization.id);
                      }}
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
                  { id: "moderne", label: "Moderne", desc: "Dégradé coloré, coins arrondis, style premium", headerBg: brandColor, barStyle: `linear-gradient(to right, ${brandColor}, #8B5CF6)`, tableColor: brandColor },
                  { id: "classique", label: "Classique", desc: "Bordures nettes, encadrés, professionnel", headerBg: "#1e293b", barStyle: null, tableColor: "#1e293b" },
                  { id: "minimaliste", label: "Minimaliste", desc: "Épuré, beaucoup d'espace, élégant", headerBg: "#0f172a", barStyle: null, tableColor: "#0f172a" },
                ].map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={async () => {
                      setPdfTemplate(tpl.id);
                      await supabase.from("organizations").update({ pdf_template: tpl.id }).eq("id", organization.id);
                    }}
                    className={`cursor-pointer rounded-2xl border-2 transition-all overflow-hidden ${
                      pdfTemplate === tpl.id ? "border-primary-500 shadow-lg ring-2 ring-primary-500/20" : "border-slate-200 hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    <div className="relative p-5 bg-white">
                      {pdfTemplate === tpl.id && (
                        <div className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center z-10" style={{ backgroundColor: brandColor }}>
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-3">
                        <div><div className="w-16 h-3 rounded mb-1.5" style={{ backgroundColor: tpl.id === "moderne" ? brandColor : tpl.headerBg }} /><div className="w-10 h-1.5 rounded bg-slate-200" /></div>
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
                        <div className="h-4 rounded bg-slate-50 border border-slate-100" />
                        <div className="h-4 rounded bg-white border border-slate-100" />
                        <div className="h-4 rounded bg-slate-50 border border-slate-100" />
                      </div>
                      <div className="flex justify-end mt-3">
                        <div className="w-24 space-y-1 p-2 rounded bg-slate-50">
                          <div className="flex justify-between"><div className="w-10 h-1 bg-slate-300 rounded" /><div className="w-8 h-1 bg-slate-400 rounded" /></div>
                          <div className="border-t pt-1 flex justify-between" style={{ borderColor: tpl.tableColor }}><div className="w-10 h-1.5 rounded" style={{ backgroundColor: tpl.tableColor }} /><div className="w-10 h-1.5 rounded" style={{ backgroundColor: tpl.tableColor }} /></div>
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
          <Input label="Nom" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required />
          <Input label="Description" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input label="Prix unitaire (FCFA)" type="number" value={productForm.unit_price} onChange={(e) => setProductForm({ ...productForm, unit_price: e.target.value })} />
            <Input label="TVA (%)" type="number" value={productForm.tax_rate} onChange={(e) => setProductForm({ ...productForm, tax_rate: e.target.value })} />
            <Input label="Unité" value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} />
          </div>
          <Select label="Type" value={productForm.type} onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
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
