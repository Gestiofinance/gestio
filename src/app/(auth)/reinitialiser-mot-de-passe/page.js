"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";

export default function ReinitialiserMotDePassePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("Une erreur est survenue. Le lien a peut-être expiré.");
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push("/dashboard"), 2500);
  }

  return (
    <div>
      <div className="lg:hidden text-center mb-8">
        <h1 className="text-3xl font-bold gradient-text">Gestio</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        {done ? (
          <div className="text-center py-4">
            <div className="inline-flex p-3 rounded-full bg-success-50 mb-4">
              <CheckCircle className="w-8 h-8 text-success-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              Mot de passe mis à jour !
            </h2>
            <p className="text-sm text-muted">
              Redirection vers votre tableau de bord...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                Nouveau mot de passe
              </h2>
              <p className="text-sm text-muted mt-1">
                Choisissez un nouveau mot de passe sécurisé
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                id="password"
                label="Nouveau mot de passe"
                type="password"
                placeholder="8 caractères minimum"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Input
                id="confirm"
                label="Confirmer le mot de passe"
                type="password"
                placeholder="••••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />

              {error && (
                <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Enregistrement..." : "Enregistrer le mot de passe"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
