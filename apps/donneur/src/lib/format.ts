/**
 * Mise en forme : une date ou un numéro s'écrit toujours de la même façon,
 * quel que soit l'écran. (Repris du prototype DJIGUI.)
 */

/** 12 novembre 2026 */
export function dateLongue(valeur: string | null | undefined): string {
  if (!valeur) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    .format(new Date(valeur));
}

/** 12 nov. */
export function dateCourte(valeur: string | null | undefined): string {
  if (!valeur) return "";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(valeur));
}

/** 12 novembre à 18h00 */
export function dateHeure(valeur: string | null | undefined): string {
  if (!valeur) return "";
  const d = new Date(valeur);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const jour = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" }).format(d);
  return `${jour} à ${h}h${m}`;
}

/** « il y a 3 heures », « hier », « le 12 novembre » */
export function depuis(valeur: string): string {
  const minutes = Math.floor((Date.now() - new Date(valeur).getTime()) / 60000);
  if (minutes < 1) return "à l’instant";
  if (minutes < 60) return `il y a ${pluriel(minutes, "minute")}`;
  const heures = Math.floor(minutes / 60);
  if (heures < 24) return `il y a ${pluriel(heures, "heure")}`;
  if (heures < 48) return "hier";
  return `le ${dateLongue(valeur)}`;
}

/** Nombre de jours pleins entre aujourd'hui et une date (négatif si passée). */
export function joursAvant(valeur: string): number {
  const cible = new Date(valeur);
  const aujourdHui = new Date();
  cible.setHours(0, 0, 0, 0);
  aujourdHui.setHours(0, 0, 0, 0);
  return Math.round((cible.getTime() - aujourdHui.getTime()) / 86400000);
}

/** 1 jour, 2 jours */
export function pluriel(nombre: number, singulier: string, plurielMot?: string): string {
  return `${nombre} ${nombre > 1 ? (plurielMot ?? `${singulier}s`) : singulier}`;
}

/** +22670000001 → 70 00 00 01 (lisible, facile à dicter) */
export function numeroLisible(numero: string): string {
  const chiffres = numero.replace(/\D/g, "").replace(/^226/, "");
  if (chiffres.length !== 8) return numero;
  return chiffres.replace(/(\d{2})(?=\d)/g, "$1 ");
}

/** Saisie libre → +226XXXXXXXX */
export function numeroInternational(saisie: string): string {
  return `+226${saisie.replace(/\D/g, "").replace(/^226/, "").slice(-8)}`;
}

/** Secondes → « 9 min 59 s » ou « 45 s » */
export function minuterie(secondes: number): string {
  const m = Math.floor(secondes / 60);
  const s = secondes % 60;
  return m > 0 ? `${m} min ${String(s).padStart(2, "0")} s` : `${s} s`;
}
