/**
 * Mise en forme des dates/heures au format du contrat d'API :
 *   - dates : « AAAA-MM-JJ »
 *   - dates-heures : ISO 8601 en UTC.
 *
 * Les colonnes `date` sont déjà rendues en « AAAA-MM-JJ » côté SQL
 * (to_char) ; ce module sert surtout aux calculs et aux horodatages.
 */

/** Ajoute un nombre de mois à une date « AAAA-MM-JJ » (fin de mois gérée). */
export function ajouterMois(date: string, mois: number): string {
  const [a, m, j] = date.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + mois, j));
  if (d.getUTCDate() !== j) {
    // 31 janvier + 1 mois → dernier jour de février.
    d.setUTCDate(0);
  }
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** « AAAA-MM-JJ » du jour, en UTC (pour comparer aux dates du donneur). */
export function aujourdHui(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate(),
  ).padStart(2, "0")}`;
}

/** Convertit un horodatage PostgreSQL (timestamptz) en ISO 8601 UTC. */
export function instantISO(valeur: Date | string): string {
  return valeur instanceof Date ? valeur.toISOString() : new Date(valeur).toISOString();
}
