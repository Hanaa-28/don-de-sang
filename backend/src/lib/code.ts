import { randomInt } from "node:crypto";

/** Code de vérification à 6 chiffres (0 à 999999, toujours sur 6 positions). */
export function genererCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}
