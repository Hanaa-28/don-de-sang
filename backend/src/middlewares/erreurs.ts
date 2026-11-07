import type { ErrorRequestHandler } from "express";
import { AppError } from "../lib/erreurs.js";

/**
 * Transforme toute erreur au format du contrat : { erreur: { code, message, champ? } }.
 * Une AppError est déjà maîtrisée ; le reste est journalisé sans rien fuir.
 */
export const gestionErreurs: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      erreur: {
        code: err.code,
        message: err.message,
        ...(err.champ ? { champ: err.champ } : {}),
      },
    });
    return;
  }
  console.error(err);
  res.status(500).json({ erreur: { code: "ERREUR_SERVEUR", message: "Erreur interne" } });
};
