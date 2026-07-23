"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { formatCurrency } from "@/lib/utils";

const GRADIENT_120 = "linear-gradient(120deg,#4f46e5,#9333ea)";

const PLAN_ORDER = ["standard", "pro", "business"];
const CYCLE_BY_PLAN = { standard: "monthly", pro: "monthly", business: "quarterly" };
const PERIOD_LABEL = { monthly: "par mois", quarterly: "par trimestre" };

export default function PricingSection() {
  const [prices, setPrices] = useState({});

  useEffect(() => {
    fetch("/api/admin/plan-prices")
      .then((res) => res.json())
      .then((data) => setPrices(data || {}))
      .catch(() => {});
  }, []);

  return (
    <div className="grid sm:grid-cols-3 gap-6 text-left">
      {PLAN_ORDER.map((id) => {
        const plan = PLANS[id];
        const cycle = CYCLE_BY_PLAN[id];
        const price = prices[id]?.[cycle] ?? plan[`price_${cycle}`] ?? 0;
        const featured = plan.popular;

        return (
          <div
            key={id}
            className="relative bg-white"
            style={{
              borderRadius: "18px",
              padding: "32px 28px",
              border: featured ? "2px solid #6d28d9" : "1px solid #ece8fb",
              boxShadow: featured ? "0 20px 50px rgba(109,40,217,0.2)" : "0 10px 30px rgba(35,20,90,0.06)",
            }}
          >
            {featured && (
              <div className="absolute text-white font-bold" style={{ top: "-13px", right: "28px", background: GRADIENT_120, fontSize: "12px", padding: "5px 12px", borderRadius: "100px" }}>
                Populaire
              </div>
            )}
            <div className="font-bold" style={{ fontSize: "15px", color: "#181432", marginBottom: "10px" }}>{plan.name}</div>
            <div className="font-extrabold" style={{ fontSize: "34px", color: "#181432", marginBottom: "2px" }}>{formatCurrency(price)}</div>
            <div style={{ fontSize: "13px", color: "#8b85ab", marginBottom: "24px" }}>{PERIOD_LABEL[cycle]}</div>
            <div className="flex flex-col gap-3" style={{ marginBottom: "28px" }}>
              {plan.features.map((f) => (
                <div key={f} className="flex gap-2.5 items-start" style={{ fontSize: "14px", color: "#4b4570" }}>
                  <span className="font-bold" style={{ color: "#6d28d9" }}>✓</span>{f}
                </div>
              ))}
            </div>
            <Link
              href="/inscription"
              className="block text-center font-bold"
              style={{
                padding: "13px", borderRadius: "12px", fontSize: "14.5px",
                background: featured ? GRADIENT_120 : "#f3effe",
                color: featured ? "#fff" : "#181432",
              }}
            >
              Choisir {plan.name}
            </Link>
          </div>
        );
      })}
    </div>
  );
}
