"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { useSupabase } from "@/hooks/useSupabase";
import { useAuth } from "@/hooks/useAuth";
import {
  UserCog, UserPlus, Shield, Pencil, Trash2, Crown, Check,
} from "lucide-react";

const allModules = [
  { id: "clients", label: "Clients" },
  { id: "projets", label: "Projets" },
  { id: "taches", label: "Tâches" },
  { id: "planning", label: "Planning" },
  { id: "devis", label: "Devis" },
  { id: "factures", label: "Factures" },
  { id: "comptabilite", label: "Comptabilité" },
  { id: "equipe", label: "Équipe" },
  { id: "parametres", label: "Paramètres" },
];

const roleColors = {
  proprietaire: "primary", administrateur: "warning", comptable: "success",
  collaborateur: "default", lecture_seule: "default",
};

const roleLabels = {
  proprietaire: "Propriétaire", administrateur: "Administrateur", comptable: "Comptable",
  collaborateur: "Collaborateur", lecture_seule: "Lecture seule",
};

export default function EquipePage() {
  const supabase = useSupabase();
  const { profile, organization } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showEditRole, setShowEditRole] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [addForm, setAddForm] = useState({ full_name: "", email: "", password: "", modules: [] });
  const [editModules, setEditModules] = useState([]);

  useEffect(() => { loadMembers(); }, []);

  async function loadMembers() {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at");
    setMembers(data || []);
    setLoading(false);
  }

  function toggleModule(list, id) {
    return list.includes(id) ? list.filter((m) => m !== id) : [...list, id];
  }

  async function handleAddMember() {
    setSaving(true);
    setError("");
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: addForm.email,
        password: addForm.password,
        options: {
          data: { full_name: addForm.full_name, company_name: organization?.name },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setSaving(false);
        return;
      }

      if (data?.user) {
        await supabase.from("profiles").update({
          organization_id: organization?.id,
          role: "collaborateur",
          full_name: addForm.full_name,
        }).eq("id", data.user.id);
      }

      await loadMembers();
      setShowAdd(false);
      setAddForm({ full_name: "", email: "", password: "", modules: [] });
    } catch (e) {
      setError("Une erreur est survenue.");
    }
    setSaving(false);
  }

  async function handleUpdateRole() {
    if (!showEditRole) return;
    setSaving(true);
    await supabase.from("profiles").update({ role: editModules.length >= 7 ? "administrateur" : "collaborateur" }).eq("id", showEditRole.id);
    await loadMembers();
    setShowEditRole(null);
    setSaving(false);
  }

  async function handleRemoveMember() {
    if (!deleteConfirm) return;
    await supabase.from("profiles").update({ is_active: false }).eq("id", deleteConfirm.id);
    await loadMembers();
    setDeleteConfirm(null);
  }

  const isOwner = profile?.role === "proprietaire";

  return (
    <div>
      <Header title="Équipe" />
      <div className="p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Membres de l&apos;équipe</h2>
            <p className="text-sm text-muted mt-1">{members.length} membre{members.length > 1 ? "s" : ""}</p>
          </div>
          {isOwner && (
            <Button onClick={() => { setShowAdd(true); setAddForm({ full_name: "", email: "", password: "", modules: [] }); setError(""); }}>
              <UserPlus className="w-4 h-4" /> Ajouter un membre
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted">Chargement...</div>
        ) : members.length <= 1 ? (
          <EmptyState
            icon={UserCog}
            title="Vous êtes seul pour l'instant"
            description="Ajoutez des collaborateurs pour travailler ensemble sur Gestio."
            actionLabel={isOwner ? "Ajouter un collaborateur" : undefined}
            onAction={() => setShowAdd(true)}
          />
        ) : null}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <Card key={member.id} className="relative">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center">
                      <span className="text-sm font-semibold text-white">
                        {member.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{member.full_name}</p>
                      <p className="text-xs text-muted">{member.email}</p>
                      <Badge variant={roleColors[member.role]} className="mt-1">
                        {member.role === "proprietaire" && <Crown className="w-3 h-3 mr-1" />}
                        {roleLabels[member.role]}
                      </Badge>
                    </div>
                  </div>
                  {isOwner && member.role !== "proprietaire" && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setShowEditRole(member); setEditModules([]); }} className="p-1.5 rounded-lg hover:bg-slate-100" title="Permissions">
                        <Shield className="w-4 h-4 text-slate-400" />
                      </button>
                      <button onClick={() => setDeleteConfirm(member)} className="p-1.5 rounded-lg hover:bg-danger-50" title="Retirer">
                        <Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-500" />
                      </button>
                    </div>
                  )}
                </div>
                {!member.is_active && <Badge variant="danger" className="mt-2">Désactivé</Badge>}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Add member modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Ajouter un membre" size="md">
        <div className="space-y-4">
          <Input id="add_name" label="Nom complet" placeholder="Prénom et nom" value={addForm.full_name} onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })} required />
          <Input id="add_email" label="Adresse email" type="email" placeholder="collaborateur@entreprise.sn" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} required />
          <Input id="add_password" label="Mot de passe" type="password" placeholder="8 caractères minimum" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} required />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-0.5">Accès aux modules</label>
            <p className="text-xs text-muted mb-3">Cochez les modules que ce membre pourra voir et utiliser dans Gestio. Les modules non cochés seront masqués pour cet utilisateur.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allModules.map((mod) => (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setAddForm({ ...addForm, modules: toggleModule(addForm.modules, mod.id) })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                    addForm.modules.includes(mod.id)
                      ? "border-primary-500 bg-primary-50 text-primary-700 font-medium"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    addForm.modules.includes(mod.id) ? "bg-primary-500 border-primary-500" : "border-slate-300"
                  }`}>
                    {addForm.modules.includes(mod.id) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {mod.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setAddForm({ ...addForm, modules: addForm.modules.length === allModules.length ? [] : allModules.map((m) => m.id) })}
              className="text-xs text-primary-500 hover:text-primary-600 font-medium mt-2"
            >
              {addForm.modules.length === allModules.length ? "Tout décocher" : "Tout sélectionner"}
            </button>
          </div>

          {error && <p className="text-sm text-danger-500 bg-danger-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Annuler</Button>
            <Button onClick={handleAddMember} disabled={saving || !addForm.full_name || !addForm.email || !addForm.password}>
              {saving ? "Création..." : "Créer le compte"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit permissions modal */}
      <Modal open={!!showEditRole} onClose={() => setShowEditRole(null)} title={`Permissions de ${showEditRole?.full_name}`} size="md">
        <div className="space-y-4">
          <p className="text-sm text-muted">Sélectionnez les modules auxquels ce membre aura accès.</p>
          <div className="grid grid-cols-3 gap-2">
            {allModules.map((mod) => (
              <button
                key={mod.id}
                type="button"
                onClick={() => setEditModules(toggleModule(editModules, mod.id))}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                  editModules.includes(mod.id)
                    ? "border-primary-500 bg-primary-50 text-primary-700 font-medium"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                  editModules.includes(mod.id) ? "bg-primary-500 border-primary-500" : "border-slate-300"
                }`}>
                  {editModules.includes(mod.id) && <Check className="w-3 h-3 text-white" />}
                </div>
                {mod.label}
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowEditRole(null)}>Annuler</Button>
            <Button onClick={handleUpdateRole} disabled={saving}>{saving ? "Enregistrement..." : "Enregistrer"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={handleRemoveMember}
        title="Retirer ce membre ?" message={`${deleteConfirm?.full_name} n'aura plus accès à votre espace Gestio.`} confirmLabel="Retirer" />
    </div>
  );
}
