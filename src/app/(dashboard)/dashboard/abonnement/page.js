"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/hooks/useAuth";
import { useSupabase } from "@/hooks/useSupabase";
import { formatCurrency, formatShortDate } from "@/lib/utils";
import {
  PLANS, getPlanPrice, getAnnualMonthlyEquivalent, getAnnualSavings,
} from "@/lib/plans";
import {
  CreditCard, CheckCircle, Clock, AlertCircle, Zap, Users, FileText,
  Star, Shield, ArrowRight, Loader2, Check, Crown,
} from "lucide-react";

const CYCLE_OPTIONS = [
  { id: "monthly", label: "Mensuel" },
  { id: "annual", label: "Annuel", badge: "-12%" },
];

const statusColors = {
  trial: "text-warning-500 bg-warning-50 border-warning-200",
  active: "text-success-500 bg-success-50 border-success-200",
  past_due: "text-danger-500 bg-danger-50 border-danger-200",
  cancelled: "text-slate-500 bg-slate-50 border-slate-200",
  expired: "text-slate-500 bg-slate-50 border-slate-200",
};
const statusLabels = {
  trial: "Période d'essai", active: "Actif", past_due: "Paiement en attente",
  cancelled: "Annulé", expired: "Expiré",
};

const planIcons = { standard: Zap, pro: Users, business: Crown };
const planColors = {
  standard: "border-primary-200 hover:border-primary-400",
  pro: "border-violet-200 hover:border-violet-400",
  business: "border-success-200 hover:border-success-400",
};
const planAccentColors = {
  standard: "bg-primary-500 text-white",
  pro: "bg-violet-600 text-white",
  business: "bg-success-500 text-white",
};
const planIconColors = {
  standard: "text-primary-500 bg-primary-50",
  pro: "text-violet-600 bg-violet-50",
  business: "text-success-500 bg-success-50",
};

function AbonnementContent() {
  const searchParams = useSearchParams();
  const { organization } = useAuth();
  const supabase = useSupabase();
  const [subscription, setSubscription] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState("monthly");
  const [paying, setPaying] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (organization) loadData();
  }, [organization]);

  useEffect(() => {
    const success = searchParams.get("success");
    const cancelled = searchParams.get("cancelled");
    if (success) setToast({ type: "success", msg: "Paiement reçu ! Votre abonnement est en cours d'activation." });
    if (cancelled) setToast({ type: "warn", msg: "Paiement annulé. Vous pouvez réessayer à tout moment." });
  }, [searchParams]);

  async function loadData() {
    const [{ data: sub }, { data: pays }] = await Promise.all([
      supabase.from("subscriptions").select("*").eq("organization_id", organization.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("subscription_payments").select("*").eq("organization_id", organization.id).order("created_at", { ascending: false }),
    ]);
    setSubscription(sub);
    setPayments(pays || []);
    setLoading(false);
  }

  async function handleSubscribe(planId) {
    setPaying(planId);
    try {
      const res = await fetch("/api/paytech/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          billingCycle: planId === "business" ? (cycle === "annual" ? "annual" : "quarterly") : cycle,
          organizationId: organization.id,
          organizationName: organization.name,
        }),
      });
      const data = await res.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        setToast({ type: "error", msg: data.error || "Erreur lors de l'initiation du paiement." });
      }
    } catch (e) {
      setToast({ type: "error", msg: "Erreur réseau. Veuillez réessayer." });
    }
    setPaying(null);
  }

  const isCurrentPlan = (planId) => subscription?.plan_id === planId && subscription?.status === "active";

  const trialDaysLeft = subscription?.trial_end
    ? Math.max(0, Math.ceil((new Date(subscription.trial_end) - new Date()) / 86400000))
    : null;

  const businessCyclePrice = cycle === "annual"
    ? getPlanPrice("business", "annual")
    : getPlanPrice("business", "quarterly");

  return (
    <div>
      <Header title="Abonnement" />
      <div className="p-4 sm:p-6 space-y-6">

        {/* Toast */}
        {toast && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
            toast.type === "success" ? "bg-success-50 border-success-200 text-success-600" :
            toast.type === "warn" ? "bg-warning-50 border-warning-200 text-warning-600" :
            "bg-danger-50 border-danger-200 text-danger-600"
          }`}>
            {toast.type === "success" ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{toast.msg}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-lg leading-none opacity-60 hover:opacity-100">×</button>
          </div>
        )}

        {/* Current subscription status */}
        {!loading && subscription && (
          <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border ${statusColors[subscription.status]}`}>
            <div className="flex items-center gap-3">
              {subscription.status === "active" ? <CheckCircle className="w-5 h-5 shrink-0" /> :
               subscription.status === "trial" ? <Clock className="w-5 h-5 shrink-0" /> :
               <AlertCircle className="w-5 h-5 shrink-0" />}
              <div>
                <p className="font-semibold text-sm">{statusLabels[subscription.status]}</p>
                <p className="text-xs opacity-75">
                  {subscription.status === "trial" && trialDaysLeft !== null
                    ? `${trialDaysLeft} jour${trialDaysLeft > 1 ? "s" : ""} restant${trialDaysLeft > 1 ? "s" : ""} — Plan ${PLANS[subscription.plan_id]?.name || subscription.plan_id}`
                    : subscription.current_period_end
                    ? `Renouvellement le ${formatShortDate(subscription.current_period_end)}`
                    : `Plan ${PLANS[subscription.plan_id]?.name || subscription.plan_id}`}
                </p>
              </div>
            </div>
            {subscription.status === "trial" && (
              <div className="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/60 border border-current">
                Souscrivez pour continuer après l&apos;essai
              </div>
            )}
          </div>
        )}

        {/* Billing cycle toggle */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Choisissez votre plan</h2>
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-6">
            {CYCLE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setCycle(opt.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  cycle === opt.id ? "bg-white text-foreground shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                {opt.label}
                {opt.badge && (
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-success-50 text-success-600 border border-success-200">
                    {opt.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Plans grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.values(PLANS).map((plan) => {
              const Icon = planIcons[plan.id];
              const current = isCurrentPlan(plan.id);
              const price = plan.id === "business"
                ? (cycle === "annual" ? getPlanPrice("business", "annual") : getPlanPrice("business", "quarterly"))
                : getPlanPrice(plan.id, cycle);
              const monthlyEquiv = cycle === "annual" ? getAnnualMonthlyEquivalent(plan.id) : null;
              const savings = cycle === "annual" ? getAnnualSavings(plan.id) : null;

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col bg-white rounded-2xl border-2 p-6 transition-all ${
                    plan.popular ? "border-violet-400 shadow-lg shadow-violet-100" : planColors[plan.id]
                  } ${current ? "opacity-80" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-violet-600 text-white flex items-center gap-1">
                        <Star className="w-3 h-3" /> Populaire
                      </span>
                    </div>
                  )}

                  <div className={`inline-flex p-2.5 rounded-xl w-fit mb-4 ${planIconColors[plan.id]}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted mb-4">{plan.description}</p>

                  <div className="mb-2">
                    <span className="text-3xl font-extrabold text-foreground">{formatCurrency(price)}</span>
                    <span className="text-sm text-muted ml-1">
                      {plan.id === "business"
                        ? (cycle === "annual" ? "/an" : "/trimestre")
                        : (cycle === "annual" ? "/an" : "/mois")}
                    </span>
                  </div>

                  {cycle === "annual" && monthlyEquiv && (
                    <p className="text-xs text-success-600 font-medium mb-1">
                      ≈ {formatCurrency(monthlyEquiv)}/mois
                    </p>
                  )}
                  {cycle === "annual" && savings && (
                    <p className="text-xs text-success-500 mb-4">
                      Économisez {formatCurrency(savings)}/an
                    </p>
                  )}
                  {cycle !== "annual" && <div className="mb-4" />}

                  <ul className="space-y-2 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check className="w-4 h-4 text-success-500 shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {current ? (
                    <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-success-50 text-success-600 text-sm font-semibold border border-success-200">
                      <CheckCircle className="w-4 h-4" /> Plan actuel
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={paying === plan.id}
                      className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 ${planAccentColors[plan.id]}`}
                    >
                      {paying === plan.id ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Redirection...</>
                      ) : (
                        <>Souscrire <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Security note */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
          <Shield className="w-4 h-4 text-muted shrink-0" />
          <p className="text-xs text-muted">
            Paiements sécurisés via <strong>PayTech</strong> — Wave, Orange Money, Free Money, carte bancaire acceptés.
            Annulez à tout moment. Aucune reconduction tacite sans votre accord.
          </p>
        </div>

        {/* Payment history */}
        {payments.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-semibold text-foreground">Historique des paiements</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-medium text-muted px-5 py-3">Plan</th>
                      <th className="text-left text-xs font-medium text-muted px-5 py-3">Cycle</th>
                      <th className="text-right text-xs font-medium text-muted px-5 py-3">Montant</th>
                      <th className="text-left text-xs font-medium text-muted px-5 py-3">Statut</th>
                      <th className="text-left text-xs font-medium text-muted px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-slate-50">
                        <td className="px-5 py-3 text-sm font-medium text-foreground">{PLANS[p.plan_id]?.name || p.plan_id}</td>
                        <td className="px-5 py-3 text-sm text-slate-500">{p.billing_cycle === "monthly" ? "Mensuel" : p.billing_cycle === "annual" ? "Annuel" : "Trimestriel"}</td>
                        <td className="px-5 py-3 text-sm font-semibold text-foreground text-right">{formatCurrency(p.amount)}</td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            p.status === "completed" ? "bg-success-50 text-success-600" :
                            p.status === "pending" ? "bg-warning-50 text-warning-600" :
                            "bg-danger-50 text-danger-600"
                          }`}>
                            {p.status === "completed" ? "Payé" : p.status === "pending" ? "En attente" : "Échoué"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-sm text-muted">{p.paid_at ? formatShortDate(p.paid_at) : formatShortDate(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AbonnementPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted">Chargement...</div>}>
      <AbonnementContent />
    </Suspense>
  );
}
