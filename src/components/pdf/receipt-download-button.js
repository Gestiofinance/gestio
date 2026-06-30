"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export function ReceiptDownloadButton({ payment, organizationName }) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const [{ pdf }, React, { ReceiptPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("react"),
        import("@/lib/pdf/receipt-pdf"),
      ]);

      const blob = await pdf(
        React.createElement(ReceiptPDF, { payment, organizationName })
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recu-gestio-${(payment.id || "").slice(0, 8)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Receipt PDF error:", e);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      title="Télécharger le reçu PDF"
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all disabled:opacity-60 whitespace-nowrap"
    >
      {loading
        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Génération...</>
        : <><Download className="w-3.5 h-3.5" /> Reçu PDF</>
      }
    </button>
  );
}
