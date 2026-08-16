"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
// useAuth removed — role fetched from /api/subscription/data
import {
  UserCog, UserPlus, Trash2, Crown, Lock, ArrowRight, Users,
  CheckCircle2, Pencil,
} from "lucide-react";

const roleColors = {
  proprietaire: "primary", administrateur: "warning", comptable: "success",
  collaborateur: "default", lecture_seule: "default",
};

const roleLabels = {
  proprietaire: "Propriétaire", administrateur: "Administrateur", comptable: "Comptable",
  collaborateur: "Collaborateur", lecture_seule: "Lecture seule",
};

const MODULES = [
  { key: "clients", label: "Clients" },
  { key: "projets", label: "Projets" },
  { key: "taches", label: "Tâches" },
  { key: "planning", label: "Planning" },
  { key: "devis", label: "Devis" },
  { key: "factures", label: "Factures" },
  { key: "comptabilite", label: "Comptabilité" },
  { key: "signature", label: "Signature" },
];

const ALL_MODULE_KEYS = MODULES.map((m) => m.key);

function memberBadgeLabel(member) {
  if (member.role === "proprietaire") return "Administrateur";
  return member.job_title || roleLabels[member.role] || member.role;
}

function UpsellGate({ plan }) {
  const router = useRouter();
  const isPlanKnown = !!plan;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-primary-500" />
      </div>
      <h2 className="text-xl font-bold text-foreground mb-2 text-center">
        Module Équipe réservé au Plan Pro
      </h2>
      <p className="text-sm text-muted text-center max-w-sm mb-6">
        {isPlanKnown
          ? `Votre plan ${plan === "standard" ? "Standard" : "actuel"} est limité à un seul utilisateur. Passez au Plan Pro pour inviter des collaborateurs et gérer les accès.`
          : "Abonnez-vous au Plan Pro pour inviter des collaborateurs et gérer votre équipe."}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 items-center mb-8">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <CheckCircle2 className="w-4 h-4 text-success-500" />
          Utilisateurs illimités
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <CheckCircle2 className="w-4 h-4 text-success-500" />
          Gestion des rôles
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <CheckCircle2 className="w-4 h-4 text-success-500" />
          Accès par module
        </div>
      </div>
      <Button onClick={() => router.push("/dashboard/abonnement")}>
        Voir les plans <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );
}

export default function EquipePage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(undefined);
  const [userRole, setUserRole] = useState(null); // loaded from API
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editMember, setEditMember] = useState(null);
  const [editForm, setEditForm] = useState({ job_title: "", allowed_modules: [] });

  const [addForm, setAddForm] = useState({
    full_name: "", email: "", password: "", job_title: "", allowed_modules: [...ALL_MODULE_KEYS],
  });

  useEffect(() => {
    async function init() {
      const res = await fetch("/api/subscription/data");
      const json = await res.json();
      setSubscription(json.subscription ?? null);
      setUserRole(json.userRole ?? null);

      const plan = json.subscription?.plan_id;
      const status = json.subscription?.status;
      const isPro = plan === "pro" || plan === "business" || status === "trial";

      if (isPro) {
        await loadMembers();
      } else {
        setLoading(false);
      }
    }
    init();
  }, []);

  async function loadMembers() {
    setLoading(true);
    const res = await fetch("/api/team/members");
    const json = await res.json();
    setMembers(json.members || []);
    setLoading(false);
  }

  async function handleAddMember() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/team/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: addForm.full_name,
          email: addForm.email,
          password: addForm.password,
          job_title: addForm.job_title,
          allowed_modules: addForm.allowed_modules,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Une erreur est survenue.");
        setSaving(false);
        return;
      }
      await loadMembers();
      setShowAdd(false);
      setAddForm({ full_name: "", email: "", password: "", job_title: "", allowed_modules: [...ALL_MODULE_KEYS] });
    } catch (e) {
      setError("Une erreur est survenue.");
    }
    setSaving(false);
  }

  async function handleToggleActive(member, active) {
    await fetch("/api/team/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId: member.id, is_active: active }),
    });
    await loadMembers();
    setDeleteConfirm(null);
  }

  function openEditMember(member) {
    setEditMember(member);
    setEditForm({ job_title: member.job_title || "", allowed_modules: member.allowed_modules || [] });
    setError("");
  }

  async function handleEditMember() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/team/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: editMember.id,
          job_title: editForm.job_title,
          allowed_modules: editForm.allowed_modules,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Une erreur est survenue.");
        setSaving(false);
        return;
      }
      await loadMembers();
      setEditMember(null);
    } catch (e) {
      setError("Une erreur est survenue.");
    }
    setSaving(false);
  }

  const isOwner = userRole === "proprietaire";

  // Still loading subscription data
  if (subscription === undefined) {
    return (
      <div>
        <Header title="Équipe" />
        <div className="p-4 sm:p-6">
          <div className="text-center py-12 text-muted">Chargement...</div>
        </div>
      </div>
    );
  }

  const plan = subscription?.plan_id;
  const status = subscription?.status;
  const isPro = plan === "pro" || plan === "business" || status === "trial";

  return (
    <div>
      <Header title="Équipe" />
      <div className="p-4 sm:p-6 space-y-6">

        {!isPro ? (
          <UpsellGate plan={plan} />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Membres de l&apos;équipe</h2>
                <p className="text-sm text-muted mt-1">
                  {members.length} membre{members.length > 1 ? "s" : ""}
                </p>
              </div>
              {isOwner && (
                <Button onClick={() => { setShowAdd(true); setAddForm({ full_name: "", email: "", password: "", job_title: "", allowed_modules: [...ALL_MODULE_KEYS] }); setError(""); }}>
                  <UserPlus className="w-4 h-4" /> Ajouter un membre
                </Button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-12 text-muted">Chargement...</div>
            ) : members.length === 0 ? (
              <EmptyState
                icon={UserCog}
                title="Vous êtes seul pour l'instant"
                description="Ajoutez des collaborateurs pour travailler ensemble sur Gestio."
                actionLabel={isOwner ? "Ajouter un collaborateur" : undefined}
                onAction={() => setShowAdd(true)}
              />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {members.map((member) => (
                  <Card key={member.id} className="relative">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-white">
                              {member.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{member.full_name}</p>
                            <p className="text-xs text-muted">{member.email}</p>
                            <Badge variant={roleColors[member.role]} className="mt-1">
                              {member.role === "proprietaire" && <Crown className="w-3 h-3 mr-1" />}
                              {memberBadgeLabel(member)}
                            </Badge>
                          </div>
                        </div>
                        {isOwner && member.role !== "proprietaire" && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => openEditMember(member)}
                              className="p-1.5 rounded-lg hover:bg-slate-100"
                              title="Modifier les accès"
                            >
                              <Pencil className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(member)}
                              className="p-1.5 rounded-lg hover:bg-danger-50"
                              title={member.is_active ? "Désactiver" : "Réactiver"}
                            >
                              <Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-500" />
                            </button>
                          </div>
                        )}
                      </div>
                      {member.is_active === false && (
                        <Badge variant="danger" className="mt-3">Désactivé</Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Add member modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Ajouter un membre" size="md">
        <div className="space-y-4">
          <Input
            id="add_name"
            label="Nom complet"
            placeholder="Prénom et nom"
            value={addForm.full_name}
            onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
            required
          />
          <Input
            id="add_email"
            label="Adresse email"
            type="email"
            placeholder="collaborateur@entreprise.sn"
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
            required
          />
          <Input
            id="add_password"
            label="Mot de passe temporaire"
            type="password"
            placeholder="8 caractères minimum"
            value={addForm.password}
            onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
            required
          />
          <Input
            id="add_job_title"
            label="Poste"
            placeholder="Ex. Comptable, Commercial, Assistante..."
            value={addForm.job_title}
            onChange={(e) => setAddForm({ ...addForm, job_title: e.target.value })}
            required
          />
          <p className="text-xs text-muted">
            Ce titre s&apos;affichera comme badge sur la fiche du membre.
          </p>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Modules accessibles</label>
            <div className="grid grid-cols-2 gap-2">
              {MODULES.map((m) => {
                const checked = addForm.allowed_modules.includes(m.key);
                return (
                  <label key={m.key} className="flex items-center gap-2 text-sm text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setAddForm((f) => ({
                          ...f,
                          allowed_modules: e.target.checked
                            ? [...f.allowed_modules, m.key]
                            : f.allowed_modules.filter((k) => k !== m.key),
                        }));
                      }}
                      className="accent-primary-500"
                    />
                    {m.label}
                  </label>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-muted">
            Le collaborateur pourra se connecter avec ces identifiants. Seul le propriétaire du compte peut modifier ce mot de passe.
          </p>

          {error && <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Annuler</Button>
            <Button
              onClick={handleAddMember}
              disabled={saving || !addForm.full_name || !addForm.email || !addForm.password || !addForm.job_title}
            >
              {saving ? "Création..." : "Créer le compte"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit member modal */}
      <Modal open={!!editMember} onClose={() => setEditMember(null)} title="Modifier les accès" size="md">
        <div className="space-y-4">
          <Input
            id="edit_job_title"
            label="Poste"
            placeholder="Ex. Comptable, Commercial, Assistante..."
            value={editForm.job_title}
            onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Modules accessibles</label>
            <div className="grid grid-cols-2 gap-2">
              {MODULES.map((m) => {
                const checked = editForm.allowed_modules.includes(m.key);
                return (
                  <label key={m.key} className="flex items-center gap-2 text-sm text-slate-600 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setEditForm((f) => ({
                          ...f,
                          allowed_modules: e.target.checked
                            ? [...f.allowed_modules, m.key]
                            : f.allowed_modules.filter((k) => k !== m.key),
                        }));
                      }}
                      className="accent-primary-500"
                    />
                    {m.label}
                  </label>
                );
              })}
            </div>
          </div>

          {error && <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setEditMember(null)}>Annuler</Button>
            <Button onClick={handleEditMember} disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => handleToggleActive(deleteConfirm, false)}
        title="Désactiver ce membre ?"
        message={`${deleteConfirm?.full_name} n'aura plus accès à votre espace Gestio. Vous pourrez le réactiver ultérieurement.`}
        confirmLabel="Désactiver"
      />
    </div>
  );
}
