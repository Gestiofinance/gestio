import { clsx } from "clsx";

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatCurrency(amount, currency = "XOF") {
  return new Intl.NumberFormat("fr-SN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatShortDate(date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function generateInvoiceNumber(prefix = "FAC", sequence) {
  const year = new Date().getFullYear();
  const num = String(sequence).padStart(4, "0");
  return `${prefix}-${year}-${num}`;
}

export function calculateTTC(ht, tvaRate = 18) {
  const tva = ht * (tvaRate / 100);
  return { ht, tva, ttc: ht + tva };
}
