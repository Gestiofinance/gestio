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
    <div className="fixed top-0 left-0 right-0 z-[100] flex flex-col items-center px-4 pt-5 pointer-events-none">

      {/* ── Pill ── */}
      <div
        className="w-full pointer-events-auto"
        style={{
          maxWidth: "1400px",
          height: "80px",
          borderRadius: "9999px",
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.7)",
          boxShadow: "0 10px 40px rgba(139,92,246,0.10), 0 2px 8px rgba(0,0,0,0.05)",
        }}
      >
        {/* ── Inner flex: Logo | Nav (flex-1) | Buttons | Burger ── */}
        <div className="flex items-center h-full px-7">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <Image
              src="/GESIO-logo-app.png"
              alt="Gestio"
              width={130}
              height={36}
              style={{ objectFit: "contain", objectPosition: "left center" }}
              priority
            />
          </Link>

          {/* Nav — desktop only, takes flex-1 and centers content */}
          <div className="hidden md:flex flex-1 items-center justify-center" style={{ gap: "52px" }}>
            {navLinks.map(([href, label]) => (
              <NavLink key={href} href={href}>{label}</NavLink>
            ))}
          </div>

          {/* Desktop buttons — flex-shrink-0 so they never wrap */}
          <div className="hidden md:flex items-center flex-shrink-0" style={{ gap: "10px" }}>
            <LoginBtn />
            <RegisterBtn />
          </div>

          {/* Mobile burger — ml-auto pushes to far right */}
          <button
            className="md:hidden ml-auto flex items-center justify-center"
            onClick={() => setMobileOpen((v) => !v)}
            style={{
              width: "42px", height: "42px",
              borderRadius: "12px",
              background: mobileOpen ? "rgba(139,92,246,0.08)" : "transparent",
              border: "none",
              cursor: "pointer",
              color: "#1E1B4B",
            }}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* ── Mobile dropdown ── */}
      {mobileOpen && (
        <div
          className="pointer-events-auto"
          style={{
            marginTop: "10px",
            width: "calc(100% - 0px)",
            maxWidth: "1400px",
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            borderRadius: "28px",
            padding: "20px 24px",
            boxShadow: "0 16px 48px rgba(139,92,246,0.18)",
            border: "1px solid rgba(255,255,255,0.8)",
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

/* ── NavLink ── */
function NavLink({ href, children }) {
  return (
    <a
      href={href}
      style={{
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

/* ── Login button ── */
function LoginBtn() {
  return (
    <Link
      href="/login"
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
        width: "190px", height: "52px",
        borderRadius: "9999px",
        border: "2px solid #8B5CF6",
        background: "transparent",
        color: "#7C3AED",
        fontWeight: 600, fontSize: "15px",
        textDecoration: "none",
        transition: "all 0.25s ease",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(139,92,246,0.08)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <User size={16} strokeWidth={2} />
      Connexion
    </Link>
  );
}

/* ── Register button ── */
function RegisterBtn() {
  return (
    <Link
      href="/inscription"
      style={{
        display: "flex", alignItems: "center", justifyContent: "center", gap: "7px",
        width: "190px", height: "52px",
        borderRadius: "9999px",
        background: "linear-gradient(135deg, #5E5CE6 0%, #7C3AED 50%, #A855F7 100%)",
        color: "white",
        fontWeight: 600, fontSize: "15px",
        textDecoration: "none",
        transition: "all 0.25s ease",
        whiteSpace: "nowrap",
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
      <UserPlus size={16} strokeWidth={2} />
      S&apos;inscrire
    </Link>
  );
}
