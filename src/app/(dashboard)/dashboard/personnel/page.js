"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { useCrud } from "@/hooks/useSupabase";
import { IdCard, Plus, Pencil, Trash2, Search } from "lucide-react";

const emptyForm = { full_name: "", job_title: "" };

export default function PersonnelPage() {
  const { data: personnel, loading, fetchAll, create, update, remove } = useCrud("personnel");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  function openCreate() {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(p) {
    setForm({ full_name: p.full_name, job_title: p.job_title || "" });
    setEditing(p);
    setShowForm(true);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSave() {
    if (!form.full_name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await update(editing.id, form);
      } else {
        await create(form);
      }
      await fetchAll();
      setShowForm(false);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteConfirm) return;
    await remove(deleteConfirm.id);
    await fetchAll();
    setDeleteConfirm(null);
  }

  const filtered = personnel.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (p.job_title || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Header title="Personnel" />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm w-full border-none outline-none"
            />
          </div>
          <Button onClick={openCreate} className="flex-shrink-0">
            <Plus className="w-4 h-4" /> Ajouter une personne
          </Button>
        </div>

        <p className="text-xs text-muted">
          Cette liste alimente le champ « Personne à rencontrer » du module Rendez-vous. Elle n&apos;a pas besoin de correspondre à des comptes Gestio.
        </p>

        {loading ? (
          <div className="text-center py-12 text-muted">Chargement...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={IdCard}
            title="Aucun personnel enregistré"
            description="Ajoutez les personnes de l'entreprise que les visiteurs peuvent venir rencontrer (ex. le DG, un chef de service)."
            actionLabel="Ajouter une personne"
            onAction={openCreate}
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                      <IdCard className="w-5 h-5 text-primary-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{p.full_name}</p>
                      {p.job_title && <p className="text-xs text-muted truncate">{p.job_title}</p>}
                      {p.profile_id && <Badge variant="success" className="mt-1">Compte lié</Badge>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Modifier">
                      <Pencil className="w-4 h-4 text-slate-500" />
                    </button>
                    <button onClick={() => setDeleteConfirm(p)} className="p-1.5 rounded-lg hover:bg-danger-50" title="Supprimer">
                      <Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-500" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editing ? "Modifier" : "Ajouter une personne"} size="sm">
        <div className="space-y-4">
          <Input
            id="full_name" name="full_name" label="Nom et prénom"
            placeholder="Moussa Diop" value={form.full_name} onChange={handleChange} required
          />
          <Input
            id="job_title" name="job_title" label="Poste (optionnel)"
            placeholder="Directeur Général" value={form.job_title} onChange={handleChange}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !form.full_name.trim()}>
              {saving ? "Enregistrement..." : editing ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Supprimer cette personne ?"
        message={`Êtes-vous sûr de vouloir supprimer ${deleteConfirm?.full_name} de l'annuaire ?`}
        confirmLabel="Supprimer"
      />
    </div>
  );
}
