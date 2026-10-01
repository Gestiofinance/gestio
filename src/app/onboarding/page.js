"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2 } from "lucide-react";

const EMPTY = { name: "", phone: "", address: "", city: "", ninea: "", rccm: "" };

export default function OnboardingPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings/org")
      .then((r) => r.json())
      .then(({ org }) => {
        if (!org) return;
        if (org.onboarding_completed) {
          router.replace("/dashboard");
          return;
        }
        setForm({
          name: org.name === "Mon entreprise" ? "" : org.name || "",
          phone: org.phone || "",
          address: org.address || "",
          city: org.city || "",
          ninea: org.ninea || "",
          rccm: org.rccm || "",
        });
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Le nom de l'entreprise est requis.");
      return;
    }
    setError("");
    setSaving(true);

    const res = await fetch("/api/settings/org", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, onboarding_completed: true }),
    });

    if (!res.ok) {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setSaving(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-full flex items-center justify-center bg-slate-50">
        <p className="text-sm text-muted">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Gestio</h1>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="mb-6 flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary-50 shrink-0">
              <Building2 className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Parlez-nous de votre entreprise</h2>
              <p className="text-sm text-muted mt-1">
                Ces informations apparaîtront sur vos factures et devis. Vous pourrez les modifier à tout moment dans les paramètres.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="name"
              name="name"
              label="Nom de l'entreprise"
              placeholder="JC Agence"
              value={form.name}
              onChange={handleChange}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="phone"
                name="phone"
                label="Téléphone"
                placeholder="77 000 00 00"
                value={form.phone}
                onChange={handleChange}
              />
              <Input
                id="city"
                name="city"
                label="Ville"
                placeholder="Dakar"
                value={form.city}
                onChange={handleChange}
              />
            </div>

            <Input
              id="address"
              name="address"
              label="Adresse"
              placeholder="Rue, quartier..."
              value={form.address}
              onChange={handleChange}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="ninea"
                name="ninea"
                label="NINEA (optionnel)"
                value={form.ninea}
                onChange={handleChange}
              />
              <Input
                id="rccm"
                name="rccm"
                label="RCCM (optionnel)"
                value={form.rccm}
                onChange={handleChange}
              />
            </div>

            {error && (
              <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? "Enregistrement..." : "Continuer vers mon tableau de bord"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
