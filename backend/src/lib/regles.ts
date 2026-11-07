import { requete } from "./db.js";

/**
 * Lit une règle réglable (table `regles`, Annexe E) sous forme de nombre.
 * Retourne `defaut` si la règle est absente ou illisible.
 */
export async function lireRegle(cle: string, defaut: number): Promise<number> {
  const { rows } = await requete<{ valeur: string }>("select valeur from regles where cle = $1", [cle]);
  if (rows.length === 0) return defaut;
  const n = Number(rows[0].valeur);
  return Number.isFinite(n) ? n : defaut;
}
