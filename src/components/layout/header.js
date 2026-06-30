"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Calendar, Clock, Menu, AlertTriangle, CreditCard, X } from "lucide-react";
import { useSidebar } from "@/contexts/sidebar-context";

function useExpirationWarning() {
  const [warning, setWarning] = useState(null); // null = no warning, { daysLeft, type }

  useEffect(() => {
    fetch("/api/subscription/data")
      .then((r) => r.json())
      .then(({ subscription }) => {
        if (!subscription) return;

        const now = new Date();
        const THRESHOLD_DAYS = 5;

        // Check trial expiry
        if (subscription.status === "trial" && subscription.trial_end) {
          const end = new Date(subscription.trial_end);
          const daysLeft = Math.ceil((end - now) / 86400000);
          if (daysLeft <= THRESHOLD_DAYS && daysLeft >= 0) {
            setWarning({ daysLeft, type: "trial" });
          }
        }

        // Check active subscription expiry
        if (subscription.status === "active" && subscription.current_period_end) {
          const end = new Date(subscription.current_period_end);
          const daysLeft = Math.ceil((end - now) / 86400000);
          if (daysLeft <= THRESHOLD_DAYS && daysLeft >= 0) {
            setWarning({ daysLeft, type: "active" });
          }
        }
      })
      .catch(() => {});
  }, []);

  return warning;
}

function ExpirationBanner({ warning, onClose }) {
  const { daysLeft, type } = warning;

  const isToday = daysLeft === 0;
  const isTomorrow = daysLeft === 1;

  const dayLabel = isToday
    ? "aujourd'hui"
    : isTomorrow
    ? "demain"
    : `dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""}`;

  const text =
    type === "trial"
      ? `Votre période d'essai expire ${dayLabel}`
      : `Votre abonnement expire ${dayLabel}`;

  // Progress bar: 5 days max
  const pct = Math.max(0, Math.min(100, (daysLeft / 5) * 100));

  return (
    <div className="bg-red-600 text-white px-4 py-2 flex items-center gap-3 text-sm sticky top-0 z-40">
      <AlertTriangle className="w-4 h-4 shrink-0" />

      <span className="font-medium">{text}</span>

      {/* Timeline bar */}
      <div className="hidden sm:flex items-center gap-2 flex-1 max-w-48">
        <div className="flex-1 h-1.5 bg-red-400/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-xs text-red-100 whitespace-nowrap font-medium">
          {isToday ? "Expire ce soir" : `J−${daysLeft}`}
        </span>
      </div>

      <Link
        href="/dashboard/abonnement"
        className="flex items-center gap-1.5 px-3 py-1 bg-white text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors shrink-0 ml-auto sm:ml-0"
      >
        <CreditCard className="w-3.5 h-3.5" />
        Renouveler
      </Link>

      <button
        onClick={onClose}
        className="p-1 hover:bg-red-500 rounded-md transition-colors shrink-0"
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
  const warning = useExpirationWarning();
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
      {/* Expiration warning banner */}
      {warning && !bannerClosed && (
        <ExpirationBanner warning={warning} onClose={() => setBannerClosed(true)} />
      )}

      {/* Main header */}
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
