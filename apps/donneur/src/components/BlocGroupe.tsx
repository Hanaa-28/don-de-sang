import type { GroupeSanguin } from "@dds/contrat-api";

/**
 * Bloc de groupe sanguin, élément signature repris de DJIGUI.
 * Un groupe inconnu porte un tiret, jamais un vide.
 */
export default function BlocGroupe({ groupe, taille = "m" }: { groupe: GroupeSanguin | null; taille?: "s" | "m" | "l" }) {
  return (
    <span
      className={`bloc-groupe bloc-groupe--${taille}${groupe ? "" : " bloc-groupe--inconnu"}`}
      aria-label={groupe ? `Groupe ${groupe}` : "Groupe sanguin à préciser"}
    >
      {groupe ?? "—"}
    </span>
  );
}
