import { Router } from "express";
import type { LigneStock, Produit } from "@dds/contrat-api";
import { AppError } from "../lib/erreurs.js";
import { requete } from "../lib/db.js";
import { inscrireEvenement } from "../lib/evenements.js";
import { normaliserCode } from "../lib/codes-poches.js";

/**
 * P6 — Stock et produits. Le stock est calculé à partir des produits
 * disponibles, jamais saisi à la main. Accès : gestionnaire de stock / dépôt.
 */

// GET /stock — stock par type et groupe, avec niveau (seuils).
export const routeStock = Router();
routeStock.get("/", async (req, res) => {
  const agent = req.utilisateur!;

  const { rows } = await requete<{ type_produit: string; groupe_sanguin: string; quantite: number }>(
    `select t.code as type_produit, p.groupe_sanguin, count(*)::int as quantite
     from produits p
     join types_produits t on t.id = p.type_produit_id
     where p.site_actuel_id = $1 and p.statut in ('disponible', 'reserve')
     group by t.code, p.groupe_sanguin
     order by t.code, p.groupe_sanguin`,
    [agent.siteId],
  );

  const lignes: LigneStock[] = [];
  for (const l of rows) {
    const { rows: sr } = await requete<{ seuil_bas: number; seuil_critique: number }>(
      `select seuil_bas, seuil_critique from seuils_stock
       where site_id = $1 and type_produit_id = (select id from types_produits where code = $2) and groupe_sanguin = $3`,
      [agent.siteId, l.type_produit, l.groupe_sanguin],
    );
    let niveau: LigneStock["niveau"] = "suffisant";
    if (sr[0]) {
      if (l.quantite <= sr[0].seuil_critique) niveau = "critique";
      else if (l.quantite <= sr[0].seuil_bas) niveau = "bas";
    }
    lignes.push({
      typeProduit: l.type_produit as LigneStock["typeProduit"],
      groupeSanguin: l.groupe_sanguin as LigneStock["groupeSanguin"],
      quantite: l.quantite,
      niveau,
    });
  }

  res.json({ donnees: lignes });
});

// GET /produits?peremption=proche et POST /produits/:code/destruction
export const routeProduits = Router();

routeProduits.get("/", async (req, res) => {
  const agent = req.utilisateur!;
  const proche = req.query.peremption === "proche";

  const { rows } = await requete<{ id: string; code: string; type_produit: string; groupe_sanguin: string; date_peremption: string | null }>(
    `select pr.id, pr.code, t.code as type_produit, pr.groupe_sanguin, to_char(pr.date_peremption, 'YYYY-MM-DD') as date_peremption
     from produits pr
     join types_produits t on t.id = pr.type_produit_id
     where pr.site_actuel_id = $1 and pr.statut in ('disponible', 'reserve')
       ${proche ? "and pr.date_peremption is not null and pr.date_peremption <= current_date + interval '14 days'" : ""}
     order by pr.date_peremption nulls last`,
    [agent.siteId],
  );

  const produits: Produit[] = rows.map((r) => ({
    id: r.id,
    code: r.code,
    typeProduit: r.type_produit as Produit["typeProduit"],
    groupeSanguin: r.groupe_sanguin as Produit["groupeSanguin"],
    datePeremption: r.date_peremption,
    statut: "disponible",
    creeLe: "",
  }));
  res.json({ donnees: produits });
});

routeProduits.post("/:code/destruction", async (req, res) => {
  const agent = req.utilisateur!;
  const code = normaliserCode(req.params.code as string);

  const { rows } = await requete<{ id: string; code: string; statut: string; poche_id: string }>(
    "select id, code, statut, poche_id from produits where upper(replace(code, '-', '')) = $1",
    [code],
  );
  const produit = rows[0];
  if (!produit) throw new AppError("INTROUVABLE", "Produit introuvable.", 404);
  if (produit.statut === "delivre" || produit.statut === "detruit") {
    throw new AppError("DONNEES_INVALIDES", "Ce produit n'est plus disponible.", 400);
  }

  await requete("update produits set statut = 'detruit' where id = $1", [produit.id]);
  await inscrireEvenement({
    type: "destruction",
    produitId: produit.id,
    pocheId: produit.poche_id,
    agentId: agent.id,
    siteId: agent.siteId,
    details: { code: produit.code },
  });

  res.json({ donnees: null });
});
