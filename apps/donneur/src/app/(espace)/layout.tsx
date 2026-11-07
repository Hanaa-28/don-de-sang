"use client";
/**
 * Gabarit des écrans du donneur connecté (D8 à D14).
 * Sans session, retour à la connexion. Le vrai contrôle des droits reste
 * fait par le backend à chaque appel.
 */
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import BarreNavigation from "@/components/BarreNavigation";
import { FournisseurDonneur } from "@/components/ContexteDonneur";
import { lireJeton } from "@/lib/session";

export default function GabaritEspace({ children }: { children: React.ReactNode }) {
  const routeur = useRouter();
  const chemin = usePathname();
  const [pret, setPret] = useState(false);

  useEffect(() => {
    if (!lireJeton()) routeur.replace("/connexion");
    else setPret(true);
  }, [routeur]);

  if (!pret) return null;

  // Le détail d'une alerte (D10) est un écran de décision : pas de barre.
  const sansBarre = /^\/alertes\/.+/.test(chemin);

  return (
    <FournisseurDonneur>
      {children}
      {!sansBarre && <BarreNavigation />}
    </FournisseurDonneur>
  );
}
