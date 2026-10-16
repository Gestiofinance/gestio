import { Plus_Jakarta_Sans } from "next/font/google";
import { ReferralCapture } from "@/components/affiliate/referral-capture";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "Gestio — Tout votre business, un seul outil",
  description:
    "Plateforme de gestion entrepreneuriale tout-en-un pour les entrepreneurs, TPE et PME en Afrique francophone.",
  icons: {
    icon: "/Gestio-Favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className={`${plusJakarta.variable} h-full`}>
      <body className="h-full antialiased">
        <ReferralCapture />
        {children}
      </body>
    </html>
  );
}
