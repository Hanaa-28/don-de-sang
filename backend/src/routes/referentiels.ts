import { Router } from "express";
import type { Centre, Zone } from "@dds/contrat-api";
import { requete } from "../lib/db.js";

/**
 * Routes publiques de référentiel : les zones (inscription) et les centres
 * de collecte (liste affichée aux donneurs, écran D12).
 */
export const routeReferentiels = Router();

// GET /zones — liste des zones proposées à l'inscription.
routeReferentiels.get("/zones", async (_req, res) => {
  const { rows } = await requete<Zone>(
    "select id, nom, ville from zones order by ville, nom",
  );
  res.json({ donnees: rows });
});

// GET /centres — les centres de collecte actifs (les dépôts et hôpitaux ne
// recueillent pas de dons : ils n'apparaissent pas ici).
routeReferentiels.get("/centres", async (_req, res) => {
  const { rows } = await requete<{
    id: string;
    nom: string;
    type: string;
    adresse: string;
    ville: string;
    telephone: string;
    horaires: string;
  }>(
    `select s.id, s.nom, s.type, s.adresse,
            coalesce(z.ville, '') as ville, s.telephone, s.horaires
     from sites s
     left join zones z on z.id = s.zone_id
     where s.actif and s.type = 'centre'
     order by s.nom`,
  );

  const centres: Centre[] = rows.map((s) => ({
    id: s.id,
    nom: s.nom,
    // Annexe B classe les sites en centre/dépôt/hôpital ; côté donneur, un
    // « centre » de collecte est présenté comme « cnts ».
    type: s.type === "centre" ? "cnts" : "site_collecte",
    adresse: s.adresse,
    ville: s.ville,
    telephone: s.telephone,
    horaires: s.horaires,
  }));

  res.json({ donnees: centres });
});
