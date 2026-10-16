"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  Share2, Copy, Check, MousePointerClick, Users, UserCheck, Wallet,
  Banknote, Clock,
} from "lucide-react";

const withdrawalStatusLabels = { en_attente: "En attente", approuvee: "Approuvée", payee: "Payée", rejetee: "Rejetée" };
const withdrawalStatusColors = { en_attente: "warning", approuvee: "primary", payee: "success", rejetee: "danger" };

export default function AffiliationPage() {
  const [loading, setLoading] = useState(true);
  const [affiliate, setAffiliate] = useState(null);
  const [stats, setStats] = useState({ clicks: 0, referred: 0, converted: 0 });
  const [commissionRate, setCommissionRate] = useState(10);
  const [minWithdrawal, setMinWithdrawal] = useState(10000);
  const [referrals, setReferrals] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [copied, setCopied] = useState(false);

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", phone: "" });
  const [withdrawError, setWithdrawError] = useState("");
  const [saving, setSaving] = useState(false);

  const link = useMemo(() => {
    if (!affiliate) return "";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://gestio.sn";
    return `${origin}/inscription?ref=${affiliate.code}`;
  }, [affiliate]);

  async function loadAll() {
    setLoading(true);
    try {
      const [affRes, refRes, wdRes] = await Promise.all([
        fetch("/api/affiliate"),
        fetch("/api/affiliate/referrals"),
        fetch("/api/affiliate/withdrawals"),
      ]);
      const affData = await affRes.json();
      const refData = await refRes.json();
      const wdData = await wdRes.json();

      if (affRes.ok) {
        setAffiliate(affData.affiliate);
        setStats(affData.stats);
        setCommissionRate(affData.commissionRate);
        setMinWithdrawal(affData.minWithdrawal);
      }
      setReferrals(refData.referrals || []);
      setWithdrawals(wdData.withdrawals || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  function handleCopy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openWithdraw() {
    setWithdrawForm({ amount: "", phone: "" });
    setWithdrawError("");
    setShowWithdraw(true);
  }

  async function handleWithdraw() {
    setSaving(true);
    setWithdrawError("");
    try {
      const res = await fetch("/api/affiliate/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(withdrawForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue");
      setShowWithdraw(false);
      await loadAll();
    } catch (e) {
      setWithdrawError(e.message);
    }
    setSaving(false);
  }

  const balance = Number(affiliate?.balance || 0);

  return (
    <div>
      <Header title="Affiliation" />
      <div className="p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="text-center py-12 text-muted">Chargement...</div>
        ) : (
          <>
            {/* Lien d'affiliation */}
            <Card className="p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
              <div className="flex items-center gap-2 mb-2">
                <Share2 className="w-4 h-4 text-emerald-500" />
                <h3 className="font-semibold text-foreground">Votre lien d&apos;affiliation</h3>
              </div>
              <p className="text-sm text-muted mb-3">
                Partagez ce lien avec votre réseau. Vous gagnez <span className="font-semibold text-emerald-600">{commissionRate}%</span> sur chaque paiement effectué par les entreprises qui s&apos;inscrivent via ce lien.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 truncate">
                  {link}
                </div>
                <Button onClick={handleCopy} className="flex-shrink-0">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copié !" : "Copier le lien"}
                </Button>
              </div>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-xs text-muted flex items-center gap-1"><MousePointerClick className="w-3.5 h-3.5" /> Visites du lien</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.clicks}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Inscriptions</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.referred}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted flex items-center gap-1"><UserCheck className="w-3.5 h-3.5" /> Abonnés payants</p>
                <p className="text-2xl font-bold text-foreground mt-1">{stats.converted}</p>
              </Card>
              <Card className="p-4">
                <p className="text-xs text-muted flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> Solde disponible</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(balance)}</p>
              </Card>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-muted">
                Total gagné : <span className="font-medium text-foreground">{formatCurrency(affiliate?.total_earned || 0)}</span>
                {" · "}Déjà retiré : <span className="font-medium text-foreground">{formatCurrency(affiliate?.total_withdrawn || 0)}</span>
                {" · "}Retrait minimum : {formatCurrency(minWithdrawal)}
              </p>
              <Button variant="secondary" onClick={openWithdraw} disabled={balance < minWithdrawal} className="flex-shrink-0">
                <Banknote className="w-4 h-4" /> Demander un retrait
              </Button>
            </div>

            {/* Filleuls */}
            <Card>
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-foreground">Vos filleuls</h3>
              </div>
              <div className="p-4">
                {referrals.length === 0 ? (
                  <p className="text-sm text-muted text-center py-6">Aucune inscription via votre lien pour le moment.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-muted border-b border-slate-100">
                          <th className="pb-2 font-medium">Entreprise</th>
                          <th className="pb-2 font-medium">Inscrit le</th>
                          <th className="pb-2 font-medium">Statut</th>
                          <th className="pb-2 font-medium text-right">Gagné</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referrals.map((r) => (
                          <tr key={r.id} className="border-b border-slate-50 last:border-0">
                            <td className="py-2.5 font-medium text-foreground">{r.name}</td>
                            <td className="py-2.5 text-slate-600">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</td>
                            <td className="py-2.5">
                              <Badge variant={r.status === "actif" ? "success" : "default"}>{r.status === "actif" ? "Abonné" : "Essai"}</Badge>
                            </td>
                            <td className="py-2.5 text-right font-medium text-foreground">{formatCurrency(r.earned)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Card>

            {/* Retraits */}
            <Card>
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-semibold text-foreground">Vos demandes de retrait</h3>
              </div>
              <div className="p-4">
                {withdrawals.length === 0 ? (
                  <p className="text-sm text-muted text-center py-6">Aucune demande de retrait pour le moment.</p>
                ) : (
                  <div className="space-y-2">
                    {withdrawals.map((w) => (
                      <div key={w.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-3">
                          <Clock className="w-4 h-4 text-muted" />
                          <div>
                            <p className="text-sm font-medium text-foreground">{formatCurrency(w.amount)}</p>
                            <p className="text-xs text-muted">{new Date(w.requested_at).toLocaleDateString("fr-FR")} — {w.phone}</p>
                          </div>
                        </div>
                        <Badge variant={withdrawalStatusColors[w.status]}>{withdrawalStatusLabels[w.status]}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>

      <Modal open={showWithdraw} onClose={() => setShowWithdraw(false)} title="Demander un retrait" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-muted">Solde disponible : <span className="font-semibold text-foreground">{formatCurrency(balance)}</span></p>
          <Input
            id="amount" label="Montant (FCFA)" type="number"
            value={withdrawForm.amount} onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
            placeholder={String(minWithdrawal)}
          />
          <Input
            id="phone" label="Numéro Mobile Money" type="tel"
            value={withdrawForm.phone} onChange={(e) => setWithdrawForm({ ...withdrawForm, phone: e.target.value })}
            placeholder="77 123 45 67"
          />
          {withdrawError && <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg">{withdrawError}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowWithdraw(false)}>Annuler</Button>
            <Button onClick={handleWithdraw} disabled={saving || !withdrawForm.amount || !withdrawForm.phone}>
              {saving ? "Envoi..." : "Envoyer la demande"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
