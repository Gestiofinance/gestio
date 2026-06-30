"use client";

import { Modal } from "./modal";
import { Button } from "./button";

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirmer", variant = "danger" }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-muted mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Annuler</Button>
        <Button variant={variant} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
