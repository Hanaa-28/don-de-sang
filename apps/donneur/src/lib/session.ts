/**
 * Session du donneur, gardée sur le téléphone.
 * Le jeton reste après fermeture de l'application : le donneur n'a pas
 * à se reconnecter à chaque alerte.
 */
const CLE_JETON = "dds:jeton";
const CLE_NOM = "dds:nom";
const CLE_VERIFICATION = "dds:verification";

export function lireJeton(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(CLE_JETON);
}

export function ouvrirSession(jeton: string, nomComplet: string) {
  window.localStorage.setItem(CLE_JETON, jeton);
  window.localStorage.setItem(CLE_NOM, nomComplet);
}

export function fermerSession() {
  window.localStorage.removeItem(CLE_JETON);
  window.localStorage.removeItem(CLE_NOM);
}

/**
 * Numéro en cours de vérification, transmis de D3 à D4 et de D6 à D7.
 * Gardé pour l'onglet seulement : il disparaît à la fermeture.
 */
export type VerificationEnCours = {
  telephone: string;
  objet: "inscription" | "mot_de_passe";
  renvoiPossibleLe: number; // horodatage en ms
  expireLe: number;
};

export function memoriserVerification(v: VerificationEnCours) {
  window.sessionStorage.setItem(CLE_VERIFICATION, JSON.stringify(v));
}

export function lireVerification(): VerificationEnCours | null {
  if (typeof window === "undefined") return null;
  const brut = window.sessionStorage.getItem(CLE_VERIFICATION);
  return brut ? (JSON.parse(brut) as VerificationEnCours) : null;
}

export function oublierVerification() {
  window.sessionStorage.removeItem(CLE_VERIFICATION);
}

/** Dernière demande de collecte envoyée depuis ce téléphone, pour pré-remplir le suivi. */
export const CLE_DERNIERE_DEMANDE = "dds:derniere-demande";
