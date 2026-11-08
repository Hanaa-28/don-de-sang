import bcrypt from "bcryptjs";

/** Hache un mot de passe (ou un code) en bcrypt. Jamais stocké en clair. */
export function hacher(clair: string): Promise<string> {
  return bcrypt.hash(clair, 10);
}

/** Compare un texte en clair à un hash bcrypt. */
export function verifier(clair: string, hash: string): Promise<boolean> {
  return bcrypt.compare(clair, hash);
}
