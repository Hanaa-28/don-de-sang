import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/erreurs.js";
import { verifierJeton } from "../lib/jwt.js";

/** Vérifie le jeton « Authorization: Bearer … » et pose l'utilisateur sur la requête. */
export function authentifier(req: Request, _res: Response, next: NextFunction): void {
  const entete = req.headers.authorization;
  if (!entete?.startsWith("Bearer ")) {
    throw new AppError("NON_CONNECTE", "Connexion requise.", 401);
  }
  try {
    req.utilisateur = verifierJeton(entete.slice("Bearer ".length));
    next();
  } catch {
    throw new AppError("NON_CONNECTE", "Session invalide ou expirée.", 401);
  }
}
