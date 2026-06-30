"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { createClient } from "@/lib/supabase/client";
import { Shield } from "lucide-react";

export default function AdminLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Check from JWT app_metadata (set via Supabase SQL, no RLS issues)
      if (user.app_metadata?.is_super_admin === true) {
        setIsAdmin(true);
      } else {
        router.push("/dashboard");
      }
      setLoading(false);
    }

    checkAdmin();
  }, [router]);

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

  if (!isAdmin) return null;

  return (
    <div className="h-full flex bg-slate-950">
      <AdminSidebar />
      <main className="flex-1 ml-64 overflow-y-auto bg-slate-900 min-h-screen">
        {children}
      </main>
    </div>
  );
}
