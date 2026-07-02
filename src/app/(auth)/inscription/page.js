"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

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
  const [googleLoading, setGoogleLoading] = useState(false);

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

  async function handleGoogleSignup() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
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

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-60"
        >
          <GoogleIcon />
          {googleLoading ? "Redirection..." : "S'inscrire avec Google"}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-muted">ou</span>
          <div className="flex-1 h-px bg-slate-200" />
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
