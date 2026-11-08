import { Router } from "express";
import type { FicheTracabilite } from "@dds/contrat-api";
import { AppError } from "../lib/erreurs.js";
import { requete } from "../lib/db.js";
import { normaliserCode } from "../lib/codes-poches.js";
import { instantISO } from "../lib/format.js";

/**
 * P9 — Fiche de traçabilité : GET /codes/:code.
 * Le code (poche ou produit) est normalisé : « oua2604812k » est accepté.
 * Accès : tout agent connecté.
 */
export const routeCodes = Router();

routeCodes.get("/:code", async (req, res) => {
  const code = normaliserCode(req.params.code);

  // 1. Est-ce une poche ?
  const { rows: poches } = await requete<{
    id: string; code: string; statut: string; date: Date; site: string;
    numero_donneur: string | null; groupe_sanguin: string | null;
  }>(
    `select p.id, p.code, p.statut, p.date, s.nom as site,
            d.numero_donneur, a.groupe_sanguin
     from poches p
     left join sites s on s.id = p.site_id
     left join donneurs d on d.id = p.donneur_id
     left join analyses a on a.poche_id = p.id
     where upper(replace(p.code, '-', '')) = $1`,
    [code],
  );

  if (poches[0]) {
    const fiche = await construireFiche({
      type: "poche", code: poches[0].code, statut: poches[0].statut,
      date: poches[0].date, site: poches[0].site,
      numeroDonneur: poches[0].numero_donneur, groupeSanguin: poches[0].groupe_sanguin,
      pocheId: poches[0].id, produitId: null,
    });
    res.json({ donnees: fiche });
    return;
  }

  // 2. Est-ce un produit ?
  const { rows: produits } = await requete<{
    id: string; code: string; statut: string; date_peremption: Date | null; site: string;
    numero_donneur: string | null; groupe_sanguin: string; poche_id: string;
  }>(
    `select pr.id, pr.code, pr.statut, pr.date_peremption, s.nom as site,
            d.numero_donneur, pr.groupe_sanguin, pr.poche_id
     from produits pr
     left join sites s on s.id = pr.site_actuel_id
     left join poches p on p.id = pr.poche_id
     left join donneurs d on d.id = p.donneur_id
     where upper(replace(pr.code, '-', '')) = $1`,
    [code],
  );

  if (produits[0]) {
    const fiche = await construireFiche({
      type: "produit", code: produits[0].code, statut: produits[0].statut,
      date: produits[0].date_peremption ?? new Date(), site: produits[0].site,
      numeroDonneur: produits[0].numero_donneur, groupeSanguin: produits[0].groupe_sanguin,
      pocheId: produits[0].poche_id, produitId: produits[0].id,
    });
    res.json({ donnees: fiche });
    return;
  }

  throw new AppError("INTROUVABLE", "Code inconnu. Vérifiez la saisie.", 404);
});

interface Base {
  type: "poche" | "produit";
  code: string;
  statut: string;
  date: Date;
  site: string;
  numeroDonneur: string | null;
  groupeSanguin: string | null;
  pocheId: string;
  produitId: string | null;
}

async function construireFiche(b: Base): Promise<FicheTracabilite> {
  const { rows } = await requete<{ type: string; date: Date; site: string | null; agent: string | null }>(
    `select e.type, e.date, s.nom as site, u.prenom || ' ' || u.nom as agent
     from evenements e
     left join sites s on s.id = e.site_id
     left join utilisateurs u on u.id = e.agent_id
     where (e.poche_id = $1 or e.produit_id = $2)
     order by e.date`,
    [b.pocheId, b.produitId],
  );

  return {
    code: b.code,
    type: b.type,
    statut: b.statut,
    groupeSanguin: b.groupeSanguin as FicheTracabilite["groupeSanguin"],
    donneur: b.numeroDonneur ? { numeroDonneur: b.numeroDonneur } : null,
    site: b.site,
    date: b.date instanceof Date ? b.date.toISOString().slice(0, 10) : new Date(b.date).toISOString().slice(0, 10),
    evenements: rows.map((e) => ({
      type: e.type,
      date: instantISO(e.date),
      site: e.site,
      agent: e.agent,
    })),
  };
}
