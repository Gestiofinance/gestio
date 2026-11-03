"use client";

import { useRef, useEffect } from "react";
import { Bold, Italic, Underline } from "lucide-react";

const FONTS = [
  { value: "", label: "Police" },
  { value: "Arial, Helvetica, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "'Segoe UI', Arial, sans-serif", label: "Segoe UI" },
];

// Éditeur WYSIWYG minimal (gras, italique, souligné, police) — le contenu
// reste du HTML en interne (nécessaire pour l'email), mais l'utilisateur ne
// voit jamais de balises, juste un éditeur de texte classique.
export function RichTextEditor({ value, onChange, placeholder, minHeight = 220 }) {
  const ref = useRef(null);
  const skipNextSync = useRef(false);

  useEffect(() => {
    if (ref.current && !skipNextSync.current && ref.current.innerHTML !== (value || "")) {
      ref.current.innerHTML = value || "";
    }
    skipNextSync.current = false;
  }, [value]);

  function handleInput() {
    skipNextSync.current = true;
    onChange(ref.current.innerHTML);
  }

  function exec(command, arg) {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    handleInput();
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-50">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} className="p-1.5 rounded hover:bg-slate-200" title="Gras">
          <Bold className="w-4 h-4 text-slate-600" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} className="p-1.5 rounded hover:bg-slate-200" title="Italique">
          <Italic className="w-4 h-4 text-slate-600" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")} className="p-1.5 rounded hover:bg-slate-200" title="Souligné">
          <Underline className="w-4 h-4 text-slate-600" />
        </button>
        <select
          onMouseDown={(e) => e.preventDefault()}
          onChange={(e) => { if (e.target.value) exec("fontName", e.target.value); e.target.value = ""; }}
          defaultValue=""
          className="text-xs ml-2 px-1.5 py-1 rounded border border-slate-200 bg-white text-slate-600 outline-none"
        >
          {FONTS.map((f) => <option key={f.value} value={f.value} disabled={!f.value}>{f.label}</option>)}
        </select>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{ minHeight }}
        className="p-3 text-sm outline-none overflow-y-auto max-h-[420px] empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
      />
    </div>
  );
}
