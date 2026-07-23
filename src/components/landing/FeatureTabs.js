"use client";

import { useState } from "react";
import Image from "next/image";

const tabs = [
  { key: "dashboard", label: "Tableau de bord", image: "/landing/shot-dashboard.webp" },
  { key: "factures", label: "Facturation", image: "/landing/shot-factures.webp" },
  { key: "planning", label: "Planning", image: "/landing/shot-planning.webp" },
  { key: "compta", label: "Comptabilité", image: "/landing/shot-compta.webp" },
];

export default function FeatureTabs() {
  const [active, setActive] = useState("dashboard");
  const activeTab = tabs.find((t) => t.key === active);

  return (
    <>
      <div className="inline-flex bg-[#f3effe] p-1.5 rounded-full gap-1 mb-11">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className="px-[22px] py-[11px] rounded-full text-sm font-semibold transition-all"
            style={
              tab.key === active
                ? { background: "#181432", color: "#fff" }
                : { color: "#5c5680" }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Image
        src={activeTab.image}
        alt={activeTab.label}
        width={1140}
        height={700}
        className="block w-full h-auto"
        unoptimized
        priority
      />
    </>
  );
}
