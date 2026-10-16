"use client";

import { useEffect } from "react";

const STORAGE_KEY = "gestio_ref_code";

// Monté dans le layout du dashboard : au premier chargement après connexion,
// attribue l'organisation à l'affilié dont le code traîne en localStorage
// (déposé par ReferralCapture lors d'une visite avec ?ref=CODE).
export function ReferralLinker() {
  useEffect(() => {
    let code = null;
    try {
      code = localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (!code) return;

    fetch("/api/affiliate/track-referral", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .catch(() => {})
      .finally(() => {
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
      });
  }, []);

  return null;
}
