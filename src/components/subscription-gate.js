"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Lock, CreditCard, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

// These paths are always accessible regardless of subscription
const EXEMPT_PATHS = ["/dashboard", "/dashboard/abonnement", "/dashboard/parametres"];

function isExempt(pathname) {
  return EXEMPT_PATHS.some((p) => pathname === p);
}

function isValid(sub) {
  if (!sub) return false;
  if (sub.status === "active") return true;
  if (sub.status === "trial" && sub.trial_end && new Date(sub.trial_end) > new Date()) return true;
  return false;
}

function LockScreen({ subscription }) {
  const isSuspended = subscription?.status === "suspended";
  const isTrialExpired =
    subscription?.status === "trial" &&
    (!subscription.trial_end || new Date(subscription.trial_end) <= new Date());
  const isExpired =
    subscription && ["expired", "cancelled"].includes(subscription.status);
  const isPastDue = subscription?.status === "past_due";

  let title = "Module verrouillé";
  let message = "Souscrivez à un plan pour accéder à tous les modules de Gestio.";

  if (isSuspended) {
    title = "Compte suspendu";
    message = "Votre compte a été suspendu par l'administrateur. Contactez le support Gestio pour plus d'informations.";
  } else if (isTrialExpired) {
    title = "Période d'essai terminée";
    message = "Votre essai gratuit a expiré. Choisissez un plan pour continuer à utiliser Gestio.";
  } else if (isPastDue) {
    title = "Paiement en attente";
    message = "Un problème de paiement bloque votre accès. Régularisez votre abonnement pour continuer.";
  } else if (isExpired) {
    title = "Abonnement expiré";
    message = "Votre abonnement a expiré ou a été annulé. Renouvelez-le pour débloquer l'accès.";
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mb-6">
        <Lock className="w-9 h-9 text-slate-400" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted text-sm max-w-sm mb-8 leading-relaxed">{message}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard/abonnement"
          className="flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
        >
          <CreditCard className="w-4 h-4" />
          Voir les plans
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-all"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}

export function SubscriptionGate({ children }) {
  const pathname = usePathname();
  const { loading: authLoading } = useAuth();

  // undefined = loading, null = no subscription, object = subscription data
  const [subscription, setSubscription] = useState(undefined);

  useEffect(() => {
    // Fetch subscription status server-side (bypasses RLS / missing orgId)
    fetch("/api/subscription/data")
      .then((r) => r.json())
      .then((data) => setSubscription(data.subscription ?? null))
      .catch(() => setSubscription(null));
  }, []);

  // Suspended accounts are blocked everywhere
  if (subscription?.status === "suspended") return <LockScreen subscription={subscription} />;

  // Always pass through exempt paths
  if (isExempt(pathname)) return children;

  // While auth or subscription is loading, show content (optimistic)
  if (authLoading || subscription === undefined) return children;

  if (isValid(subscription)) return children;

  return <LockScreen subscription={subscription} />;
}
