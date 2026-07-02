"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { DocumentPDF } from "@/lib/pdf/document-pdf";
import { useSupabase } from "@/hooks/useSupabase";
import { Button } from "./button";
import { Download, Printer } from "lucide-react";

export function PdfDownloadButton({ type, data, items, variant = "secondary", size = "sm", label, action = "download" }) {
  const supabase = useSupabase();
  const [generating, setGenerating] = useState(false);

  async function handleAction() {
    setGenerating(true);
    try {
      const orgRes = await fetch("/api/settings/org");
      const { org } = orgRes.ok ? await orgRes.json() : { org: null };
      const template = org?.pdf_template || "moderne";

      let fullData = data;
      if (!data.clients) {
        const table = type === "devis" ? "quotes" : "invoices";
        const { data: fetched } = await supabase.from(table).select("*, clients(company_name, contact_name, email, phone, address, ninea)").eq("id", data.id).single();
        if (fetched) fullData = fetched;
      }

      let fullItems = items;
      if (!fullItems) {
        const itemTable = type === "devis" ? "quote_items" : "invoice_items";
        const fk = type === "devis" ? "quote_id" : "invoice_id";
        const { data: fetchedItems } = await supabase.from(itemTable).select("*").eq(fk, data.id).order("sort_order");
        fullItems = fetchedItems || [];
      }

      const blob = await pdf(
        <DocumentPDF type={type} data={fullData} items={fullItems} organization={org} template={template} />
      ).toBlob();

      const url = URL.createObjectURL(blob);

      if (action === "print") {
        const win = window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      } else {
        const number = type === "devis" ? data.quote_number : data.invoice_number;
        const link = document.createElement("a");
        link.href = url;
        link.download = `${number || type}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      console.error("PDF error:", e);
    }
    setGenerating(false);
  }

  const isPrint = action === "print";

  return (
    <Button variant={variant} size={size} onClick={handleAction} disabled={generating}>
      {isPrint ? <Printer className="w-4 h-4" /> : <Download className="w-4 h-4" />}
      {generating ? "..." : label !== undefined ? label : isPrint ? "Imprimer" : "Télécharger PDF"}
    </Button>
  );
}
