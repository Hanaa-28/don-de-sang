import type { GroupeSanguin } from "@dds/contrat-api";

const CHEMIN = "M60 6 C 30 46 14 74 14 96 A 46 46 0 0 0 106 96 C 106 74 90 46 60 6 Z";

/** Goutte simple, pour l'ouverture et l'accueil. */
export function GoutteSimple({ className, couleur = "#fff" }: { className?: string; couleur?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 144" aria-hidden="true">
      <path d={CHEMIN} fill={couleur} />
    </svg>
  );
}

/**
 * Grande goutte de la carte de donneur (D8). Elle bat doucement quand le
 * donneur peut donner : un battement, jamais une alerte.
 */
export default function Goutte({ groupe, bat }: { groupe: GroupeSanguin | null; bat: boolean }) {
  return (
    <div
      className={`goutte${bat ? " goutte--bat" : ""}${groupe ? "" : " goutte--inconnue"}`}
      role="img"
      aria-label={groupe ? `Groupe sanguin ${groupe}` : "Groupe sanguin à préciser au centre"}
    >
      <svg viewBox="0 0 120 144" aria-hidden="true">
        <path d={CHEMIN} fill="var(--sang)" />
      </svg>
      <span className="goutte__texte" aria-hidden="true">{groupe ?? "?"}</span>
    </div>
  );
}
