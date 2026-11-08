import jwt from "jsonwebtoken";
import type { UtilisateurConnecte } from "../types.js";
import { config } from "../config.js";

/** Signe un jeton portant l'identité (donneur ou agent) et ses rôles. */
export function signerJeton(utilisateur: UtilisateurConnecte): string {
  return jwt.sign(utilisateur, config.jwtSecret, {
    expiresIn: config.jwtExpireDans as jwt.SignOptions["expiresIn"],
    subject: utilisateur.id,
  });
}

/** Vérifie un jeton et renvoie son contenu, ou lève si invalide/expiré. */
export function verifierJeton(jeton: string): UtilisateurConnecte {
  const decodé = jwt.verify(jeton, config.jwtSecret) as jwt.JwtPayload & UtilisateurConnecte;
  return {
    id: decodé.sub as string,
    type: decodé.type,
    roles: decodé.roles ?? [],
    siteId: decodé.siteId ?? null,
  };
}
