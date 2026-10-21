import { Router } from "express";

export const routeSante = Router();

// Vérifie que le serveur répond (utile pour l'hébergement et la CI).
routeSante.get("/", (_req, res) => {
  res.json({ donnees: { statut: "ok", date: new Date().toISOString() } });
});
