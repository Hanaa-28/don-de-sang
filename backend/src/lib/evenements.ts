import { requete } from "./db.js";

/**
 * Inscrit une action dans le journal `evenements` (immuable). Rien n'est
 * jamais effacé : chaque action importante y laisse une trace (qui, quoi,
 * sur quel donneur, dans quel site, quand).
 */
export async function inscrireEvenement(opts: {
  type: string;
  donneurId?: string | null;
  agentId?: string | null;
  siteId?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  await requete(
    `insert into evenements (type, donneur_id, agent_id, site_id, details)
     values ($1, $2, $3, $4, $5::jsonb)`,
    [
      opts.type,
      opts.donneurId ?? null,
      opts.agentId ?? null,
      opts.siteId ?? null,
      JSON.stringify(opts.details ?? {}),
    ],
  );
}
