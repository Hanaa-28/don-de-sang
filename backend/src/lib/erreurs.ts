import type { CodeErreur } from "@dds/contrat-api";

/**
 * Erreur applicative au format du contrat : { erreur: { code, message, champ? } }.
 * Le middleware `gestionErreurs` la transforme en réponse HTTP.
 */
export class AppError extends Error {
  constructor(
    public readonly code: CodeErreur,
    message: string,
    public readonly status: number = 400,
    public readonly champ?: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
