import Link from "next/link";
import Image from "next/image";
import ContactForm from "@/components/landing/ContactForm";
import FaqAccordion from "@/components/landing/FaqAccordion";
import Header from "@/components/landing/Header";
import {
  ArrowRight, Users, Receipt, FolderKanban, PieChart, Calendar,
  Users2, CheckCircle, Star, Phone, Mail, MapPin, Shield,
  CreditCard, Headphones, Globe, AlertCircle, Layers, TrendingUp, Rocket,
} from "lucide-react";

const features = [
  { icon: Users, title: "CRM & Clients", desc: "Gérez vos contacts, historique, segments et relances client en un seul endroit.", color: "bg-blue-50 text-blue-600" },
  { icon: Receipt, title: "Devis & Factures", desc: "Créez des documents professionnels conformes aux normes fiscales avec paiement en ligne.", color: "bg-violet-50 text-violet-600" },
  { icon: FolderKanban, title: "Projets & Tâches", desc: "Pilotez vos projets en vue Kanban ou calendrier avec suivi de rentabilité.", color: "bg-emerald-50 text-emerald-600" },
  { icon: PieChart, title: "Comptabilité", desc: "Tableau de bord financier, suivi des dépenses, rapports et export PDF.", color: "bg-orange-50 text-orange-600" },
  { icon: Calendar, title: "Planning", desc: "Organisez votre agenda et planifiez vos rendez-vous clients et équipe.", color: "bg-pink-50 text-pink-600" },
  { icon: Users2, title: "Gestion d'équipe", desc: "Invitez vos collaborateurs, définissez les rôles et gérez les accès.", color: "bg-cyan-50 text-cyan-600" },
];

const plans = [
  {
    name: "Standard", price: "9 000", period: "mois", badge: null,
    desc: "Idéal pour démarrer votre activité",
    features: ["1 utilisateur", "15 factures / mois", "Tous les modules", "Support email", "Essai 7 jours gratuit"],
  },
  {
    name: "Pro", price: "14 500", period: "mois", badge: "Populaire",
    desc: "Pour les équipes en croissance",
    features: ["Utilisateurs illimités", "Factures illimitées", "Tous les modules", "Rapport PDF avancé", "Support prioritaire", "Essai 7 jours gratuit"],
  },
  {
    name: "Business", price: "25 000", period: "trimestre", badge: "-12%",
    desc: "Pour les entreprises établies",
    features: ["Tout du plan Pro", "Onboarding personnalisé", "Support dédié 24/7", "API & intégrations", "Domaine personnalisé", "Essai 7 jours gratuit"],
  },
];

const testimonials = [
  { name: "Aminata Diallo", role: "Directrice, Diallo Consulting", avatar: "AD", text: "Gestio a transformé ma façon de gérer mon activité. La facturation est un jeu d'enfant et le suivi de mes clients est enfin centralisé. Je gagne au moins 2h par jour.", stars: 5 },
  { name: "Moussa Sarr", role: "Fondateur, MS Digital Agency", avatar: "MS", text: "J'utilisais plusieurs outils séparés avant Gestio. Maintenant tout est dans une seule plateforme, même mes paiements Wave et Orange Money. Excellent produit !", stars: 5 },
  { name: "Fatou Ndiaye", role: "Gérante, FN Boutique", avatar: "FN", text: "Simple, rapide et en français. Mes devis sont professionnels et mes clients le remarquent. Le support est très réactif. Je recommande à tous les entrepreneurs.", stars: 5 },
];

const aidaCards = [
  {
    step: "A", stepLabel: "Attention",
    icon: AlertCircle,
    iconBg: "bg-red-50", iconColor: "text-red-500",
    badgeBg: "bg-red-100", badgeColor: "text-red-600",
    title: "Marre de jongler entre 10 outils ?",
    desc: "Emails, Excel, WhatsApp, applications séparées… Vous perdez 2h par jour à chercher vos données au lieu de développer votre activité.",
    visual: "bg-gradient-to-br from-red-50 to-orange-50",
    dot: "bg-red-400",
  },
  {
    step: "I", stepLabel: "Intérêt",
    icon: Layers,
    iconBg: "bg-blue-50", iconColor: "text-blue-500",
    badgeBg: "bg-blue-100", badgeColor: "text-blue-600",
    title: "Un seul outil pour tout gérer",
    desc: "CRM, devis, factures, projets, comptabilité… Gestio centralise tout dans une interface 100% en français, pensée pour l'Afrique.",
    visual: "bg-gradient-to-br from-blue-50 to-indigo-50",
    dot: "bg-blue-400",
  },
  {
    step: "D", stepLabel: "Désir",
    icon: TrendingUp,
    iconBg: "bg-emerald-50", iconColor: "text-emerald-500",
    badgeBg: "bg-emerald-100", badgeColor: "text-emerald-600",
    title: "+2h gagnées chaque jour",
    desc: "Nos clients automatisent relances, rapports et paiements. Résultat : plus de temps pour développer leur business, moins de stress.",
    visual: "bg-gradient-to-br from-emerald-50 to-teal-50",
    dot: "bg-emerald-400",
  },
  {
    step: "A", stepLabel: "Action",
    icon: Rocket,
    iconBg: "bg-violet-50", iconColor: "text-violet-500",
    badgeBg: "bg-violet-100", badgeColor: "text-violet-600",
    title: "Essayez 7 jours, sans risque",
    desc: "Sans carte bancaire, sans engagement. Rejoignez 500+ entrepreneurs qui pilotent leur activité avec Gestio dès aujourd'hui.",
    visual: "bg-gradient-to-br from-violet-50 to-purple-50",
    dot: "bg-violet-400",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Fixed floating Header ── */}
      <Header />

      {/* ══════════════════════════════════════════
          HERO WRAPPER — gradient mesh background
      ══════════════════════════════════════════ */}
      <div className="relative pb-32" style={{
        background: `
          radial-gradient(ellipse 65% 55% at 8% 25%, rgba(67,56,202,0.65) 0%, transparent 70%),
          radial-gradient(ellipse 55% 50% at 88% 15%, rgba(6,148,162,0.55) 0%, transparent 70%),
          radial-gradient(ellipse 50% 60% at 55% 92%, rgba(109,40,217,0.45) 0%, transparent 70%),
          radial-gradient(ellipse 40% 35% at 25% 70%, rgba(124,58,237,0.35) 0%, transparent 70%),
          linear-gradient(160deg, #4338ca 0%, #6366f1 30%, #0891b2 65%, #7c3aed 100%)
        `,
      }}>

        {/* Subtle noise texture layer */}
        <div className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")" }}
        />

        {/* ── HERO CONTENT — pt accounts for fixed header ── */}
        <section className="relative z-10 pt-44 pb-10 px-6 text-center">
          <div className="max-w-3xl mx-auto">

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-extrabold text-white leading-[1.1] tracking-tight mb-6 drop-shadow-sm">
              Gérez tout votre business,
              <br />
              <span className="text-white">au même endroit</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-white/80 max-w-xl mx-auto mb-10 leading-relaxed">
              Gestio réunit CRM, projets, devis, facturation et comptabilité dans une plateforme 100% en français, pensée pour le marché africain.
            </p>

            {/* CTA button */}
            <Link
              href="/inscription"
              className="inline-flex items-center gap-2 bg-white font-bold px-10 py-4 rounded-full text-base shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all"
              style={{ color: "#5E5CE6" }}
            >
              Commencer maintenant
              <ArrowRight className="w-4 h-4" />
            </Link>

            <p className="mt-5 text-xs text-white/60">
              Aucune carte bancaire requise · Annulation à tout moment
            </p>
          </div>
        </section>

        {/* ── AIDA CARDS — overlapping the bottom of gradient ── */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-1/2 z-20 px-4 sm:px-6 lg:px-10">
          <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
            {aidaCards.map((card) => (
              <div key={card.stepLabel}
                className="bg-white rounded-2xl p-5 shadow-xl border border-slate-100/80 flex flex-col gap-3 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">

                {/* Top: icon */}
                <div className="flex items-start justify-end">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                    <card.icon className={`w-4.5 h-4.5 ${card.iconColor}`} strokeWidth={2} />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1.5">{card.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{card.desc}</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center gap-1 mt-auto pt-1">
                  {["A", "I", "D", "A"].map((s, i) => (
                    <div key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${s === card.step && i === aidaCards.indexOf(card) ? "bg-gradient-to-r from-violet-500 to-indigo-500" : "bg-slate-100"}`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* End hero wrapper — spacer for overlapping cards */}
      <div className="h-28 sm:h-32 bg-white" />

      {/* ── TRUST BAR ── */}
      <section className="border-y border-slate-100 bg-slate-50 py-6">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10 text-sm text-slate-500">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4 text-indigo-500" /> Données sécurisées & hébergées en Europe</div>
            <div className="hidden md:block w-px h-4 bg-slate-300" />
            <div className="flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-500" /> Wave · Orange Money · Free Money intégrés</div>
            <div className="hidden md:block w-px h-4 bg-slate-300" />
            <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-indigo-500" /> Interface 100% en français</div>
            <div className="hidden md:block w-px h-4 bg-slate-300" />
            <div className="flex items-center gap-2"><Headphones className="w-4 h-4 text-indigo-500" /> Support réactif basé au Sénégal</div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="fonctionnalites" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3 block">Fonctionnalités</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Tout ce dont votre entreprise a besoin
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Une suite complète d'outils de gestion réunis dans une interface simple et intuitive.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group p-6 rounded-2xl border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-lg transition-all cursor-default">
                <div className={`inline-flex p-3 rounded-xl ${f.color} mb-4`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCT SHOWCASE 1 ── */}
      <section className="py-24 px-6" style={{ background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)" }}>
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3 block">Facturation</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-5 leading-tight">
              Des devis et factures professionnels en quelques clics
            </h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Créez des documents conformes aux normes fiscales sénégalaises, envoyez-les par email ou WhatsApp et suivez les paiements en temps réel. Vos clients peuvent payer directement par Wave ou Orange Money.
            </p>
            <ul className="space-y-3 mb-8">
              {["Devis convertibles en factures en 1 clic", "Paiement en ligne Wave & Orange Money", "Rappels automatiques de paiement", "Export PDF personnalisé avec votre logo"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/inscription" className="inline-flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-xl transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg,#5E5CE6,#7C3AED)" }}>
              Essayer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl opacity-30" style={{ background: "linear-gradient(135deg,#5E5CE6,#7C3AED)" }} />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white">
              <Image
                src="/application%20de%20gestion%20entreprise%20senegal%20Gestio00002.png"
                alt="Module Facturation Gestio"
                width={720} height={480}
                className="w-full object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCT SHOWCASE 2 ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="absolute -inset-4 rounded-3xl opacity-20 bg-emerald-400" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-100">
              <Image
                src="/application%20de%20gestion%20entreprise%20senegal%20Gestio00003.png"
                alt="CRM & Gestion clients Gestio"
                width={720} height={480}
                className="w-full object-cover"
                unoptimized
              />
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 mb-3 block">CRM & Clients</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-5 leading-tight">
              Une vue complète sur chaque client
            </h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Centralisez toutes les informations de vos clients — historique des transactions, devis, projets et communications. Ne laissez plus aucune opportunité passer.
            </p>
            <ul className="space-y-3 mb-8">
              {["Fiche client complète & historique", "Import de contacts en masse", "Segmentation & tags personnalisés", "Statistiques par client"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/inscription" className="inline-flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-xl transition-all hover:opacity-90 bg-emerald-600">
              Essayer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── PRODUCT SHOWCASE 3 ── */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-orange-500 mb-3 block">Comptabilité</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-5 leading-tight">
              Vos finances sous contrôle en temps réel
            </h2>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Suivez vos recettes, dépenses et trésorerie depuis un tableau de bord clair. Générez des rapports financiers complets et prenez de meilleures décisions pour votre activité.
            </p>
            <ul className="space-y-3 mb-8">
              {["Tableau de bord financier en temps réel", "Suivi des dépenses par catégorie", "Rapport financier PDF téléchargeable", "Calcul automatique de la trésorerie"].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm text-slate-700">
                  <CheckCircle className="w-4 h-4 text-orange-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/inscription" className="inline-flex items-center gap-2 text-sm font-semibold text-white px-6 py-3 rounded-xl transition-all hover:opacity-90 bg-orange-500">
              Essayer gratuitement <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl opacity-20 bg-orange-300" />
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-100">
              <Image
                src="/application%20de%20gestion%20entreprise%20senegal%20Gestio00004.png"
                alt="Comptabilité Gestio"
                width={720} height={480}
                className="w-full object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── SCREENSHOTS GALLERY ── */}
      <section className="py-20 px-6 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Découvrez chaque module</h2>
            <p className="text-slate-500 text-sm">Une interface pensée pour être simple et efficace</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { src: "/application%20de%20gestion%20entreprise%20senegal%20Gestio00005.png", alt: "Gestion de projets" },
              { src: "/application%20de%20gestion%20entreprise%20senegal%20Gestio00006.png", alt: "Planning et tâches" },
              { src: "/application%20de%20gestion%20entreprise%20senegal%20Gestio00003.png", alt: "Module clients" },
            ].map((img) => (
              <div key={img.src} className="group relative rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                <Image src={img.src} alt={img.alt} width={480} height={300} className="w-full object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="temoignages" className="py-24 px-6" style={{ background: "linear-gradient(135deg, #f5f3ff, #ede9fe)" }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3 block">Témoignages</span>
            <h2 className="text-3xl font-extrabold text-slate-900">Ce qu'en disent nos clients</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg,#5E5CE6,#7C3AED)" }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="tarifs" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3 block">Tarifs</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Des prix adaptés à votre activité</h2>
            <p className="text-slate-500">Commencez gratuitement. Upgradez quand vous êtes prêt.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-2xl p-7 flex flex-col ${plan.badge === "Populaire" ? "border-2 border-indigo-500 shadow-xl" : "border border-slate-200"}`}>
                {plan.badge && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full text-white"
                    style={{ background: plan.badge === "Populaire" ? "linear-gradient(135deg,#5E5CE6,#7C3AED)" : "#0f172a" }}>
                    {plan.badge}
                  </span>
                )}
                <div className="mb-6">
                  <h3 className="text-base font-bold text-slate-900 mb-1">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mb-4">{plan.desc}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-extrabold text-slate-900">{plan.price}</span>
                    <span className="text-sm text-slate-500 mb-1">FCFA / {plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
                <Link href="/inscription"
                  className={`block w-full py-3 rounded-xl text-sm font-semibold text-center transition-all ${plan.badge === "Populaire" ? "text-white hover:opacity-90" : "border border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                  style={plan.badge === "Populaire" ? { background: "linear-gradient(135deg,#5E5CE6,#7C3AED)" } : undefined}>
                  Commencer
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-8">
            Tous les plans incluent un essai gratuit de 7 jours sans carte bancaire. <br />
            Paiement via Wave, Orange Money, virement ou carte bancaire.
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3 block">FAQ</span>
            <h2 className="text-3xl font-extrabold text-slate-900">Questions fréquentes</h2>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-start">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-500 mb-3 block">Contact</span>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-5">
              Une question ? <br />Parlons-en.
            </h2>
            <p className="text-slate-600 mb-10 leading-relaxed">
              Notre équipe basée à Saly Portudal, Sénégal, est disponible pour répondre à toutes vos questions et vous accompagner dans la prise en main de Gestio.
            </p>
            <div className="space-y-6">
              <a href="tel:+221777762522" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#5E5CE6,#7C3AED)" }}>
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Téléphone</p>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">+221 77 776 25 22</p>
                </div>
              </a>
              <a href="mailto:contact@gestio.sn" className="flex items-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#5E5CE6,#7C3AED)" }}>
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Email</p>
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">contact@gestio.sn</p>
                </div>
              </a>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#5E5CE6,#7C3AED)" }}>
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Adresse</p>
                  <p className="text-sm font-semibold text-slate-900">Saly Portudal, Sénégal</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Envoyez-nous un message</h3>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="mx-4 sm:mx-6 lg:mx-10 mb-10 rounded-3xl overflow-hidden" style={{
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(99,102,241,0.5) 0%, transparent 60%),
          radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.4) 0%, transparent 60%),
          linear-gradient(135deg, #4338CA 0%, #5E5CE6 50%, #7C3AED 100%)
        `,
      }}>
        <div className="relative px-8 py-16 text-center overflow-hidden">
          <div className="relative max-w-2xl mx-auto">
            <h2 className="text-3xl font-extrabold text-white mb-4">
              Prêt à simplifier votre gestion ?
            </h2>
            <p className="text-white/80 mb-8 text-base">
              Rejoignez les entrepreneurs qui pilotent leur activité avec Gestio. <br />
              7 jours d'essai gratuit, sans carte bancaire.
            </p>
            <Link href="/inscription"
              className="inline-flex items-center gap-2 bg-white font-bold px-8 py-4 rounded-full text-sm hover:shadow-xl hover:-translate-y-0.5 transition-all"
              style={{ color: "#5E5CE6" }}>
              Démarrer mon essai gratuit
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 text-slate-400 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Image src="/GESIO-logo-app.png" alt="Gestio" width={28} height={28} className="rounded-lg" />
                <span className="text-lg font-extrabold text-white">Gestio</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                La plateforme de gestion tout-en-un pour les entrepreneurs africains. CRM, facturation, projets et comptabilité en un seul outil.
              </p>
              <div className="flex items-center gap-3 mt-5 text-sm">
                <a href="tel:+221777762522" className="hover:text-white transition-colors">+221 77 776 25 22</a>
                <span>·</span>
                <a href="mailto:contact@gestio.sn" className="hover:text-white transition-colors">contact@gestio.sn</a>
              </div>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Produit</h4>
              <ul className="space-y-2.5 text-sm">
                {[["#fonctionnalites", "Fonctionnalités"], ["#tarifs", "Tarifs"], ["/inscription", "Essai gratuit"], ["/login", "Connexion"]].map(([href, label]) => (
                  <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4">Support</h4>
              <ul className="space-y-2.5 text-sm">
                {[["#contact", "Nous contacter"], ["#", "Documentation"], ["#", "Tutoriels"], ["#", "Status"]].map(([href, label]) => (
                  <li key={label}><a href={href} className="hover:text-white transition-colors">{label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>&copy; {new Date().getFullYear()} JC Agence — Saly Portudal, Sénégal. Tous droits réservés.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a>
              <a href="#" className="hover:text-white transition-colors">CGU</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
