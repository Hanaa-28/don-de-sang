import pg from "pg";
import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import { config } from "../config.js";

/**
 * Accès direct à PostgreSQL (Supabase), en SQL écrit à la main — sans ORM,
 * conformément à l'Annexe B du cahier des charges.
 */
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  max: 10,
});

/** Requête simple (pas de transaction). */
export function requete<R extends QueryResultRow = QueryResultRow>(
  texte: string,
  params: unknown[] = [],
): Promise<QueryResult<R>> {
  return pool.query<R>(texte, params);
}

/**
 * Exécute `fn` dans une transaction. Tout échec provoque un rollback,
 * sinon commit. Le client est toujours relâché dans le pool.
 */
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const resultat = await fn(client);
    await client.query("commit");
    return resultat;
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    client.release();
  }
}
