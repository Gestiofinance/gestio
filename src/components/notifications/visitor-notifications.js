"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ConciergeBell, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function VisitorNotifications() {
  const { profile, organization, supabase } = useAuth();
  const [toasts, setToasts] = useState([]);
  const [myPersonnelIds, setMyPersonnelIds] = useState([]);

  // A profile can be linked to a personnel entry (so the DG, if also a
  // team member, gets notified when selected as host).
  useEffect(() => {
    if (!profile?.id || !supabase) return;
    supabase
      .from("personnel")
      .select("id")
      .eq("profile_id", profile.id)
      .then(({ data }) => setMyPersonnelIds((data || []).map((p) => p.id)));
  }, [profile?.id, supabase]);

  useEffect(() => {
    if (!organization?.id || !supabase || myPersonnelIds.length === 0) return;

    const channel = supabase
      .channel(`visitor-appointments-${organization.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "visitor_appointments",
          filter: `organization_id=eq.${organization.id}`,
        },
        (payload) => {
          const visit = payload.new;
          if (!myPersonnelIds.includes(visit.host_id)) return;
          const id = visit.id;
          setToasts((t) => [...t, { id, name: visit.full_name }]);
          setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 15000);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organization?.id, supabase, myPersonnelIds]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[60] space-y-2 w-80 max-w-[calc(100vw-2rem)]">
      {toasts.map((t) => (
        <div key={t.id} className="bg-white rounded-xl border border-primary-200 shadow-lg p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
            <ConciergeBell className="w-4.5 h-4.5 text-primary-500" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Nouveau visiteur</p>
            <p className="text-sm text-slate-600 mt-0.5">
              <strong>{t.name}</strong> souhaite vous rencontrer.
            </p>
            <Link
              href="/dashboard/accueil"
              onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))}
              className="text-xs text-primary-500 hover:text-primary-600 font-medium mt-1.5 inline-block"
            >
              Voir dans Rendez-vous →
            </Link>
          </div>
          <button
            onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))}
            className="p-1 rounded-lg hover:bg-slate-100 shrink-0"
          >
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      ))}
    </div>
  );
}
