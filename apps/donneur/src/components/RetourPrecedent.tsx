"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { lireJeton } from "@/lib/session";

/**
 * Retour à l'écran précédent. Les pages publiques (campagnes) s'ouvrent depuis
 * la bienvenue comme depuis l'espace connecté : on revient d'où l'on vient.
 */
export default function RetourPrecedent({ secours = "/bienvenue", masquerSiConnecte }:
  { secours?: string; masquerSiConnecte?: boolean }) {
  const routeur = useRouter();
  const [connecte, setConnecte] = useState(false);
  useEffect(() => { setConnecte(Boolean(lireJeton())); }, []);
  // Donneur connecté arrivé par l'onglet « Collectes » : la barre du bas suffit.
  if (masquerSiConnecte && connecte) return null;
  return (
    <button type="button" className="lien retour"
            onClick={() => (window.history.length > 1 ? routeur.back() : routeur.push(secours))}>
      <ArrowLeft size={18} aria-hidden="true" />Retour
    </button>
  );
}
