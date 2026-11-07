import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/erreurs.js";

/**
 * À poser après `authentifier` : n'autorise que les jetons de donneur.
 * Un jeton d'agent (ou absent) est refusé.
 */
export function exigerDonneur(req: Request, _res: Response, next: NextFunction): void {
  const u = req.utilisateur;
  if (!u) throw new AppError("NON_CONNECTE", "Connexion requise.", 401);
  if (u.type !== "donneur") throw new AppError("NON_CONNECTE", "Accès réservé aux donneurs.", 403);
  next();
}
