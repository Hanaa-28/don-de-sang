import type { Role } from "@dds/contrat-api";

/** L'utilisateur authentifié, posé sur la requête par le middleware d'authentification. */
export interface UtilisateurConnecte {
  id: string;
  type: "donneur" | "agent";
  roles: Role[];
  /** Site auquel l'agent est rattaché (null pour un donneur). */
  siteId: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      utilisateur?: UtilisateurConnecte;
    }
  }
}

export {};
