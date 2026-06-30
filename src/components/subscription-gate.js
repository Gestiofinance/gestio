"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Lock, CreditCard, ArrowRight, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

// These paths are always accessible regardless of subscription
const EXEMPT_PATHS = ["/dashboard", "/dashboard/abonnement", "/dashboard/parametres"];

function isExempt(pathname) {
  return EXEMPT_PATHS.some((p) => pathname === p);
}

function isValidSubscription(sub) {
  if (!sub) return false;
  if (sub.status === "active") return true;
  if (sub.status === "trial" && sub.trial_end && new Date(sub.trial_end) > new Date()) return true;
  return false;
}

function LockScreen({ subscription }) {
  const isTrialExpired =
    subscription?.status === "trial" &&
    (!subscription.trial_end || new Date(subscription.trial_end) <= new Date());
  const isExpired = subscription && ["expired", "cancelled", "past_due"].includes(subscription.status);

  let title = "Module verrouillé";
  let message = "Souscrivez à un plan pour accéder à tous les modules de Gestio.";

  if (isTrialExpired) {
    title = "Période d'essai terminée";
    message = "Votre essai gratuit a expiré. Choisissez un plan pour continuer.";
  } else if (isExpired) {
    title = "Abonnement expiré";
    message = "Votre abonnement a expiré ou a été annulé. Renouvelez pour débloquer l'accès.";
  } else if (subscription?.status === "past_due") {
    title = "Paiement en attente";
    message = "Un problème de paiement bloque votre accès. Régularisez votre abonnement.";
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

      {/* Feature preview */}
      <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl opacity-40 pointer-events-none select-none">
        {["Clients", "Projets", "Factures", "Comptabilité"].map((f) => (
          <div key={f} className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-medium text-slate-500 text-center">
            {f}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SubscriptionGate({ children }) {
  const pathname = usePathname();
  const { profile, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState(undefined);
  const supabaseRef = useRef(null);

  if (!supabaseRef.current) supabaseRef.current = createClient();
  const supabase = supabaseRef.current;

  const orgId = profile?.organization_id;

  useEffect(() => {
    if (!orgId) return;
    supabase
      .from("subscriptions")
      .select("id, status, trial_end, plan_id, current_period_end")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setSubscription(data ?? null));
  }, [orgId]);

  // Always pass through exempt paths
  if (isExempt(pathname)) return children;

  // While loading auth, show nothing briefly (avoids flash)
  if (authLoading) return null;

  // If no profile available, let through (can't check)
  if (!profile) return children;

  // Optimistic: while subscription is still loading, show content
  if (subscription === undefined) return children;

  if (isValidSubscription(subscription)) return children;

  return <LockScreen subscription={subscription} />;
}
