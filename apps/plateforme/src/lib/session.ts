/**
 * Session de l'agent, gardée sur le poste.
 * Le jeton et l'identité (rôles) restent après fermeture.
 */
import type { AgentConnecte } from "@dds/contrat-api";

const CLE_JETON = "dds:jeton-agent";
const CLE_UTILISATEUR = "dds:agent";

export function lireJeton(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CLE_JETON);
}

export function lireAgent(): AgentConnecte | null {
  if (typeof window === "undefined") return null;
  const brut = window.localStorage.getItem(CLE_UTILISATEUR);
  return brut ? (JSON.parse(brut) as AgentConnecte) : null;
}

export function ouvrirSession(jeton: string, agent: AgentConnecte) {
  window.localStorage.setItem(CLE_JETON, jeton);
  window.localStorage.setItem(CLE_UTILISATEUR, JSON.stringify(agent));
}

export function fermerSession() {
  window.localStorage.removeItem(CLE_JETON);
  window.localStorage.removeItem(CLE_UTILISATEUR);
}
