import Link from "next/link";
import {
  Users,
  Receipt,
  FolderKanban,
  PieChart,
  ArrowRight,
  Smartphone,
  Shield,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Gestion Clients",
    description: "CRM complet avec historique, segmentation et suivi des interactions.",
  },
  {
    icon: Receipt,
    title: "Facturation",
    description: "Devis et factures conformes aux normes fiscales sénégalaises avec paiement en ligne.",
  },
  {
    icon: FolderKanban,
    title: "Projets & Tâches",
    description: "Pilotez vos projets avec des vues Kanban, calendrier et suivi de rentabilité.",
  },
  {
    icon: PieChart,
    title: "Comptabilité",
    description: "Tableau de bord financier, suivi des dépenses et rapports comptables.",
  },
];

const benefits = [
  { icon: Smartphone, text: "Paiements Wave, Orange Money, Free Money intégrés" },
  { icon: Shield, text: "Données sécurisées et conformes RGPD" },
  { icon: Zap, text: "Interface rapide et intuitive, accessible partout" },
];

export default function HomePage() {
  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="border-b border-border bg-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold gradient-text">Gestio</span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-foreground"
            >
              Connexion
            </Link>
            <Link
              href="/inscription"
              className="gradient-bg gradient-bg-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-all"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Nouveau — Essai gratuit 7 jours
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
            Tout votre business,{" "}
            <span className="gradient-text">un seul outil</span>
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto mb-10">
            Gestio réunit clients, projets, factures et comptabilité dans une
            plateforme unique, conçue pour les entrepreneurs africains.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/inscription"
              className="gradient-bg gradient-bg-hover text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg transition-all inline-flex items-center gap-2"
            >
              Démarrer gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="text-slate-600 hover:text-foreground font-medium px-8 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all"
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits bar */}
      <section className="border-y border-border bg-white py-6">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-center gap-8">
          {benefits.map((b) => (
            <div key={b.text} className="flex items-center gap-2 text-sm text-slate-600">
              <b.icon className="w-4 h-4 text-primary-500" />
              {b.text}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-3">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-muted max-w-xl mx-auto">
              Une suite complète d&apos;outils de gestion, pensée pour
              simplifier votre quotidien d&apos;entrepreneur.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-md transition-shadow"
              >
                <div className="inline-flex p-3 rounded-xl bg-primary-50 mb-4">
                  <f.icon className="w-6 h-6 text-primary-500" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-muted leading-relaxed">
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-24 px-6 bg-white border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Des tarifs adaptés à votre activité
          </h2>
          <p className="text-muted mb-10">
            À partir de 9 000 FCFA/mois. Essai gratuit 14 jours sans engagement.
            <strong className="text-foreground"> -12% sur l&apos;abonnement annuel.</strong>
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { name: "Standard", price: "9 000", period: "/mois", desc: "1 utilisateur · 15 factures/mois · Tous les modules" },
              { name: "Pro", price: "14 500", period: "/mois", desc: "Utilisateurs illimités · Factures illimitées", popular: true },
              { name: "Business", price: "25 000", period: "/trimestre", desc: "Accès complet · Support dédié" },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-8 ${
                  plan.popular
                    ? "border-primary-500 shadow-lg relative"
                    : "border-slate-200"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 gradient-bg text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Populaire
                  </span>
                )}
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <div className="mt-4 mb-2">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted"> FCFA{plan.period}</span>
                </div>
                <p className="text-sm text-muted mb-6">{plan.desc}</p>
                <Link
                  href="/inscription"
                  className={`block w-full py-2.5 rounded-lg text-sm font-medium text-center transition-all ${
                    plan.popular
                      ? "gradient-bg text-white"
                      : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Commencer
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center gradient-bg rounded-3xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à simplifier votre gestion ?
          </h2>
          <p className="text-white/80 mb-8">
            Rejoignez les entrepreneurs qui font confiance à Gestio pour piloter
            leur activité au quotidien.
          </p>
          <Link
            href="/inscription"
            className="inline-flex items-center gap-2 bg-white text-primary-600 font-semibold px-8 py-3.5 rounded-xl hover:bg-slate-50 transition-all"
          >
            Démarrer mon essai gratuit
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-semibold gradient-text">Gestio</span>
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} JC Agence — Saly Portudal, Sénégal. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
