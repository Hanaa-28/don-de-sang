import { requete } from "./db.js";

/**
 * Inscrit une action dans le journal `evenements` (immuable). Rien n'est
 * jamais effacé : chaque action importante y laisse une trace (qui, quoi,
 * sur quelle poche ou quel produit, dans quel site, quand).
 */
export async function inscrireEvenement(opts: {
  type: string;
  donneurId?: string | null;
  agentId?: string | null;
  siteId?: string | null;
  pocheId?: string | null;
  produitId?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  await requete(
    `insert into evenements (type, poche_id, produit_id, donneur_id, agent_id, site_id, details)
     values ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
    [
      opts.type,
      opts.pocheId ?? null,
      opts.produitId ?? null,
      opts.donneurId ?? null,
      opts.agentId ?? null,
      opts.siteId ?? null,
      JSON.stringify(opts.details ?? {}),
    ],
  );
}
