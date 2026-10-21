import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Don de sang",
  description: "Recevez les alertes de votre centre et suivez vos dons.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = { themeColor: "#b3122e", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
