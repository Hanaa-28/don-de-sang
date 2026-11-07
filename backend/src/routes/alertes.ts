import { Router } from "express";
import { z } from "zod";
import { AppError } from "../lib/erreurs.js";
import { requete } from "../lib/db.js";
import { valider } from "../lib/validation.js";
import { formaterAlerte, SELECT_ALERTE, type LigneAlerte } from "../lib/alertes.js";

/**
 * Réponse d'un donneur à une alerte (écrans D9 / D10), montée sous /alertes.
 * La réponse peut être changée tant que l'alerte est ouverte.
 */
export const routeAlertes = Router();

const schemaReponse = z.object({
  reponse: z.enum(["je_viens", "pas_disponible"]),
  motifRefus: z.enum(["don_recent", "absent", "sante", "autre"]).nullish(),
  venue: z
    .object({
      creneau: z.enum(["08h-10h", "10h-12h", "12h-14h", "14h-16h"]).nullish(),
      moyen: z.enum(["a_pied", "deux_roues", "transport_commun"]).nullish(),
    })
    .nullish(),
});

routeAlertes.post("/:id/reponse", async (req, res) => {
  const donneurId = req.utilisateur!.id;
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) throw new AppError("INTROUVABLE", "Cette alerte n'existe pas.", 404);
  const d = valider(schemaReponse, req.body);

  // L'alerte doit avoir été envoyée au donneur et être encore ouverte.
  const { rows } = await requete<{ statut: string; date_limite: Date }>(
    `select a.statut, a.date_limite
     from alertes a
     join alerte_envois e on e.alerte_id = a.id
     where e.donneur_id = $1 and a.id = $2`,
    [donneurId, id.data],
  );
  const alerte = rows[0];
  if (!alerte) throw new AppError("INTROUVABLE", "Cette alerte n'existe pas.", 404);
  if (alerte.statut !== "ouverte" || new Date(alerte.date_limite) <= new Date()) {
    throw new AppError("ALERTE_CLOTUREE", "Cette alerte est close : le centre n'attend plus de réponse.", 409);
  }

  const motifRefus = d.reponse === "pas_disponible" ? (d.motifRefus ?? "autre") : null;
  const momentPassage = d.reponse === "je_viens" ? (d.venue?.creneau ?? null) : null;
  const moyen = d.reponse === "je_viens" ? (d.venue?.moyen ?? null) : null;
  const besoinTransport = moyen === "transport_commun";

  await requete(
    `insert into alerte_reponses
       (alerte_id, donneur_id, reponse, moment_passage, besoin_transport, motif_refus, moyen_deplacement)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (alerte_id, donneur_id) do update
       set reponse = excluded.reponse,
           moment_passage = excluded.moment_passage,
           besoin_transport = excluded.besoin_transport,
           motif_refus = excluded.motif_refus,
           moyen_deplacement = excluded.moyen_deplacement,
           repondu_le = now()`,
    [id.data, donneurId, d.reponse, momentPassage, besoinTransport, motifRefus, moyen],
  );

  const { rows: maj } = await requete<LigneAlerte>(`${SELECT_ALERTE} and a.id = $2`, [donneurId, id.data]);
  res.json({ donnees: formaterAlerte(maj[0]) });
});
