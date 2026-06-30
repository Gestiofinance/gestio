"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Calendar, Clock, Menu, AlertTriangle, CreditCard, X, Info, Sparkles } from "lucide-react";
import { useSidebar } from "@/contexts/sidebar-context";

// Returns banner config based on subscription state
function useSubscriptionBanner() {
  const [banner, setBanner] = useState(null); // null = no banner

  useEffect(() => {
    fetch("/api/subscription/data")
      .then((r) => r.json())
      .then(({ subscription }) => {
        if (!subscription) return;

        const now = new Date();

        if (subscription.status === "trial") {
          const end = subscription.trial_end ? new Date(subscription.trial_end) : null;
          const daysLeft = end ? Math.ceil((end - now) / 86400000) : null;

          if (daysLeft !== null && daysLeft >= 0) {
            // Always show trial banner; urgent mode when ≤ 3 days
            setBanner({ type: daysLeft <= 3 ? "trial_urgent" : "trial_info", daysLeft });
          }
        }

        if (subscription.status === "active" && subscription.current_period_end) {
          const end = new Date(subscription.current_period_end);
          const daysLeft = Math.ceil((end - now) / 86400000);
          if (daysLeft <= 5 && daysLeft >= 0) {
            setBanner({ type: "active_warning", daysLeft });
          }
        }
      })
      .catch(() => {});
  }, []);

  return banner;
}

function SubscriptionBanner({ banner, onClose }) {
  const { type, daysLeft } = banner;

  const isToday = daysLeft === 0;
  const isTomorrow = daysLeft === 1;
  const dayLabel = isToday ? "aujourd'hui" : isTomorrow ? "demain" : `dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`;

  // Visual config per type
  const config = {
    trial_info: {
      bg: "bg-amber-500",
      icon: <Sparkles className="w-4 h-4 shrink-0" />,
      text: `Période d'essai gratuite — ${daysLeft} jour${daysLeft > 1 ? "s" : ""} restant${daysLeft > 1 ? "s" : ""}`,
      showButton: false,
    },
    trial_urgent: {
      bg: "bg-orange-600",
      icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
      text: `Votre essai expire ${dayLabel}`,
      showButton: true,
      buttonLabel: "Souscrire maintenant",
    },
    active_warning: {
      bg: "bg-red-600",
      icon: <AlertTriangle className="w-4 h-4 shrink-0" />,
      text: `Votre abonnement expire ${dayLabel}`,
      showButton: true,
      buttonLabel: "Renouveler",
    },
  }[type];

  // Progress bar for trial_info: full 14 days range
  // For warnings: 5-day countdown
  const maxDays = type === "trial_info" ? 14 : 5;
  const pct = Math.max(0, Math.min(100, (daysLeft / maxDays) * 100));

  return (
    <div className={`${config.bg} text-white px-4 py-2 flex items-center gap-3 text-sm`}>
      {config.icon}

      <span className="font-medium">{config.text}</span>

      {/* Progress bar */}
      <div className="hidden sm:flex items-center gap-2 flex-1 max-w-40">
        <div className="flex-1 h-1.5 bg-white/25 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-white/70 whitespace-nowrap font-medium">
          {isToday ? "Expire ce soir" : `J−${daysLeft}`}
        </span>
      </div>

      {config.showButton && (
        <Link
          href="/dashboard/abonnement"
          className="flex items-center gap-1.5 px-3 py-1 bg-white text-slate-800 rounded-lg text-xs font-bold hover:bg-white/90 transition-colors shrink-0 ml-auto sm:ml-0"
        >
          <CreditCard className="w-3.5 h-3.5" />
          {config.buttonLabel}
        </Link>
      )}

      {!config.showButton && (
        <Link
          href="/dashboard/abonnement"
          className="hidden sm:flex items-center gap-1 text-xs text-white/80 hover:text-white underline underline-offset-2 shrink-0 ml-auto"
        >
          Voir les plans
        </Link>
      )}

      <button
        onClick={onClose}
        className="p-1 hover:bg-white/20 rounded-md transition-colors shrink-0"
        aria-label="Fermer"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function Header({ title }) {
  const [now, setNow] = useState(new Date());
  const { setMobileOpen } = useSidebar();
  const banner = useSubscriptionBanner();
  const [bannerClosed, setBannerClosed] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="sticky top-0 z-30">
      {banner && !bannerClosed && (
        <SubscriptionBanner banner={banner} onClose={() => setBannerClosed(true)} />
      )}

      <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 sm:px-6">
        {/* Mobile: hamburger + logo */}
        <div className="flex items-center gap-3 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
          <Link href="/dashboard">
            <Image
              src="/GESIO-logo-app.png"
              alt="Gestio"
              width={100}
              height={28}
              className="h-7 w-auto object-contain"
              priority
            />
          </Link>
        </div>

        {/* Desktop: page title */}
        <h1 className="hidden lg:block text-lg font-semibold text-foreground">{title}</h1>

        {/* Right side */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 w-56">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="bg-transparent text-sm text-slate-700 placeholder:text-slate-400 w-full border-none outline-none"
            />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-sm text-slate-500">
            <div className="hidden lg:flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-muted" />
              <span className="capitalize">{dateStr}</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Clock className="w-4 h-4 text-primary-500" />
              <span>{timeStr}</span>
            </div>
          </div>
        </div>
      </header>
    </div>
  );
}
