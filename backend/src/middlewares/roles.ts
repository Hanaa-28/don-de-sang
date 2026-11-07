import type { NextFunction, Request, Response } from "express";
import type { Role } from "@dds/contrat-api";
import { AppError } from "../lib/erreurs.js";

/** N'autorise que les utilisateurs portant au moins l'un des rôles demandés. */
export function exigerRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const u = req.utilisateur;
    if (!u) {
      throw new AppError("NON_CONNECTE", "Connexion requise.", 401);
    }
    if (!roles.some((r) => u.roles.includes(r))) {
      throw new AppError("NON_CONNECTE", "Accès refusé.", 403);
    }
    next();
  };
}
