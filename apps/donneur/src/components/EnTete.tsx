"use client";
import Link from "next/link";
import { ArrowLeft, Bell, UserRound } from "lucide-react";
import { useDonneur } from "./ContexteDonneur";

/** Cloche des notifications (D14), avec le nombre de messages non lus. */
export function Cloche({ clair }: { clair?: boolean }) {
  const { nonLues } = useDonneur();
  return (
    <Link href="/notifications" className={`icone-bouton${clair ? " icone-bouton--clair" : ""}`}
          aria-label={nonLues ? `Notifications, ${nonLues} non lue${nonLues > 1 ? "s" : ""}` : "Notifications"}>
      <Bell size={22} aria-hidden="true" />
      {nonLues > 0 && <span className="pastille-compte" aria-hidden="true">{nonLues > 9 ? "9+" : nonLues}</span>}
    </Link>
  );
}

/** Accès au profil (D13), en haut de chaque écran connecté. */
export function IconeProfil({ clair }: { clair?: boolean }) {
  return (
    <Link href="/profil" className={`icone-bouton${clair ? " icone-bouton--clair" : ""}`} aria-label="Mon profil">
      <UserRound size={22} aria-hidden="true" />
    </Link>
  );
}

/** En-tête des écrans connectés : titre à gauche, cloche et profil à droite. */
export default function EnTete({ titre, sansCloche, sansProfil }:
  { titre: string; sansCloche?: boolean; sansProfil?: boolean }) {
  return (
    <header className="entete">
      <h1 className="entete__titre">{titre}</h1>
      <div className="rang" style={{ gap: 0 }}>
        {!sansCloche && <Cloche />}
        {!sansProfil && <IconeProfil />}
      </div>
    </header>
  );
}

export function Retour({ vers, mot = "Retour" }: { vers: string; mot?: string }) {
  return (
    <Link href={vers} className="lien retour">
      <ArrowLeft size={18} aria-hidden="true" />
      {mot}
    </Link>
  );
}
