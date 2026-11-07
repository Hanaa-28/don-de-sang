import type { Metadata, Viewport } from "next";
import Reseau from "@/components/Reseau";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Don de sang", template: "%s · Don de sang" },
  description: "Recevez les alertes de votre centre de transfusion et suivez vos dons.",
  manifest: "/manifest.json",
  applicationName: "Don de sang",
  appleWebApp: { capable: true, title: "Don de sang", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icones/icone-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icones/icone-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icones/icone-180.png",
  },
  // Safari iOS lit encore cette balise pour ouvrir l'application en plein écran.
  other: { "apple-mobile-web-app-capable": "yes" },
};

export const viewport: Viewport = {
  themeColor: "#0165FF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function GabaritRacine({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Reseau />
        {children}
      </body>
    </html>
  );
}
