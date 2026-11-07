import { Router } from "express";
import { z } from "zod";
import type { Passage } from "@dds/contrat-api";
import { AppError } from "../lib/erreurs.js";
import { requete, transaction } from "../lib/db.js";
import { valider } from "../lib/validation.js";
import { inscrireEvenement } from "../lib/evenements.js";
import { lireRegle } from "../lib/regles.js";
import { ajouterMois, aujourdHui, instantISO } from "../lib/format.js";

/**
 * P3 — Accueil et prélèvement : enregistrer une venue (apte ou ajourné).
 * Monté sous /passages, accès agent d'accueil/prélèvement.
 */
export const routePassages = Router();

const schemaPassage = z.object({
  donneurId: z.string().uuid("Donneur invalide."),
  resultat: z.enum(["apte", "ajourne"]),
  ajourneJusquau: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format AAAA-MM-JJ.").nullable().optional(),
  alerteId: z.string().uuid("Alerte invalide.").nullable().optional(),
});

interface LignePassage {
  id: string;
  donneur_id: string;
  numero_donneur: string;
  site_id: string;
  date: string;
  resultat: "apte" | "ajourne";
  ajourne_jusquau: string | null;
  alerte_id: string | null;
  cree_le: Date;
}

routePassages.post("/", async (req, res) => {
  const agent = req.utilisateur!;
  const d = valider(schemaPassage, req.body);

  const { rows: dr } = await requete<{ id: string; sexe: string }>(
    "select id, sexe from donneurs where id = $1 and actif",
    [d.donneurId],
  );
  if (!dr[0]) throw new AppError("INTROUVABLE", "Donneur introuvable.", 404);

  if (d.resultat === "ajourne" && !d.ajourneJusquau) {
    throw new AppError("DONNEES_INVALIDES", "Indiquez jusqu'à quand le donneur est ajourné.", 400, "ajourneJusquau");
  }

  // Prochaine date d'éligibilité (cahier des charges, règle 3) :
  //   apte    → aujourd'hui + délai selon le sexe ;
  //   ajourné → la date de reprise demandée.
  let prochaineEligibilite: string;
  if (d.resultat === "ajourne") {
    prochaineEligibilite = d.ajourneJusquau!;
  } else {
    const delaiMois = await lireRegle(dr[0].sexe === "F" ? "delai_femme_mois" : "delai_homme_mois", dr[0].sexe === "F" ? 4 : 3);
    prochaineEligibilite = ajouterMois(aujourdHui(), delaiMois);
  }

  const id = await transaction(async (client) => {
    const ins = await client.query<{ id: string }>(
      `insert into passages (donneur_id, site_id, date, resultat, ajourne_jusquau, alerte_id, agent_id)
       values ($1, $2, current_date, $3, $4, $5, $6)
       returning id`,
      [d.donneurId, agent.siteId, d.resultat, d.resultat === "ajourne" ? d.ajourneJusquau : null, d.alerteId ?? null, agent.id],
    );
    await client.query("update donneurs set prochaine_eligibilite = $1 where id = $2", [prochaineEligibilite, d.donneurId]);
    return ins.rows[0].id;
  });

  await inscrireEvenement({
    type: "prelevement",
    donneurId: d.donneurId,
    agentId: agent.id,
    siteId: agent.siteId,
    details: { resultat: d.resultat },
  });

  const { rows } = await requete<LignePassage>(
    `select p.id, p.donneur_id, d.numero_donneur, p.site_id,
            to_char(p.date, 'YYYY-MM-DD') as date, p.resultat,
            to_char(p.ajourne_jusquau, 'YYYY-MM-DD') as ajourne_jusquau,
            p.alerte_id, p.cree_le
     from passages p join donneurs d on d.id = p.donneur_id
     where p.id = $1`,
    [id],
  );
  const p = rows[0];
  const passage: Passage = {
    id: p.id,
    donneurId: p.donneur_id,
    numeroDonneur: p.numero_donneur,
    siteId: p.site_id,
    date: p.date,
    resultat: p.resultat,
    ajourneJusquau: p.ajourne_jusquau,
    alerteId: p.alerte_id,
    creeLe: instantISO(p.cree_le),
  };
  res.status(201).json({ donnees: passage });
});
