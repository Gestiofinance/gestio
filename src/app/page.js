import Link from "next/link";
import Image from "next/image";
import FeatureTabs from "@/components/landing/FeatureTabs";
import FaqSection from "@/components/landing/FaqSection";
import TestimonialsMarquee from "@/components/landing/TestimonialsMarquee";

const GRADIENT = "linear-gradient(135deg,#4f46e5,#9333ea)";
const GRADIENT_120 = "linear-gradient(120deg,#4f46e5,#9333ea)";

const CARD_STYLE = {
  background: "#fff",
  borderRadius: "20px",
  border: "1px solid #ece8fb",
  boxShadow: "0 16px 40px rgba(76,29,149,0.08)",
  padding: "20px",
  textAlign: "left",
};

function iconWrapStyle(light) {
  return {
    width: "34px",
    height: "34px",
    borderRadius: "9px",
    background: light,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "14px",
  };
}

const hues = [
  { light: "#ede9fe", stroke: "#6d28d9" },
  { light: "#fae8ff", stroke: "#a21caf" },
  { light: "#e0e7ff", stroke: "#4338ca" },
  { light: "#fce7f3", stroke: "#be185d" },
];

function FacturationIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

function ClientsIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ProjetsIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ComptaIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

function TempsIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20v-6M6 20V10M18 20V4" />
    </svg>
  );
}

function RetardIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

function ChiffresIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 15l4-6 3 4 5-8" />
    </svg>
  );
}

function EquipeIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const heroCards = [
  { Icon: FacturationIcon, hue: hues[0], title: "Facturation", desc: "Factures et devis envoyés en quelques clics." },
  { Icon: ClientsIcon, hue: hues[1], title: "Clients", desc: "Toutes vos relations clients centralisées." },
  { Icon: ProjetsIcon, hue: hues[2], title: "Projets", desc: "Suivi des tâches et échéances en temps réel." },
  { Icon: ComptaIcon, hue: hues[3], title: "Comptabilité", desc: "Recettes, dépenses et trésorerie en un coup d'œil." },
];

const stats = [
  { value: "500+", label: "entreprises actives" },
  { value: "12M+", label: "FCFA facturés" },
  { value: "4,8/5", label: "satisfaction client" },
  { value: "14 j", label: "d'essai gratuit" },
];

const bullets = [
  { title: "Suivi du chiffre d'affaires", desc: "Visualisez l'évolution de vos revenus mois après mois." },
  { title: "Gestion des tâches à faire", desc: "Priorités, échéances et statuts toujours à jour." },
  { title: "Factures et devis liés", desc: "Retrouvez en un clic toutes les dernières factures émises." },
];

const plans = [
  {
    name: "Essentiel", price: "5 000 FCFA", period: "par mois", featured: false,
    features: ["1 utilisateur", "Factures & devis illimités", "Jusqu'à 20 clients", "Support par email"],
  },
  {
    name: "Pro", price: "15 000 FCFA", period: "par mois", featured: true,
    features: ["5 utilisateurs", "Clients & projets illimités", "Comptabilité & rapports", "Planning et tâches d'équipe", "Support prioritaire"],
  },
  {
    name: "Entreprise", price: "35 000 FCFA", period: "par mois", featured: false,
    features: ["Utilisateurs illimités", "Toutes les fonctionnalités Pro", "Accès API", "Accompagnement dédié"],
  },
];

const benefits = [
  { Icon: TempsIcon, hue: hues[0], title: "Gagnez du temps", desc: "Créez une facture ou un devis en moins de 2 minutes, sans papier ni tableur." },
  { Icon: RetardIcon, hue: hues[1], title: "Zéro retard de paiement", desc: "Relances automatiques et suivi des factures impayées en un coup d'œil." },
  { Icon: ChiffresIcon, hue: hues[2], title: "Décidez avec des chiffres", desc: "Chiffre d'affaires, dépenses et trésorerie en FCFA, mis à jour en continu." },
  { Icon: EquipeIcon, hue: hues[3], title: "Toute l'équipe alignée", desc: "Clients, projets, tâches et planning partagés avec votre équipe." },
];

const footerLinks = {
  Produit: ["Facturation", "Devis", "Clients & projets", "Comptabilité"],
  Entreprise: ["À propos", "Blog", "Tarifs", "Contact"],
  Support: ["Centre d'aide", "FAQ", "Confidentialité", "Conditions"],
};

export default function HomePage() {
  return (
    <div style={{ background: "#ffffff", color: "#1e1b3a", overflow: "hidden" }}>

      {/* ── HERO ── */}
      <div style={{ position: "relative", background: "#f6f4fe", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-220px", left: "-160px", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle,rgba(79,70,229,0.35),rgba(79,70,229,0) 70%)", filter: "blur(10px)" }} />
        <div style={{ position: "absolute", top: "-100px", right: "-200px", width: "650px", height: "650px", borderRadius: "50%", background: "radial-gradient(circle,rgba(192,38,211,0.28),rgba(192,38,211,0) 70%)", filter: "blur(10px)" }} />

        {/* NAV */}
        <div className="relative max-w-[1200px] mx-auto flex items-center justify-between px-8 py-7">
          <Image src="/landing/gestio-logo.webp" alt="Gestio" width={130} height={34} style={{ height: "34px", width: "auto" }} unoptimized priority />
          <div className="hidden md:flex items-center gap-9 text-[15px] font-medium" style={{ color: "#3d3763" }}>
            <a href="#fonctionnalites" style={{ color: "#3d3763" }}>Fonctionnalités</a>
            <a href="#tarifs" style={{ color: "#3d3763" }}>Tarifs</a>
            <a href="#avis" style={{ color: "#3d3763" }}>Avis clients</a>
            <a href="#faq" style={{ color: "#3d3763" }}>FAQ</a>
          </div>
          <div className="flex items-center gap-3.5">
            <Link href="/login" className="text-[15px] font-semibold" style={{ color: "#3d3763" }}>Connexion</Link>
            <Link href="/inscription" className="whitespace-nowrap text-white font-semibold text-[15px] px-[22px] py-[11px] rounded-xl" style={{ background: GRADIENT_120, boxShadow: "0 8px 20px rgba(124,58,237,0.35)" }}>
              Essai gratuit
            </Link>
          </div>
        </div>

        {/* HERO CONTENT */}
        <div className="relative max-w-[840px] mx-auto px-8 text-center" style={{ marginTop: "60px" }}>
          <div className="inline-block rounded-full text-[13px] font-semibold mb-[22px]" style={{ padding: "7px 16px", background: "#ffffffaa", border: "1px solid #e3defc", color: "#6d28d9" }}>
            Fait pour les entrepreneurs africains
          </div>
          <h1 className="font-extrabold" style={{ fontSize: "56px", lineHeight: 1.08, margin: "0 0 20px", letterSpacing: "-1.5px", color: "#181432" }}>
            Gérez votre entreprise,<br />tout en un seul endroit
          </h1>
          <p className="mx-auto" style={{ fontSize: "18px", lineHeight: 1.6, color: "#5c5680", maxWidth: "600px", margin: "0 auto 34px" }}>
            Factures, devis, clients, projets et comptabilité : Gestio réunit tous les outils dont votre TPE ou PME a besoin, en FCFA, sans complexité.
          </p>
          <div className="flex items-center justify-center" style={{ marginBottom: "56px" }}>
            <Link href="/inscription" className="whitespace-nowrap text-white font-semibold text-[15px]" style={{ background: GRADIENT_120, padding: "14px 24px", borderRadius: "12px", boxShadow: "0 10px 24px rgba(124,58,237,0.35)" }}>
              Démarrer gratuitement
            </Link>
          </div>
        </div>

        {/* MINI STAT CARDS */}
        <div className="relative max-w-[1080px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-5 px-8" style={{ paddingBottom: "90px" }}>
          {heroCards.map((c) => (
            <div key={c.title} style={CARD_STYLE}>
              <div style={iconWrapStyle(c.hue.light)}>
                <c.Icon color={c.hue.stroke} />
              </div>
              <div className="text-sm font-bold mb-1.5" style={{ color: "#181432" }}>{c.title}</div>
              <div className="text-[12.5px] leading-relaxed" style={{ color: "#8b85ab" }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div style={{ background: "#181432", padding: "34px 32px" }}>
        <div className="max-w-[1000px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-5 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-extrabold" style={{ fontSize: "30px", background: GRADIENT_120, WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                {s.value}
              </div>
              <div className="text-[13px] mt-1" style={{ color: "#a7a1c9" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURE TABS ── */}
      <div id="fonctionnalites" className="max-w-[1140px] mx-auto text-center" style={{ padding: "100px 32px 40px" }}>
        <div className="inline-block rounded-full text-[13px] font-semibold mb-[18px]" style={{ padding: "6px 14px", background: "#f3effe", color: "#6d28d9" }}>
          Fonctionnalités
        </div>
        <h2 className="font-extrabold" style={{ fontSize: "38px", letterSpacing: "-1px", margin: "0 0 14px", color: "#181432" }}>
          Toute la gestion de votre activité,<br />réunie dans un seul outil
        </h2>
        <p className="mx-auto" style={{ fontSize: "16.5px", color: "#665f8c", maxWidth: "560px", margin: "0 auto 40px" }}>
          Passez du devis à la facture payée sans jongler entre dix outils différents.
        </p>
        <FeatureTabs />
      </div>

      {/* ── FEATURE SPLIT ── */}
      <div className="max-w-[1140px] mx-auto grid lg:grid-cols-2 gap-[70px] items-center" style={{ padding: "110px 32px" }}>
        <div>
          <div className="inline-block rounded-full text-[13px] font-semibold mb-[18px]" style={{ padding: "6px 14px", background: "#f3effe", color: "#6d28d9" }}>
            Pensé pour l&apos;Afrique
          </div>
          <h2 className="font-extrabold" style={{ fontSize: "34px", letterSpacing: "-0.8px", margin: "0 0 18px", color: "#181432", lineHeight: 1.2 }}>
            Un tableau de bord clair pour piloter votre chiffre d&apos;affaires
          </h2>
          <p style={{ fontSize: "16px", color: "#665f8c", lineHeight: 1.65, margin: "0 0 28px" }}>
            Suivez vos revenus en FCFA, vos dépenses et vos tâches en cours en un coup d&apos;œil, sans tableur ni paperasse.
          </p>
          <div className="flex flex-col gap-5">
            {bullets.map((b) => (
              <div key={b.title} className="flex gap-3.5 items-start">
                <div className="flex-none flex items-center justify-center text-white font-bold" style={{ width: "26px", height: "26px", borderRadius: "9px", background: GRADIENT_120, fontSize: "14px" }}>
                  ✓
                </div>
                <div>
                  <div className="font-bold" style={{ fontSize: "15.5px", color: "#181432", marginBottom: "3px" }}>{b.title}</div>
                  <div style={{ fontSize: "14px", color: "#8b85ab", lineHeight: 1.55 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Image src="/landing/shot-dashboard.webp" alt="Tableau de bord Gestio" width={1140} height={700} className="block w-full h-auto" unoptimized />
      </div>

      {/* ── PRICING ── */}
      <div id="tarifs" style={{ background: "#f6f4fe", padding: "110px 32px" }}>
        <div className="max-w-[1000px] mx-auto text-center">
          <div className="inline-block rounded-full text-[13px] font-semibold mb-[18px]" style={{ padding: "6px 14px", background: "#ffffff", color: "#6d28d9" }}>
            Tarifs
          </div>
          <h2 className="font-extrabold" style={{ fontSize: "38px", letterSpacing: "-1px", margin: "0 0 14px", color: "#181432" }}>
            Des offres simples, en FCFA
          </h2>
          <p style={{ fontSize: "16.5px", color: "#665f8c", margin: "0 0 56px" }}>
            Changez de formule à tout moment selon la croissance de votre activité.
          </p>

          <div className="grid sm:grid-cols-3 gap-6 text-left">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="relative bg-white"
                style={{
                  borderRadius: "18px",
                  padding: "32px 28px",
                  border: plan.featured ? "2px solid #6d28d9" : "1px solid #ece8fb",
                  boxShadow: plan.featured ? "0 20px 50px rgba(109,40,217,0.2)" : "0 10px 30px rgba(35,20,90,0.06)",
                }}
              >
                {plan.featured && (
                  <div className="absolute text-white font-bold" style={{ top: "-13px", right: "28px", background: GRADIENT_120, fontSize: "12px", padding: "5px 12px", borderRadius: "100px" }}>
                    Populaire
                  </div>
                )}
                <div className="font-bold" style={{ fontSize: "15px", color: "#181432", marginBottom: "10px" }}>{plan.name}</div>
                <div className="font-extrabold" style={{ fontSize: "34px", color: "#181432", marginBottom: "2px" }}>{plan.price}</div>
                <div style={{ fontSize: "13px", color: "#8b85ab", marginBottom: "24px" }}>{plan.period}</div>
                <div className="flex flex-col gap-3" style={{ marginBottom: "28px" }}>
                  {plan.features.map((f) => (
                    <div key={f} className="flex gap-2.5 items-start" style={{ fontSize: "14px", color: "#4b4570" }}>
                      <span className="font-bold" style={{ color: "#6d28d9" }}>✓</span>{f}
                    </div>
                  ))}
                </div>
                <Link
                  href="/inscription"
                  className="block text-center font-bold"
                  style={{
                    padding: "13px", borderRadius: "12px", fontSize: "14.5px",
                    background: plan.featured ? GRADIENT_120 : "#f3effe",
                    color: plan.featured ? "#fff" : "#181432",
                  }}
                >
                  Choisir {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── BENEFITS ── */}
      <div id="avis" className="max-w-[1140px] mx-auto" style={{ padding: "110px 32px" }}>
        <div className="text-center" style={{ marginBottom: "56px" }}>
          <div className="inline-block rounded-full text-[13px] font-semibold mb-[18px]" style={{ padding: "6px 14px", background: "#f3effe", color: "#6d28d9" }}>
            Pourquoi Gestio
          </div>
          <h2 className="font-extrabold" style={{ fontSize: "38px", letterSpacing: "-1px", margin: "0 0 14px", color: "#181432" }}>
            Conçu pour les entrepreneurs qui n&apos;ont pas de temps à perdre
          </h2>
        </div>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-7">
          <div className="relative rounded-[20px] overflow-hidden" style={{ minHeight: "420px" }}>
            <Image src="/landing/entrepreneur-photo.webp" alt="Entrepreneur utilisant Gestio" fill className="object-cover" unoptimized />
          </div>
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" style={{ marginBottom: "20px" }}>
              {benefits.map((b) => (
                <div key={b.title} style={CARD_STYLE}>
                  <div style={iconWrapStyle(b.hue.light)}>
                    <b.Icon color={b.hue.stroke} />
                  </div>
                  <div className="font-bold" style={{ fontSize: "15.5px", color: "#181432", marginBottom: "6px" }}>{b.title}</div>
                  <div style={{ fontSize: "13px", color: "#665f8c", lineHeight: 1.55 }}>{b.desc}</div>
                </div>
              ))}
            </div>
            <Link href="/inscription" className="inline-block text-white font-bold" style={{ background: GRADIENT_120, fontSize: "15px", padding: "14px 28px", borderRadius: "12px", boxShadow: "0 10px 24px rgba(124,58,237,0.3)" }}>
              Démarrer avec Gestio →
            </Link>
          </div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div id="faq" style={{ background: "#f6f4fe", padding: "110px 32px" }}>
        <div className="max-w-[760px] mx-auto">
          <div className="text-center" style={{ marginBottom: "50px" }}>
            <div className="inline-block rounded-full text-[13px] font-semibold mb-[18px]" style={{ padding: "6px 14px", background: "#ffffff", color: "#6d28d9" }}>
              FAQ
            </div>
            <h2 className="font-extrabold" style={{ fontSize: "34px", letterSpacing: "-0.8px", margin: 0, color: "#181432" }}>
              Vos questions, nos réponses
            </h2>
          </div>
          <FaqSection />
        </div>
      </div>

      {/* ── CTA BAND ── */}
      <div className="relative overflow-hidden text-center" style={{ background: GRADIENT, padding: "100px 32px" }}>
        <div className="absolute" style={{ top: "-160px", left: "-100px", width: "420px", height: "420px", borderRadius: "50%", background: "radial-gradient(circle,rgba(255,255,255,0.18),transparent 70%)" }} />
        <div className="relative max-w-[960px] mx-auto">
          <h2 className="font-extrabold text-white" style={{ fontSize: "36px", letterSpacing: "-0.8px", margin: "0 0 40px" }}>
            Ils gèrent déjà leur entreprise avec Gestio
          </h2>
        </div>
        <div className="relative">
          <TestimonialsMarquee />
        </div>
        <div className="relative max-w-[960px] mx-auto">
          <div className="flex items-center justify-center flex-wrap gap-3.5">
            <Link href="/inscription" className="whitespace-nowrap text-white font-bold" style={{ background: "#181432", fontSize: "15px", padding: "14px 26px", borderRadius: "12px" }}>
              Essai gratuit — 14 jours
            </Link>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ background: "#12102b", padding: "70px 32px 32px" }}>
        <div className="max-w-[1140px] mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-10" style={{ marginBottom: "56px" }}>
            <div>
              <Image src="/landing/gestio-logo.webp" alt="Gestio" width={110} height={30} style={{ height: "30px", width: "auto", marginBottom: "16px" }} unoptimized />
              <p style={{ fontSize: "14px", color: "#8b85ab", lineHeight: 1.6, maxWidth: "260px" }}>
                La plateforme de gestion tout-en-un pour les entrepreneurs et PME francophones.
              </p>
            </div>
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <div className="font-bold text-white" style={{ fontSize: "13px", marginBottom: "16px" }}>{title}</div>
                <div className="flex flex-col gap-2.5" style={{ fontSize: "14px", color: "#a7a1c9" }}>
                  {links.map((l) => (
                    <a key={l} href="#" style={{ color: "#a7a1c9" }}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between" style={{ borderTop: "1px solid #2a2750", paddingTop: "24px", fontSize: "13px", color: "#736d99" }}>
            <div>© {new Date().getFullYear()} Gestio. Tous droits réservés.</div>
            <div className="flex gap-6">
              <a href="#" style={{ color: "#736d99" }}>Confidentialité</a>
              <a href="#" style={{ color: "#736d99" }}>Conditions</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
