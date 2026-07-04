"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    q: "Gestio est-il adapté aux petites entreprises sénégalaises ?",
    a: "Absolument. Gestio a été conçu spécifiquement pour les TPE, PME et entrepreneurs africains. L'interface est en français, les devises incluent le FCFA et les intégrations de paiement supportent Wave, Orange Money et Free Money.",
  },
  {
    q: "Est-ce que je peux tester Gestio sans carte bancaire ?",
    a: "Oui ! L'essai gratuit de 7 jours ne nécessite aucune carte bancaire. Vous accédez à toutes les fonctionnalités du plan Pro pour évaluer la plateforme librement.",
  },
  {
    q: "Combien d'utilisateurs puis-je inviter dans mon équipe ?",
    a: "Le plan Standard inclut 1 utilisateur. Le plan Pro et Business permettent d'inviter un nombre illimité de membres avec des rôles personnalisés (Propriétaire, Admin, Employé).",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Vos données sont hébergées sur une infrastructure sécurisée avec chiffrement AES-256 au repos et TLS en transit. Chaque entreprise dispose d'un espace isolé grâce à notre architecture multi-tenant.",
  },
  {
    q: "Puis-je passer d'un plan à l'autre à tout moment ?",
    a: "Oui, vous pouvez upgrader ou downgrader votre abonnement à tout moment. Le changement est effectif immédiatement et la facturation est au prorata.",
  },
  {
    q: "Proposez-vous un accompagnement à la prise en main ?",
    a: "Nous proposons une documentation complète, des tutoriels vidéo et un support par email. Le plan Business inclut un onboarding personnalisé avec un membre de notre équipe.",
  },
];

export default function FaqAccordion() {
  const [open, setOpen] = useState(null);
  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-5 text-left"
          >
            <span className="text-sm font-semibold text-slate-900 pr-4">{faq.q}</span>
            <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-primary-50 text-primary-600">
              {open === i ? <Minus className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </span>
          </button>
          {open === i && (
            <div className="px-6 pb-5">
              <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
