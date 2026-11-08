import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Plateforme CNTS", template: "%s · CNTS" },
  description: "Prélèvement, laboratoire, stock, distribution et traçabilité des poches de sang.",
};

export const viewport: Viewport = {
  themeColor: "#0165FF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
