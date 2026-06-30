"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Calendar, Clock, Menu } from "lucide-react";
import { useSidebar } from "@/contexts/sidebar-context";

export function Header({ title }) {
  const [now, setNow] = useState(new Date());
  const { setMobileOpen } = useSidebar();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  return (
    <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
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
  );
}
