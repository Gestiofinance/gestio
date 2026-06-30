"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, CreditCard, TrendingUp, LogOut, ArrowLeft, Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navigation = [
  { name: "Tableau de bord", href: "/admin", icon: LayoutDashboard, exact: true },
  { name: "Utilisateurs", href: "/admin/utilisateurs", icon: Users },
  { name: "Abonnements", href: "/admin/abonnements", icon: CreditCard },
  { name: "Revenus", href: "/admin/revenus", icon: TrendingUp },
  { name: "Paramètres", href: "/admin/parametres", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-slate-950 border-r border-slate-800">
      {/* Logo + badge */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/GESIO-logo-app.png" alt="Gestio" width={100} height={28} className="h-7 w-auto object-contain" priority />
        </Link>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary-500/20 text-primary-400 border border-primary-500/30">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-primary-500/20 text-primary-400 border border-primary-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-slate-800 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 shrink-0" />
          Retour à l&apos;app
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
