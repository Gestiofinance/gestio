"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const AuthContext = createContext({
  user: null,
  profile: null,
  organization: null,
  loading: true,
  signOut: async () => {},
  supabase: null,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile(userId) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabase
          .from("profiles")
          .select("*, organizations(*)")
          .eq("id", userId)
          .single();
        if (!error) return data;
        console.error("Profile fetch error (attempt", attempt + 1, "):", error);
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
      }
      return null;
    }

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const profile = await fetchProfile(user.id);
        if (profile) {
          setProfile(profile);
          setOrganization(profile.organizations);
        }
      }
      setLoading(false);
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setProfile(null);
        setOrganization(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <AuthContext.Provider value={{ user, profile, organization, loading, signOut, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
