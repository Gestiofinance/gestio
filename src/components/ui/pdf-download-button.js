"use client";

import { useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { DocumentPDF } from "@/lib/pdf/document-pdf";
import { useSupabase } from "@/hooks/useSupabase";
import { Button } from "./button";
import { Download } from "lucide-react";

export function PdfDownloadButton({ type, data, items, variant = "secondary", size = "sm", label }) {
  const supabase = useSupabase();
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    setGenerating(true);
    try {
      // Use admin API to bypass RLS — ensures org info always loads
      const orgRes = await fetch("/api/settings/org");
      const { org } = orgRes.ok ? await orgRes.json() : { org: null };
      const template = org?.pdf_template || "moderne";

      let fullData = data;
      if (!data.clients) {
        const select = type === "devis"
          ? "*, clients(company_name, contact_name, email, phone, address, ninea)"
          : "*, clients(company_name, contact_name, email, phone, address, ninea)";
        const table = type === "devis" ? "quotes" : "invoices";
        const { data: fetched } = await supabase.from(table).select(select).eq("id", data.id).single();
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
      const link = document.createElement("a");
      const number = type === "devis" ? data.quote_number : data.invoice_number;
      link.href = url;
      link.download = `${number || type}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("PDF generation error:", e);
    }
    setGenerating(false);
  }

  return (
    <Button variant={variant} size={size} onClick={handleDownload} disabled={generating}>
      <Download className="w-4 h-4" />
      {generating ? "..." : label !== undefined ? label : "Télécharger PDF"}
    </Button>
  );
}
