"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Calendar,
  FileText,
  Receipt,
  PieChart,
  UserCog,
  Settings,
  LogOut,
  ChevronLeft,
  CreditCard,
  ShieldCheck,
  PenTool,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/contexts/sidebar-context";

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/dashboard/clients", icon: Users, moduleKey: "clients" },
  { name: "Projets", href: "/dashboard/projets", icon: FolderKanban, moduleKey: "projets" },
  { name: "Tâches", href: "/dashboard/taches", icon: CheckSquare, moduleKey: "taches" },
  { name: "Planning", href: "/dashboard/planning", icon: Calendar, moduleKey: "planning" },
  { name: "Devis", href: "/dashboard/devis", icon: FileText, moduleKey: "devis" },
  { name: "Factures", href: "/dashboard/factures", icon: Receipt, moduleKey: "factures" },
  { name: "Comptabilité", href: "/dashboard/comptabilite", icon: PieChart, moduleKey: "comptabilite" },
  { name: "Signature", href: "/dashboard/signature", icon: PenTool, moduleKey: "signature" },
  { name: "Équipe", href: "/dashboard/equipe", icon: UserCog },
  { name: "Paramètres", href: "/dashboard/parametres", icon: Settings },
  { name: "Abonnement", href: "/dashboard/abonnement", icon: CreditCard },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut, profile, user, loading } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const { mobileOpen, setMobileOpen } = useSidebar();

  const isOwner = profile?.role === "proprietaire";
  const allowedModules = profile?.allowed_modules || [];
  const visibleNavigation = navigation.filter((item) => {
    if (!item.moduleKey) return true;
    if (loading || isOwner) return true;
    return allowedModules.includes(item.moduleKey);
  });

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800">
          {!collapsed && (
            <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
              <Image src="/GESIO-logo-app.png" alt="Gestio" width={120} height={32} className="h-8 w-auto object-contain" priority />
            </Link>
          )}
          <button
            onClick={() => {
              setCollapsed(!collapsed);
              setMobileOpen(false);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors ml-auto"
          >
            <ChevronLeft
              className={cn(
                "w-4 h-4 text-slate-400 transition-transform",
                collapsed && "rotate-180"
              )}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNavigation.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "gradient-bg text-white shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                )}
                title={collapsed ? item.name : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Admin link for super admins */}
        {(user?.app_metadata?.is_super_admin === true || profile?.is_super_admin === true) && (
          <div className="px-3 pb-2">
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-all"
              title={collapsed ? "Panel Admin" : undefined}
            >
              <ShieldCheck className="w-5 h-5 shrink-0" />
              {!collapsed && <span>Panel Admin</span>}
            </Link>
          </div>
        )}

        {/* User & Logout */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-2">
          {!collapsed && profile && (
            <div className="px-3 py-2">
              <p className="text-sm font-medium text-white truncate">{profile.full_name}</p>
              <p className="text-xs text-slate-400 truncate">{profile.email}</p>
            </div>
          )}
          <button
            onClick={signOut}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            )}
            title={collapsed ? "Déconnexion" : undefined}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
