"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, Mail } from "lucide-react";

const RESEND_COOLDOWN = 30;

function VerifierEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  async function handleResend() {
    if (!email || cooldown > 0) return;
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setLoading(false);

    if (error) {
      setError("Impossible de renvoyer l'email pour le moment. Réessayez plus tard.");
      return;
    }

    setResent(true);
    setCooldown(RESEND_COOLDOWN);
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  return (
    <div>
      <div className="lg:hidden text-center mb-8">
        <h1 className="text-3xl font-bold gradient-text">Gestio</h1>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center">
        <div className="inline-flex p-3 rounded-full bg-primary-50 mb-4">
          <Mail className="w-8 h-8 text-primary-500" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Vérifiez votre boîte mail
        </h2>
        <p className="text-sm text-muted mb-1">
          Nous avons envoyé un lien de confirmation
          {email && <> à <strong>{email}</strong></>}.
        </p>
        <p className="text-sm text-muted mb-6">
          Cliquez sur ce lien pour activer votre compte et accéder à Gestio.
        </p>

        {error && (
          <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg mb-4">{error}</p>
        )}
        {resent && !error && (
          <p className="text-sm text-success-500 bg-success-50 px-3 py-2 rounded-lg mb-4">
            Email renvoyé !
          </p>
        )}

        <p className="text-sm text-muted mb-2">Vous n&apos;avez rien reçu ?</p>
        <button
          type="button"
          onClick={handleResend}
          disabled={loading || cooldown > 0 || !email}
          className="text-primary-500 hover:text-primary-600 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Envoi..." : cooldown > 0 ? `Renvoyer (${cooldown}s)` : "Renvoyer l'email"}
        </button>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifierEmailPage() {
  return (
    <Suspense fallback={<div className="text-center text-muted text-sm">Chargement...</div>}>
      <VerifierEmailContent />
    </Suspense>
  );
}
