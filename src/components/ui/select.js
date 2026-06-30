import { cn } from "@/lib/utils";

export function Select({ label, error, options = [], className, id, ...props }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          "w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 transition-colors appearance-none",
          error && "border-danger-500",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-danger-500">{error}</p>}
    </div>
  );
}
