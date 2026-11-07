import { Router } from "express";
import { z } from "zod";
import type { Analyse, Poche, PreparerPocheRequete, Produit } from "@dds/contrat-api";
import { AppError } from "../lib/erreurs.js";
import { requete, transaction } from "../lib/db.js";
import { valider } from "../lib/validation.js";
import { inscrireEvenement } from "../lib/evenements.js";
import { genererCodePoche, genererCodeProduit, normaliserCode } from "../lib/codes-poches.js";
import { instantISO } from "../lib/format.js";
import { exigerRole } from "../middlewares/roles.js";

/**
 * P3 / P4 / P5 — poches, analyses et préparation.
 *   POST /poches                         créer une poche (collecte)
 *   GET  /poches?statut=a_analyser       file d'attente du laboratoire
 *   POST /poches/:code/analyse           enregistrer une analyse
 *   POST /poches/:code/preparation       créer les produits
 */
export const routePoches = Router();

// ---------------------------------------------------------------------
// POST /poches — créer une poche et générer son code (P3)
// ---------------------------------------------------------------------
const schemaPoche = z.object({
  passageId: z.string().uuid("Passage invalide."),
  volume: z.number().int().positive().nullable().optional(),
});

interface LignePoche {
  id: string;
  code: string;
  donneur_id: string;
  passage_id: string;
  site_id: string;
  date: string;
  volume: number | null;
  statut: string;
  cree_le: Date;
}

routePoches.post("/", exigerRole("agent_accueil", "agent_prelevement", "admin"), async (req, res) => {
  const agent = req.utilisateur!;
  const d = valider(schemaPoche, req.body);

  const { rows: pr } = await requete<{ id: string; donneur_id: string; site_id: string; resultat: string }>(
    "select id, donneur_id, site_id, resultat from passages where id = $1",
    [d.passageId],
  );
  const passage = pr[0];
  if (!passage) throw new AppError("INTROUVABLE", "Passage introuvable.", 404);
  if (passage.resultat !== "apte") throw new AppError("DONNEES_INVALIDES", "Seul un donneur apte reçoit une poche.", 400);

  const deja = await requete("select id from poches where passage_id = $1", [d.passageId]);
  if (deja.rowCount) throw new AppError("DONNEES_INVALIDES", "Une poche existe déjà pour ce passage.", 400);

  const { rows: sr } = await requete<{ code: string }>("select code from sites where id = $1", [passage.site_id]);
  const siteCode = sr[0]?.code ?? "XXX";

  const annee = new Date().getFullYear();

  const code = await transaction(async (client) => {
    const cpt = await client.query<{ n: number }>(
      `insert into compteurs_codes (site_id, annee, dernier_numero)
       values ($1, $2, 1)
       on conflict (site_id, annee) do update set dernier_numero = compteurs_codes.dernier_numero + 1
       returning dernier_numero as n`,
      [passage.site_id, annee],
    );
    return genererCodePoche(siteCode, annee, cpt.rows[0].n);
  });

  const id = await transaction(async (client) => {
    const ins = await client.query<{ id: string }>(
      `insert into poches (code, donneur_id, passage_id, site_id, date, volume, statut)
       values ($1, $2, $3, $4, current_date, $5, 'prelevee')
       returning id`,
      [code, passage.donneur_id, d.passageId, passage.site_id, d.volume ?? null],
    );
    return ins.rows[0].id;
  });

  await inscrireEvenement({
    type: "prelevement",
    donneurId: passage.donneur_id,
    agentId: agent.id,
    siteId: passage.site_id,
    pocheId: id,
    details: { code, volume: d.volume ?? null },
  });

  const { rows } = await requete<LignePoche>(
    `select id, code, donneur_id, passage_id, site_id, to_char(date, 'YYYY-MM-DD') as date, volume, statut, cree_le
     from poches where id = $1`,
    [id],
  );
  res.status(201).json({ donnees: formaterPoche(rows[0]) });
});

function formaterPoche(p: LignePoche): Poche {
  return {
    id: p.id,
    code: p.code,
    donneurId: p.donneur_id,
    passageId: p.passage_id,
    siteId: p.site_id,
    date: p.date,
    volume: p.volume,
    statut: p.statut as Poche["statut"],
    creeLe: instantISO(p.cree_le),
  };
}

// ---------------------------------------------------------------------
// GET /poches?statut=a_analyser — file d'attente du laboratoire (P4)
// ---------------------------------------------------------------------
routePoches.get("/", exigerRole("agent_labo", "admin"), async (req, res) => {
  const agent = req.utilisateur!;
  const statut = z.enum(["a_analyser", "conforme", "non_conforme", "preparee"]).optional().safeParse(req.query.statut);

  // Par défaut : les poches en attente d'analyse (statut « prelevee »).
  const statutBdd = !statut.success || !statut.data || statut.data === "a_analyser"
    ? "prelevee"
    : statut.data;

  const { rows } = await requete<LignePoche>(
    `select id, code, donneur_id, passage_id, site_id, to_char(date, 'YYYY-MM-DD') as date, volume, statut, cree_le
     from poches where site_id = $1 and statut = $2 order by cree_le`,
    [agent.siteId, statutBdd],
  );
  res.json({ donnees: rows.map(formaterPoche) });
});

// ---------------------------------------------------------------------
// POST /poches/:code/analyse — enregistrer l'analyse (P4)
// ---------------------------------------------------------------------
const schemaAnalyse = z.object({
  groupeSanguin: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
  resultat: z.enum(["conforme", "non_conforme"]),
});

routePoches.post("/:code/analyse", exigerRole("agent_labo", "admin"), async (req, res) => {
  const agent = req.utilisateur!;
  const d = valider(schemaAnalyse, req.body);
  const code = normaliserCode(req.params.code as string);
  const { rows: pr } = await requete<{ id: string; code: string; donneur_id: string; statut: string }>(
    "select id, code, donneur_id, statut from poches where upper(replace(code, '-', '')) = $1",
    [code],
  );
  const poche = pr[0];
  if (!poche) throw new AppError("INTROUVABLE", "Poche introuvable.", 404);
  if (poche.statut !== "prelevee") throw new AppError("DONNEES_INVALIDES", "Cette poche a déjà été analysée.", 400);

  const nouveauStatut = d.resultat === "conforme" ? "conforme" : "non_conforme";

  const analyseId = await transaction(async (client) => {
    const ins = await client.query<{ id: string }>(
      `insert into analyses (poche_id, groupe_sanguin, resultat, technicien_id, date)
       values ($1, $2, $3, $4, current_date)
       returning id`,
      [poche.id, d.groupeSanguin, d.resultat, agent.id],
    );
    await client.query("update poches set statut = $1 where id = $2", [nouveauStatut, poche.id]);
    // Le groupe sanguin remonte sur la carte du donneur.
    await client.query("update donneurs set groupe_sanguin = $1 where id = $2", [d.groupeSanguin, poche.donneur_id]);
    return ins.rows[0].id;
  });

  await inscrireEvenement({
    type: "analyse",
    donneurId: poche.donneur_id,
    agentId: agent.id,
    siteId: agent.siteId,
    pocheId: poche.id,
    details: { code: poche.code, groupeSanguin: d.groupeSanguin, resultat: d.resultat },
  });

  const analyse: Analyse = {
    id: analyseId,
    pocheId: poche.id,
    code: poche.code,
    groupeSanguin: d.groupeSanguin,
    resultat: d.resultat,
    date: new Date().toISOString().slice(0, 10),
  };
  res.status(201).json({ donnees: analyse });
});

// ---------------------------------------------------------------------
// POST /poches/:code/preparation — créer les produits (P5)
// ---------------------------------------------------------------------
const TYPES = ["GR", "PL", "PQ"] as const;
const schemaPreparation = z.object({
  produits: z.array(z.enum(TYPES)).min(1, "Choisissez au moins un produit."),
});

routePoches.post("/:code/preparation", exigerRole("agent_labo", "admin"), async (req, res) => {
  const agent = req.utilisateur!;
  const d: PreparerPocheRequete = valider(schemaPreparation, req.body);
  const code = normaliserCode(req.params.code as string);

  const { rows: pr } = await requete<{ id: string; code: string; donneur_id: string; statut: string; site_id: string }>(
    "select id, code, donneur_id, statut, site_id from poches where upper(replace(code, '-', '')) = $1",
    [code],
  );
  const poche = pr[0];
  if (!poche) throw new AppError("INTROUVABLE", "Poche introuvable.", 404);
  if (poche.statut !== "conforme") throw new AppError("DONNEES_INVALIDES", "Seule une poche conforme peut être préparée.", 400);

  const { rows: gr } = await requete<{ groupe_sanguin: string }>(
    "select groupe_sanguin from analyses where poche_id = $1",
    [poche.id],
  );
  const groupeSanguin = gr[0]?.groupe_sanguin ?? "O+";

  const produits: Produit[] = await transaction(async (client) => {
    const cree: Produit[] = [];
    for (const type of d.produits) {
      const { rows: tr } = await client.query<{ id: string; duree: number | null }>(
        "select id, duree_conservation_jours as duree from types_produits where code = $1",
        [type],
      );
      const typeId = tr[0]?.id;
      const datePeremption = tr[0]?.duree
        ? new Date(Date.now() + tr[0].duree * 86400000).toISOString().slice(0, 10)
        : null;
      const codeProduit = genererCodeProduit(poche.code, type);
      const ins = await client.query<{ id: string }>(
        `insert into produits (code, poche_id, type_produit_id, groupe_sanguin, date_peremption, statut, site_actuel_id)
         values ($1, $2, $3, $4, $5, 'disponible', $6)
         returning id`,
        [codeProduit, poche.id, typeId, groupeSanguin, datePeremption, poche.site_id],
      );
      cree.push({
        id: ins.rows[0].id,
        code: codeProduit,
        typeProduit: type,
        groupeSanguin: groupeSanguin as Produit["groupeSanguin"],
        datePeremption,
        statut: "disponible",
        creeLe: new Date().toISOString(),
      });
    }
    await client.query("update poches set statut = 'preparee' where id = $1", [poche.id]);
    return cree;
  });

  await inscrireEvenement({
    type: "preparation",
    donneurId: poche.donneur_id,
    agentId: agent.id,
    siteId: poche.site_id,
    pocheId: poche.id,
    details: { code: poche.code, produits: d.produits },
  });

  res.status(201).json({ donnees: produits });
});
