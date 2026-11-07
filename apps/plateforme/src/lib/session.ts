import type { Role } from "@dds/contrat-api";

/**
 * Session de l'agent connecté, gardée sur le poste.
 * Reprend le jeton après fermeture de l'onglet (RG39 : la session
 * professionnelle se prolonge), à la différence du verrou d'application
 * du donneur.
 */
const CLE_JETON = "dds-plateforme:jeton";
const CLE_AGENT = "dds-plateforme:agent";

export interface AgentSession {
  id: string;
  nomComplet: string;
  roles: Role[];
  siteId: string;
}

export function lireJeton(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CLE_JETON);
}

export function lireAgent(): AgentSession | null {
  if (typeof window === "undefined") return null;
  const brut = window.localStorage.getItem(CLE_AGENT);
  return brut ? (JSON.parse(brut) as AgentSession) : null;
}

export function ouvrirSession(jeton: string, agent: AgentSession) {
  window.localStorage.setItem(CLE_JETON, jeton);
  window.localStorage.setItem(CLE_AGENT, JSON.stringify(agent));
}

export function fermerSession() {
  window.localStorage.removeItem(CLE_JETON);
  window.localStorage.removeItem(CLE_AGENT);
}
