"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { User, UserPlus, Menu, X } from "lucide-react";

const navLinks = [
  ["#tarifs", "Tarifs"],
  ["#temoignages", "Témoignages"],
  ["#contact", "Contact"],
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "20px",
        paddingLeft: "16px",
        paddingRight: "16px",
        pointerEvents: "none",
      }}
    >
      {/* ── Pill container ── */}
      <div
        style={{
          maxWidth: "1400px",
          width: "100%",
          height: "80px",
          borderRadius: "9999px",
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow:
            "0 10px 40px rgba(139,92,246,0.10), 0 2px 8px rgba(0,0,0,0.05)",
          display: "flex",
          alignItems: "center",
          paddingLeft: "32px",
          paddingRight: "24px",
          position: "relative",
          pointerEvents: "auto",
        }}
      >
        {/* ── Logo ── */}
        <Link href="/" style={{ display: "flex", alignItems: "center", flexShrink: 0, zIndex: 1 }}>
          <Image
            src="/GESIO-logo-app.png"
            alt="Gestio"
            width={200}
            height={52}
            style={{ objectFit: "contain", objectPosition: "left center" }}
            priority
          />
        </Link>

        {/* ── Nav — perfectly centered ── */}
        <div
          className="hidden md:block"
          style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }}
        >
          <nav style={{ display: "flex", alignItems: "center", gap: "56px" }}>
            {navLinks.map(([href, label]) => (
              <NavLink key={href} href={href}>{label}</NavLink>
            ))}
          </nav>
        </div>

        {/* ── Actions ── */}
        <div
          className="hidden md:flex"
          style={{ marginLeft: "auto", alignItems: "center", gap: "12px" }}
        >
          <LoginButton />
          <RegisterButton />
        </div>

        {/* ── Mobile burger ── */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#1E1B4B",
            padding: "8px",
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile dropdown ── */}
      {mobileOpen && (
        <div
          style={{
            marginTop: "12px",
            width: "calc(100% - 32px)",
            maxWidth: "640px",
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: "28px",
            padding: "20px",
            boxShadow: "0 16px 48px rgba(139,92,246,0.18)",
            border: "1px solid rgba(255,255,255,0.8)",
            pointerEvents: "auto",
          }}
        >
          <nav style={{ display: "flex", flexDirection: "column", marginBottom: "16px" }}>
            {navLinks.map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                style={{
                  padding: "14px 16px",
                  color: "#1E1B4B",
                  fontWeight: 500,
                  fontSize: "16px",
                  borderRadius: "16px",
                  textDecoration: "none",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(139,92,246,0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {label}
              </a>
            ))}
          </nav>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                height: "52px", borderRadius: "9999px",
                border: "2px solid #8B5CF6",
                color: "#7C3AED", fontWeight: 600, fontSize: "15px", textDecoration: "none",
              }}
            >
              <User size={17} /> Connexion
            </Link>
            <Link
              href="/inscription"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                height: "52px", borderRadius: "9999px",
                background: "linear-gradient(135deg, #5E5CE6 0%, #7C3AED 50%, #A855F7 100%)",
                color: "white", fontWeight: 600, fontSize: "15px", textDecoration: "none",
              }}
            >
              <UserPlus size={17} /> S&apos;inscrire
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function NavLink({ href, children }) {
  return (
    <a
      href={href}
      style={{
        fontFamily: "Inter, var(--font-sans), sans-serif",
        fontSize: "17px",
        fontWeight: 500,
        color: "#1E1B4B",
        textDecoration: "none",
        transition: "all 0.25s ease",
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = "#7C3AED";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = "#1E1B4B";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {children}
    </a>
  );
}

function LoginButton() {
  return (
    <Link
      href="/login"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        width: "200px",
        height: "54px",
        borderRadius: "9999px",
        border: "2px solid #8B5CF6",
        background: "transparent",
        color: "#7C3AED",
        fontWeight: 600,
        fontSize: "15px",
        textDecoration: "none",
        transition: "all 0.25s ease",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(139,92,246,0.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <User size={17} strokeWidth={2} />
      Connexion
    </Link>
  );
}

function RegisterButton() {
  return (
    <Link
      href="/inscription"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "8px",
        width: "200px",
        height: "54px",
        borderRadius: "9999px",
        background: "linear-gradient(135deg, #5E5CE6 0%, #7C3AED 50%, #A855F7 100%)",
        color: "white",
        fontWeight: 600,
        fontSize: "15px",
        textDecoration: "none",
        transition: "all 0.25s ease",
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 10px 30px rgba(139,92,246,0.35)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <UserPlus size={17} strokeWidth={2} />
      S&apos;inscrire
    </Link>
  );
}
