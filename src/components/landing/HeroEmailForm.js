"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeroEmailForm() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  function handleSubmit(e) {
    e.preventDefault();
    const dest = email ? `/inscription?email=${encodeURIComponent(email)}` : "/inscription";
    router.push(dest);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center w-full max-w-xl mx-auto bg-white rounded-full shadow-xl overflow-hidden px-2 py-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Entrez votre adresse email"
        className="flex-1 px-5 py-2.5 text-sm text-slate-700 placeholder-slate-400 bg-transparent outline-none"
      />
      <button
        type="submit"
        className="shrink-0 px-6 py-2.5 rounded-full text-sm font-bold text-white transition-all hover:opacity-90 hover:shadow-lg"
        style={{ background: "linear-gradient(135deg, #5E5CE6, #7C3AED)" }}
      >
        Demander une démo
      </button>
    </form>
  );
}
