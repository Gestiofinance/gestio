"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState } from "@/components/ui/empty-state";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCrud } from "@/hooks/useSupabase";
import {
  Users, Plus, Search, Building2, User, Mail, Phone, MapPin, MoreVertical, Pencil, Trash2, Eye,
} from "lucide-react";

const statusOptions = [
  { value: "actif", label: "Actif" },
  { value: "inactif", label: "Inactif" },
  { value: "prospect", label: "Prospect" },
];

const typeOptions = [
  { value: "entreprise", label: "Entreprise" },
  { value: "particulier", label: "Particulier" },
];

const statusColors = {
  actif: "success",
  inactif: "default",
  prospect: "primary",
};

const emptyForm = {
  type: "entreprise",
  company_name: "",
  contact_name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  ninea: "",
  rccm: "",
  notes: "",
  status: "actif",
};

export default function ClientsPage() {
  const { data: clients, loading, fetchAll, create, update, remove } = useCrud("clients");
  const [view, setView] = useState("liste");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const filteredClients = clients.filter((c) => {
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterType && c.type !== filterType) return false;
    const q = search.toLowerCase();
    return (
      (c.company_name || "").toLowerCase().includes(q) ||
      c.contact_name.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  function openCreate() {
    setForm(emptyForm);
    setEditingClient(null);
    setShowForm(true);
  }

  function openEdit(client) {
    setForm({
      type: client.type,
      company_name: client.company_name || "",
      contact_name: client.contact_name,
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      city: client.city || "",
      ninea: client.ninea || "",
      rccm: client.rccm || "",
      notes: client.notes || "",
      status: client.status,
    });
    setEditingClient(client);
    setShowForm(true);
    setActiveMenu(null);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editingClient) {
        await update(editingClient.id, form);
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
    try {
      await remove(deleteConfirm.id);
      await fetchAll();
      setDeleteConfirm(null);
      setShowDetail(null);
    } catch (err) {
      console.error(err);
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  const columns = [
    {
      key: "contact_name",
      label: "Nom / Entreprise",
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
            {row.type === "entreprise" ? (
              <Building2 className="w-4 h-4 text-primary-500" />
            ) : (
              <User className="w-4 h-4 text-primary-500" />
            )}
          </div>
          <div>
            <p className="font-medium text-foreground">{row.company_name || row.contact_name}</p>
            {row.company_name && (
              <p className="text-xs text-muted">{row.contact_name}</p>
            )}
          </div>
        </div>
      ),
    },
    { key: "email", label: "Email", render: (v) => <span className="text-slate-600 text-xs">{v || "—"}</span> },
    { key: "phone", label: "Téléphone", render: (v) => <span className="text-slate-600">{v || "—"}</span> },
    {
      key: "status",
      label: "Statut",
      render: (v) => <Badge variant={statusColors[v]}>{v}</Badge>,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setShowDetail(row)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Aperçu"><Eye className="w-4 h-4 text-slate-500" /></button>
          <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-slate-100" title="Modifier"><Pencil className="w-4 h-4 text-slate-500" /></button>
          <button onClick={() => setDeleteConfirm(row)} className="p-1.5 rounded-lg hover:bg-danger-50" title="Supprimer"><Trash2 className="w-4 h-4 text-slate-400 hover:text-danger-500" /></button>
        </div>
      ),
    },
  ];

  const kanbanStatuses = ["prospect", "actif", "inactif"];
  const kanbanLabels = { prospect: "Prospects", actif: "Actifs", inactif: "Inactifs" };

  return (
    <div onClick={() => setActiveMenu(null)}>
      <Header title="Clients" />
      <div className="p-4 sm:p-6 space-y-4">
        {/* Top bar */}
        <div className="flex flex-col gap-3">
          <Tabs
            tabs={[
              { value: "liste", label: "Liste", count: clients.length },
              { value: "kanban", label: "Kanban" },
            ]}
            activeTab={view}
            onChange={setView}
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white sm:flex-1">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input type="text" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent text-sm w-full border-none outline-none" />
            </div>
            <div className="flex items-center gap-2">
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="flex-1 sm:flex-none px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600">
                <option value="">Statut</option>
                <option value="actif">Actif</option>
                <option value="prospect">Prospect</option>
                <option value="inactif">Inactif</option>
              </select>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="hidden sm:block flex-none px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600">
                <option value="">Tous les types</option>
                <option value="entreprise">Entreprise</option>
                <option value="particulier">Particulier</option>
              </select>
              <Button onClick={openCreate} className="flex-shrink-0">
                <Plus className="w-4 h-4" /> Nouveau client
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="text-center py-12 text-muted">Chargement...</div>
        ) : clients.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun client pour le moment"
            description="Commencez par ajouter votre premier client pour créer des devis et factures."
            actionLabel="Ajouter un client"
            onAction={openCreate}
          />
        ) : view === "liste" ? (
          <>
            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {filteredClients.length === 0 ? (
                <p className="text-center py-8 text-muted text-sm">Aucun client trouvé</p>
              ) : filteredClients.map((client) => (
                <div key={client.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-4 cursor-pointer active:bg-slate-50" onClick={() => setShowDetail(client)}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                        {client.type === "entreprise" ? <Building2 className="w-5 h-5 text-primary-500" /> : <User className="w-5 h-5 text-primary-500" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground text-sm truncate">{client.company_name || client.contact_name}</p>
                            {client.company_name && <p className="text-xs text-muted">{client.contact_name}</p>}
                          </div>
                          <Badge variant={statusColors[client.status]} className="flex-shrink-0 text-xs">{client.status}</Badge>
                        </div>
                        <div className="mt-2 space-y-0.5">
                          {client.email && <p className="text-xs text-slate-500 truncate">{client.email}</p>}
                          {client.phone && <p className="text-xs text-slate-500">{client.phone}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="secondary" className="flex-1 text-xs" onClick={() => setShowDetail(client)}>
                      <Eye className="w-3.5 h-3.5" /> Voir
                    </Button>
                    {client.email && (
                      <a href={`mailto:${client.email}`} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-primary-50" title="Email">
                        <Mail className="w-4 h-4 text-primary-500" />
                      </a>
                    )}
                    {client.phone && (
                      <a href={`tel:${client.phone}`} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-success-50" title="Appeler">
                        <Phone className="w-4 h-4 text-success-500" />
                      </a>
                    )}
                    <button onClick={() => openEdit(client)} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-100" title="Modifier">
                      <Pencil className="w-4 h-4 text-slate-500" />
                    </button>
                    <button onClick={() => setDeleteConfirm(client)} className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-danger-50" title="Supprimer">
                      <Trash2 className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {/* Desktop table */}
            <Card className="hidden sm:block">
              <DataTable columns={columns} data={filteredClients} onRowClick={(row) => setShowDetail(row)} emptyMessage="Aucun client trouvé" />
            </Card>
          </>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {kanbanStatuses.map((status) => (
              <div key={status} className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold text-slate-700">{kanbanLabels[status]}</h3>
                  <Badge variant={statusColors[status]}>
                    {filteredClients.filter((c) => c.status === status).length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {filteredClients
                    .filter((c) => c.status === status)
                    .map((client) => (
                      <Card
                        key={client.id}
                        className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setShowDetail(client)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center">
                            {client.type === "entreprise" ? (
                              <Building2 className="w-3.5 h-3.5 text-primary-500" />
                            ) : (
                              <User className="w-3.5 h-3.5 text-primary-500" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {client.company_name || client.contact_name}
                            </p>
                          </div>
                        </div>
                        {client.email && (
                          <div className="flex items-center gap-1.5 text-xs text-muted">
                            <Mail className="w-3 h-3" /> {client.email}
                          </div>
                        )}
                        {client.phone && (
                          <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
                            <Phone className="w-3 h-3" /> {client.phone}
                          </div>
                        )}
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingClient ? "Modifier le client" : "Nouveau client"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              id="type"
              name="type"
              label="Type"
              options={typeOptions}
              value={form.type}
              onChange={handleChange}
            />
            <Select
              id="status"
              name="status"
              label="Statut"
              options={statusOptions}
              value={form.status}
              onChange={handleChange}
            />
          </div>
          {form.type === "entreprise" && (
            <Input
              id="company_name"
              name="company_name"
              label="Raison sociale"
              placeholder="Nom de l'entreprise"
              value={form.company_name}
              onChange={handleChange}
            />
          )}
          <Input
            id="contact_name"
            name="contact_name"
            label="Nom du contact"
            placeholder="Prénom et nom"
            value={form.contact_name}
            onChange={handleChange}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="email"
              name="email"
              label="Email"
              type="email"
              placeholder="email@exemple.com"
              value={form.email}
              onChange={handleChange}
            />
            <Input
              id="phone"
              name="phone"
              label="Téléphone"
              placeholder="+221 77 000 00 00"
              value={form.phone}
              onChange={handleChange}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="address"
              name="address"
              label="Adresse"
              placeholder="Adresse complète"
              value={form.address}
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
          {form.type === "entreprise" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="ninea"
                name="ninea"
                label="NINEA"
                placeholder="Numéro NINEA"
                value={form.ninea}
                onChange={handleChange}
              />
              <Input
                id="rccm"
                name="rccm"
                label="RCCM"
                placeholder="Numéro RCCM"
                value={form.rccm}
                onChange={handleChange}
              />
            </div>
          )}
          <Textarea
            id="notes"
            name="notes"
            label="Notes internes"
            placeholder="Notes sur ce client..."
            value={form.notes}
            onChange={handleChange}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving || !form.contact_name}>
              {saving ? "Enregistrement..." : editingClient ? "Modifier" : "Créer le client"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        open={!!showDetail}
        onClose={() => setShowDetail(null)}
        title="Fiche client"
        size="lg"
      >
        {showDetail && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center">
                {showDetail.type === "entreprise" ? (
                  <Building2 className="w-7 h-7 text-primary-500" />
                ) : (
                  <User className="w-7 h-7 text-primary-500" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {showDetail.company_name || showDetail.contact_name}
                </h3>
                {showDetail.company_name && (
                  <p className="text-sm text-muted">{showDetail.contact_name}</p>
                )}
                <Badge variant={statusColors[showDetail.status]} className="mt-1">
                  {showDetail.status}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {showDetail.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted" />
                  <span>{showDetail.email}</span>
                </div>
              )}
              {showDetail.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted" />
                  <span>{showDetail.phone}</span>
                </div>
              )}
              {(showDetail.address || showDetail.city) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted" />
                  <span>{[showDetail.address, showDetail.city].filter(Boolean).join(", ")}</span>
                </div>
              )}
            </div>
            {(showDetail.ninea || showDetail.rccm) && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                {showDetail.ninea && (
                  <div>
                    <p className="text-xs text-muted mb-0.5">NINEA</p>
                    <p className="text-sm font-medium">{showDetail.ninea}</p>
                  </div>
                )}
                {showDetail.rccm && (
                  <div>
                    <p className="text-xs text-muted mb-0.5">RCCM</p>
                    <p className="text-sm font-medium">{showDetail.rccm}</p>
                  </div>
                )}
              </div>
            )}
            {showDetail.notes && (
              <div>
                <p className="text-xs text-muted mb-1">Notes</p>
                <p className="text-sm text-slate-600">{showDetail.notes}</p>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => { setDeleteConfirm(showDetail); }}
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </Button>
              <Button size="sm" onClick={() => { openEdit(showDetail); setShowDetail(null); }}>
                <Pencil className="w-4 h-4" /> Modifier
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Supprimer ce client ?"
        message={`Êtes-vous sûr de vouloir supprimer ${deleteConfirm?.company_name || deleteConfirm?.contact_name} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
      />
    </div>
  );
}
