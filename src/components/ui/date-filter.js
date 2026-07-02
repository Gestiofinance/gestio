"use client";

// Reusable date period filter component + utility

export function applyDateFilter(items, dateField, period, customStart, customEnd) {
  if (!period) return items;
  const now = new Date();
  return items.filter((item) => {
    const raw = item[dateField];
    if (!raw) return period === "custom" ? false : true;
    const d = new Date(raw);
    if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === "quarter") {
      const q = Math.floor(now.getMonth() / 3);
      return Math.floor(d.getMonth() / 3) === q && d.getFullYear() === now.getFullYear();
    }
    if (period === "year") return d.getFullYear() === now.getFullYear();
    if (period === "custom" && customStart && customEnd) {
      return d >= new Date(customStart) && d <= new Date(customEnd + "T23:59:59");
    }
    return true;
  });
}

export function DateFilter({ period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd, className = "" }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <select
        value={period}
        onChange={(e) => setPeriod(e.target.value)}
        className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600"
      >
        <option value="">Toutes les périodes</option>
        <option value="month">Ce mois</option>
        <option value="quarter">Ce trimestre</option>
        <option value="year">Cette année</option>
        <option value="custom">Période personnalisée</option>
      </select>
      {period === "custom" && (
        <>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600"
          />
          <span className="text-slate-400 text-sm">→</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm text-slate-600"
          />
        </>
      )}
    </div>
  );
}
