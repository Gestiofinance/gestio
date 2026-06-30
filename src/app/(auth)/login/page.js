"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    // Check super admin → redirect to admin panel
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: prof } = await supabase
        .from("profiles")
        .select("is_super_admin")
        .eq("id", authUser.id)
        .single();

      if (prof?.is_super_admin) {
        router.push("/admin");
        router.refresh();
        return;
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      {/* Mobile logo */}
      <div className="lg:hidden text-center mb-8">
        <h1 className="text-3xl font-bold gradient-text">Gestio</h1>
        <p className="text-sm text-muted mt-1">
          Tout votre business, un seul outil
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Connexion</h2>
          <p className="text-sm text-muted mt-1">
            Accédez à votre espace de gestion
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Adresse email"
            type="email"
            placeholder="vous@entreprise.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            id="password"
            label="Mot de passe"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" className="rounded border-slate-300" />
              Se souvenir de moi
            </label>
            <Link
              href="/mot-de-passe-oublie"
              className="text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Connexion en cours..." : "Se connecter"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Pas encore de compte ?{" "}
          <Link
            href="/inscription"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}
