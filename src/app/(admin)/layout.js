"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { useAuth } from "@/hooks/useAuth";
import { Shield } from "lucide-react";

export default function AdminLayout({ children }) {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile && !profile.is_super_admin) {
      router.push("/dashboard");
    }
    if (!loading && !profile) {
      router.push("/login");
    }
  }, [profile, loading, router]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-950">
        <div className="text-slate-400 text-sm flex items-center gap-2">
          <Shield className="w-5 h-5 animate-pulse" />
          Vérification des accès...
        </div>
      </div>
    );
  }

  if (!profile?.is_super_admin) return null;

  return (
    <div className="h-full flex bg-slate-950">
      <AdminSidebar />
      <main className="flex-1 ml-64 overflow-y-auto bg-slate-900 min-h-screen">
        {children}
      </main>
    </div>
  );
}
