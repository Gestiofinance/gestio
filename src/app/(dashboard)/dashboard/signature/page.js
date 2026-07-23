"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatShortDate } from "@/lib/utils";
import {
  FileSignature, Upload, Download, Trash2, PenLine, Loader2, X, Lock, CreditCard, ArrowRight,
} from "lucide-react";

const PdfSignerCanvas = dynamic(() => import("@/components/signature/PdfSignerCanvas"), { ssr: false });

const statusLabels = { draft: "Brouillon", signed: "Signé" };
const statusVariants = { draft: "warning", signed: "success" };

// Signature de documents : réservé aux plans Pro et Business
const ALLOWED_PLANS = ["pro", "business"];

function ProLockScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-20 h-20 bg-primary-50 rounded-2xl flex items-center justify-center mb-6">
        <Lock className="w-9 h-9 text-primary-400" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">Fonctionnalité Pro</h2>
      <p className="text-muted text-sm max-w-sm mb-8 leading-relaxed">
        La signature de documents est réservée aux plans Pro et Business. Passez à un plan supérieur pour l&apos;activer.
      </p>
      <Link
        href="/dashboard/abonnement"
        className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
      >
        <CreditCard className="w-4 h-4" />
        Voir les plans
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default function SignaturePage() {
  const [plan, setPlan] = useState(undefined); // undefined = loading, null = no plan
  const [documents, setDocuments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [stampUrl, setStampUrl] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Active editing session
  const [activeDoc, setActiveDoc] = useState(null); // { id, name }
  const [fileBytes, setFileBytes] = useState(null); // ArrayBuffer of the original PDF
  const [signatureFile, setSignatureFile] = useState(null); // local override File
  const [importing, setImporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const sigInputRef = useRef(null);

  useEffect(() => {
    fetch("/api/subscription/data")
      .then((r) => r.json())
      .then(({ subscription }) => setPlan(subscription?.plan_id ?? null))
      .catch(() => setPlan(null));
  }, []);

  useEffect(() => {
    loadHistory();
    fetch("/api/settings/org")
      .then((r) => r.json())
      .then(({ org }) => org?.stamp_url && setStampUrl(org.stamp_url))
      .catch(() => {});
  }, []);

  const signatureUrl = useMemo(
    () => (signatureFile ? URL.createObjectURL(signatureFile) : stampUrl),
    [signatureFile, stampUrl]
  );

  useEffect(() => {
    return () => {
      if (signatureFile && signatureUrl) URL.revokeObjectURL(signatureUrl);
    };
  }, [signatureFile, signatureUrl]);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/signatures");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch {
      // ignore, history stays empty
    } finally {
      setLoadingHistory(false);
    }
  }

  async function handleImport(file) {
    if (!file) return;
    setError("");
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/signatures", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec de l'import");

      setActiveDoc({ id: data.document.id, name: data.document.name });
      setFileBytes(await file.arrayBuffer());
      loadHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setImporting(false);
    }
  }

  async function handleResume(doc) {
    setError("");
    setImporting(true);
    try {
      const res = await fetch(doc.original_url);
      const buf = await res.arrayBuffer();
      setActiveDoc({ id: doc.id, name: doc.name });
      setFileBytes(buf);
    } catch {
      setError("Impossible de charger ce document.");
    } finally {
      setImporting(false);
    }
  }

  function closeEditor() {
    setActiveDoc(null);
    setFileBytes(null);
    setSignatureFile(null);
  }

  async function handleSave() {
    if (!canvasRef.current || !fileBytes || !signatureUrl) return;
    setSaving(true);
    setError("");
    try {
      const { PDFDocument } = await import("pdf-lib");
      const placement = canvasRef.current.getPlacement();

      const sigBlob = signatureFile || (await (await fetch(signatureUrl)).blob());
      const sigBytes = await sigBlob.arrayBuffer();
      const isPng = (signatureFile?.type || sigBlob.type || "").includes("png");

      const pdfDoc = await PDFDocument.load(fileBytes);
      const page = pdfDoc.getPages()[placement.pageIndex];
      const { width: pageWidth, height: pageHeight } = page.getSize();
      const embedded = isPng ? await pdfDoc.embedPng(sigBytes) : await pdfDoc.embedJpg(sigBytes);

      const drawWidth = placement.wPct * pageWidth;
      const drawHeight = drawWidth * placement.aspectRatio;
      const x = placement.xPct * pageWidth;
      const y = pageHeight - placement.yPct * pageHeight - drawHeight;
      page.drawImage(embedded, { x, y, width: drawWidth, height: drawHeight });

      const finalBytes = await pdfDoc.save();
      const finalBlob = new Blob([finalBytes], { type: "application/pdf" });

      // Téléchargement immédiat
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `signe-${activeDoc.name}`;
      a.click();
      URL.revokeObjectURL(url);

      // Sauvegarde côté serveur
      const formData = new FormData();
      formData.append("file", finalBlob, `signe-${activeDoc.name}`);
      const res = await fetch(`/api/signatures/${activeDoc.id}`, { method: "PATCH", body: formData });
      if (!res.ok) throw new Error((await res.json()).error || "Échec de l'enregistrement");

      closeEditor();
      loadHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload(url, name) {
    const res = await fetch(url);
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objUrl;
    a.download = name;
    a.click();
    URL.revokeObjectURL(objUrl);
  }

  async function handleDelete(id) {
    await fetch(`/api/signatures/${id}`, { method: "DELETE" });
    setDeleteConfirm(null);
    loadHistory();
  }

  const hasAccess = ALLOWED_PLANS.includes(plan);

  return (
    <div>
      <Header title="Signature de documents" />

      {plan === undefined ? (
        <div className="flex justify-center py-24">
          <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
        </div>
      ) : !hasAccess ? (
        <ProLockScreen />
      ) : (
      <div className="p-4 sm:p-6 space-y-6">
        {!activeDoc && (
          <Card>
            <CardContent className="py-10">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleImport(e.target.files?.[0])}
              />
              <EmptyState
                icon={FileSignature}
                title="Importer un document à signer"
                description="Importez un PDF, placez votre signature ou votre cachet où vous voulez, puis téléchargez le document final."
                actionLabel={importing ? "Import en cours…" : "Importer un PDF"}
                onAction={() => !importing && fileInputRef.current?.click()}
              />
            </CardContent>
          </Card>
        )}

        {error && (
          <div className="text-sm text-danger-600 bg-danger-50 border border-danger-100 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {activeDoc && (
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{activeDoc.name}</p>
                <p className="text-xs text-muted">Faites glisser la signature sur le document, ajustez la taille, puis enregistrez.</p>
              </div>
              <button onClick={closeEditor} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </CardHeader>
            <CardContent>
              {!signatureUrl && (
                <div className="text-sm text-muted mb-4">
                  Aucune signature disponible. Importez-en une (ou ajoutez votre cachet dans Paramètres).
                </div>
              )}

              {fileBytes && (
                <PdfSignerCanvas ref={canvasRef} fileBytes={fileBytes} signatureUrl={signatureUrl} />
              )}

              <div className="flex flex-wrap items-center gap-3 mt-6">
                <input
                  ref={sigInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => setSignatureFile(e.target.files?.[0] || null)}
                />
                <Button variant="secondary" size="sm" onClick={() => sigInputRef.current?.click()}>
                  <PenLine className="w-4 h-4" /> Importer une signature
                </Button>
                <Button onClick={handleSave} disabled={saving || !signatureUrl} className="ml-auto">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {saving ? "Enregistrement…" : "Enregistrer et télécharger"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-foreground">Historique</h2>
          </CardHeader>
          <CardContent>
            {loadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <p className="text-sm text-muted text-center py-8">Aucun document importé pour l&apos;instant.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 py-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                      <FileSignature className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                      <p className="text-xs text-muted">{formatShortDate(doc.created_at)}</p>
                    </div>
                    <Badge variant={statusVariants[doc.status]}>{statusLabels[doc.status]}</Badge>
                    <div className="flex items-center gap-1 shrink-0">
                      {doc.status === "draft" && (
                        <Button variant="ghost" size="sm" onClick={() => handleResume(doc)}>
                          <Upload className="w-4 h-4" /> Signer
                        </Button>
                      )}
                      {doc.signed_url && (
                        <Button variant="ghost" size="sm" onClick={() => handleDownload(doc.signed_url, doc.name)}>
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(doc.id)}>
                        <Trash2 className="w-4 h-4 text-danger-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <ConfirmDialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm)}
          title="Supprimer le document"
          message="Cette action supprime définitivement le document importé et sa version signée."
        />
      </div>
      )}
    </div>
  );
}
