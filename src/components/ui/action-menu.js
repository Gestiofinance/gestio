"use client";

import { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";

export function ActionMenu({ children }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={menuRef}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-lg hover:bg-slate-100"
      >
        <MoreVertical className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]" onClick={() => setOpen(false)}>
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-slate-200 rounded-xl shadow-2xl py-2 w-56 animate-in fade-in zoom-in-95"
            >
              <div className="px-3 py-1.5 border-b border-slate-100 mb-1">
                <p className="text-xs font-semibold text-muted uppercase tracking-wider">Actions</p>
              </div>
              <div onClick={() => setOpen(false)}>
                {children}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function ActionMenuItem({ icon: Icon, label, onClick, variant = "default" }) {
  const colors = {
    default: "text-slate-600 hover:bg-slate-50",
    primary: "text-primary-500 hover:bg-primary-50",
    success: "text-success-600 hover:bg-success-50",
    danger: "text-danger-500 hover:bg-danger-50",
  };

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm ${colors[variant]}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
    </button>
  );
}
