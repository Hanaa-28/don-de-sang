import { z } from "zod";
import { AppError } from "./erreurs.js";

/**
 * Valide un corps de requête avec zod et lève une AppError DONNEES_INVALIDES
 * au format du contrat (avec le champ en cause) en cas d'échec.
 */
export function valider<T>(schema: z.ZodType<T>, donnees: unknown): T {
  const r = schema.safeParse(donnees);
  if (!r.success) {
    const premier = r.error.issues[0];
    throw new AppError(
      "DONNEES_INVALIDES",
      premier.message,
      400,
      premier.path.join(".") || undefined,
    );
  }
  return r.data;
}
