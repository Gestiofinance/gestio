"use client";

import { useState } from "react";
import { Send, CheckCircle, AlertCircle } from "lucide-react";

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error"

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("success");
        setForm({ name: "", email: "", company: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Nom complet *</label>
          <input
            type="text" name="name" required value={form.name} onChange={handleChange}
            placeholder="Votre nom"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email *</label>
          <input
            type="email" name="email" required value={form.email} onChange={handleChange}
            placeholder="vous@entreprise.com"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Entreprise</label>
        <input
          type="text" name="company" value={form.company} onChange={handleChange}
          placeholder="Nom de votre entreprise"
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Message *</label>
        <textarea
          name="message" required rows={5} value={form.message} onChange={handleChange}
          placeholder="Décrivez votre besoin..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
        />
      </div>

      {status === "success" && (
        <div className="flex items-center gap-3 px-4 py-3 bg-success-50 border border-success-500/20 rounded-xl text-success-600 text-sm">
          <CheckCircle className="w-5 h-5 shrink-0" />
          Message envoyé ! Nous vous répondrons dans les plus brefs délais.
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-3 px-4 py-3 bg-danger-50 border border-danger-500/20 rounded-xl text-danger-600 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          Une erreur est survenue. Contactez-nous directement à contact@gestio.sn
        </div>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white text-sm transition-all disabled:opacity-70"
        style={{ background: "linear-gradient(135deg, #5E5CE6, #7C3AED)" }}
      >
        <Send className="w-4 h-4" />
        {loading ? "Envoi en cours..." : "Envoyer le message"}
      </button>
    </form>
  );
}
