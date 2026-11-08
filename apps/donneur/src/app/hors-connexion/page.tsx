"use client";
/**
 * Page hors connexion, affichée par l'agent de service quand le téléphone
 * n'a pas de réseau et que la page demandée n'a jamais été ouverte.
 */
import { RefreshCw, WifiOff } from "lucide-react";
import Bouton from "@/components/Bouton";
import { EtatVide } from "@/components/Etats";

export default function HorsConnexion() {
  return (
    <main className="acces">
      <div className="acces__corps">
        <EtatVide icone={<WifiOff size={28} aria-hidden="true" />} titre="Pas de réseau">
          <p className="appui">
            Cette page n’a pas encore été ouverte sur ce téléphone, elle ne peut donc pas s’afficher sans
            connexion. Les pages déjà consultées (votre carte, vos alertes) restent disponibles.
          </p>
        </EtatVide>
        <Bouton large onClick={() => window.location.reload()} icone={<RefreshCw size={18} aria-hidden="true" />}>
          Réessayer
        </Bouton>
      </div>
    </main>
  );
}
