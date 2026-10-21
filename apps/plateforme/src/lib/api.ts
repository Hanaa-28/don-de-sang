/** Client d'API de la plateforme (espace agent + espace administrateur). */
import type { Reponse, ConnexionRequete, ConnexionReponse } from "@dds/contrat-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function appel<T>(chemin: string, options: RequestInit = {}): Promise<T> {
  const jeton = typeof window !== "undefined" ? localStorage.getItem("jeton") : null;
  const res = await fetch(`${API_URL}${chemin}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
      ...options.headers,
    },
  });
  const corps = await res.json();
  if (!res.ok) throw new Error(corps?.erreur?.message ?? "Erreur réseau");
  return (corps as Reponse<T>).donnees;
}

export const api = {
  connexion: (r: ConnexionRequete) =>
    appel<ConnexionReponse>("/auth/connexion", { method: "POST", body: JSON.stringify(r) }),
};
