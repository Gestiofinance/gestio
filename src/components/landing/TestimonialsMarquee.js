const reviews = [
  { quote: "Depuis que j'utilise Gestio, je passe deux fois moins de temps sur mes factures et devis.", name: "Abdou Ka", role: "Fondateur, Ka Consulting", initials: "AK" },
  { quote: "Le suivi de trésorerie en FCFA m'a fait gagner un temps fou à chaque fin de mois.", name: "Fatou Diop", role: "Gérante, Diop Services", initials: "FD" },
  { quote: "Enfin un outil simple pour gérer mes clients et mes projets sans jongler entre 3 applications.", name: "Moussa Sy", role: "Indépendant", initials: "MS" },
  { quote: "L'interface est claire, mes employés l'ont adoptée en une journée.", name: "Aïcha Traoré", role: "DG, Traoré & Fils", initials: "AT" },
  { quote: "Les devis partent en 2 minutes, mes clients sont impressionnés.", name: "Ibrahim Koné", role: "Consultant IT", initials: "IK" },
  { quote: "Enfin une compta simple, sans avoir besoin d'un comptable à temps plein.", name: "Rokia Sangaré", role: "Fondatrice, Sangaré Design", initials: "RS" },
  { quote: "Le planning d'équipe m'évite les oublis de livraison chaque semaine.", name: "Cheikh Ndiaye", role: "Gérant, Ndiaye Logistique", initials: "CN" },
  { quote: "Support réactif et outil qui évolue vite avec nos besoins.", name: "Aminata Cissé", role: "Fondatrice, Cissé Events", initials: "AC" },
  { quote: "Toutes mes factures impayées visibles d'un coup d'œil, ça change tout.", name: "Yacouba Ouédraogo", role: "Indépendant", initials: "YO" },
  { quote: "Gestio nous a fait gagner un poste administratif à temps plein.", name: "Fatoumata Bah", role: "DG, Bah Trading", initials: "FB" },
  { quote: "Simple, rapide, et pensé pour nos réalités en FCFA.", name: "Ousmane Diallo", role: "Fondateur, Diallo Services", initials: "OD" },
  { quote: "Je recommande à tous les indépendants qui galèrent avec Excel.", name: "Mariam Kaba", role: "Consultante RH", initials: "MK" },
];

function ReviewCard({ r }) {
  return (
    <div className="bg-white/10 border border-white/[0.18] rounded-2xl p-6 w-80 flex-none text-left">
      <div className="text-amber-300 text-sm tracking-[2px] mb-3">★★★★★</div>
      <p className="text-[14.5px] leading-relaxed text-white mb-[18px]">&laquo; {r.quote} &raquo;</p>
      <div className="flex items-center gap-2.5">
        <div className="w-[34px] h-[34px] rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center">
          {r.initials}
        </div>
        <div>
          <div className="font-bold text-[13.5px] text-white">{r.name}</div>
          <div className="text-xs text-[#e6defc]">{r.role}</div>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsMarquee() {
  return (
    <div className="gestio-marquee-wrap relative overflow-hidden mb-10">
      <div className="gestio-marquee-track flex gap-5 w-max">
        {reviews.map((r) => (
          <ReviewCard key={`a-${r.name}`} r={r} />
        ))}
        {reviews.map((r) => (
          <ReviewCard key={`b-${r.name}`} r={r} />
        ))}
      </div>
    </div>
  );
}
