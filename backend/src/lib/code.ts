import { randomBytes, randomInt } from "node:crypto";

/** Code de vérification à 6 chiffres (0 à 999999, toujours sur 6 positions). */
export function genererCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

// Alphabet sans les caractères faciles à confondre (0/O, 1/I/l), comme pour
// les codes de poche (cahier des charges, Partie II).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

/**
 * Mot de passe temporaire lisible, remis au donneur par un agent lors d'une
 * réinitialisation. Le donneur devra le changer à la connexion suivante.
 */
export function genererMotDePasseTemporaire(longueur = 10): string {
  const octets = randomBytes(longueur);
  let resultat = "";
  for (let i = 0; i < longueur; i++) {
    resultat += ALPHABET[octets[i] % ALPHABET.length];
  }
  return resultat;
}
