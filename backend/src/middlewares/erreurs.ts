import type { ErrorRequestHandler } from "express";

// Toutes les erreurs ressortent au format du contrat : { erreur: { code, message } }
export const gestionErreurs: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);
  res.status(err.status ?? 500).json({
    erreur: { code: err.code ?? "ERREUR_SERVEUR", message: err.message ?? "Erreur interne" },
  });
};
