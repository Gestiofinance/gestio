"use client";

import { useEffect } from "react";

const STORAGE_KEY = "gestio_ref_code";

// Monté dans le layout racine : capture ?ref=CODE sur n'importe quelle page
// (landing, inscription...), le garde en localStorage et logue une visite.
export function ReferralCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("ref");
    if (!code) return;

    try {
      localStorage.setItem(STORAGE_KEY, code.toUpperCase());
    } catch {
      // localStorage indisponible (navigation privée...) — on ignore simplement
    }

    fetch("/api/affiliate/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => {});
  }, []);

  return null;
}
