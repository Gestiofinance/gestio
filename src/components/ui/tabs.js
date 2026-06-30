"use client";

import { cn } from "@/lib/utils";

export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-lg w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md transition-all",
            activeTab === tab.value
              ? "bg-white text-foreground shadow-sm"
              : "text-slate-500 hover:text-foreground"
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              "ml-2 px-1.5 py-0.5 rounded-full text-xs",
              activeTab === tab.value ? "bg-primary-50 text-primary-600" : "bg-slate-200 text-slate-500"
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
