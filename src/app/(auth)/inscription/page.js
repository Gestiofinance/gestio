"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function InscriptionPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    entreprise: "",
    nom: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.nom,
          company_name: formData.entreprise,
        },
      },
    });

    if (error) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
      return;
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
          <h2 className="text-2xl font-bold text-foreground">
            Créer un compte
          </h2>
          <p className="text-sm text-muted mt-1">
            Essai gratuit de 7 jours — sans carte bancaire
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="entreprise"
            name="entreprise"
            label="Nom de l'entreprise"
            placeholder="JC Agence"
            value={formData.entreprise}
            onChange={handleChange}
            required
          />

          <Input
            id="nom"
            name="nom"
            label="Votre nom complet"
            placeholder="Jean Dupont"
            value={formData.nom}
            onChange={handleChange}
            required
          />

          <Input
            id="email"
            name="email"
            label="Adresse email"
            type="email"
            placeholder="vous@entreprise.com"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <Input
            id="password"
            name="password"
            label="Mot de passe"
            type="password"
            placeholder="8 caractères minimum"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <Input
            id="confirmPassword"
            name="confirmPassword"
            label="Confirmer le mot de passe"
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          {error && (
            <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Création en cours..." : "Créer mon compte"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Vous avez déjà un compte ?{" "}
          <Link
            href="/login"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
