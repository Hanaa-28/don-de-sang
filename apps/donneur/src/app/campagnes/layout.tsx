"use client";
/**
 * Gabarit des pages de collectes (C0 à C2).
 * Pages publiques : un visiteur sans compte y accède depuis la bienvenue.
 * Un donneur connecté y arrive par l'onglet « Collectes » : il garde alors
 * la barre du bas, comme dans le reste de son espace.
 */
import { useEffect, useState } from "react";
import BarreNavigation from "@/components/BarreNavigation";
import { FournisseurDonneur } from "@/components/ContexteDonneur";
import { lireJeton } from "@/lib/session";

export default function GabaritCampagnes({ children }: { children: React.ReactNode }) {
  const [connecte, setConnecte] = useState(false);
  useEffect(() => { setConnecte(Boolean(lireJeton())); }, []);

  if (!connecte) return <>{children}</>;
  return (
    <FournisseurDonneur>
      <div className="avec-barre">{children}</div>
      <BarreNavigation />
    </FournisseurDonneur>
  );
}
