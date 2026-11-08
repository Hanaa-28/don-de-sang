"use client";
/**
 * D1 · Ouverture.
 * Un battement de cœur, puis l'application choisit la suite :
 * donneur déjà connecté → sa carte (D8) ; sinon → bienvenue (D2).
 * Un toucher passe l'écran : sur une connexion lente, on ne fait pas attendre.
 */
import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoutteSimple } from "@/components/Goutte";
import { lireJeton } from "@/lib/session";

const DUREE_MS = 1600;

export default function Ouverture() {
  const routeur = useRouter();

  const continuer = useCallback(() => {
    routeur.replace(lireJeton() ? "/carte" : "/bienvenue");
  }, [routeur]);

  useEffect(() => {
    const minuterie = setTimeout(continuer, DUREE_MS);
    return () => clearTimeout(minuterie);
  }, [continuer]);

  return (
    <main className="ouverture" onClick={continuer}>
      <GoutteSimple className="ouverture__goutte" />
      <div className="pile-s" style={{ alignItems: "center" }}>
        <p className="ouverture__nom">Don de sang</p>
        <p className="ouverture__devise">Prévenu à temps, vous sauvez une vie.</p>
      </div>
      <span className="ouverture__passer">Toucher l’écran pour continuer</span>
    </main>
  );
}
