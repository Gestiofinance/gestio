"use client";

import { useState } from "react";

const faqs = [
  { q: "Ai-je besoin de compétences techniques pour utiliser Gestio ?", a: "Non, Gestio est pensé pour être utilisé sans formation : créez votre première facture ou devis en quelques minutes." },
  { q: "Gestio fonctionne-t-il en FCFA ?", a: "Oui, toute la facturation, les dépenses et la comptabilité sont gérées nativement en Franc CFA." },
  { q: "Puis-je gérer plusieurs clients et projets à la fois ?", a: "Gestio centralise vos clients, projets, tâches et échéances dans un planning unique, sans limite de nombre de clients selon votre formule." },
  { q: "Existe-t-il une version mobile ?", a: "Oui, Gestio s'utilise aussi bien sur mobile que sur ordinateur, avec la même interface simple et rapide." },
  { q: "Puis-je essayer Gestio gratuitement ?", a: "Oui, un essai gratuit de 14 jours est disponible sur toutes les formules, sans carte bancaire requise." },
];

export default function FaqSection() {
  const [open, setOpen] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      {faqs.map((faq, i) => (
        <div
          key={faq.q}
          onClick={() => setOpen(open === i ? -1 : i)}
          className="bg-white rounded-2xl px-[26px] py-[22px] cursor-pointer border border-[#ece8fb]"
        >
          <div className="flex items-center justify-between gap-5">
            <div className="text-[15.5px] font-bold" style={{ color: "#181432" }}>{faq.q}</div>
            <div className="text-xl flex-none" style={{ color: "#6d28d9" }}>{open === i ? "–" : "+"}</div>
          </div>
          {open === i && (
            <div className="text-[14.5px] leading-relaxed mt-3.5" style={{ color: "#665f8c" }}>
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
