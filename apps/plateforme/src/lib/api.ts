/**
 * Client d'API de la plateforme (espace agent).
 *
 * C'est le SEUL endroit où l'espace agent parle au backend : les écrans
 * appellent `api.xxx()` et ne savent pas d'où viennent les données.
 *
 * NEXT_PUBLIC_UTILISER_EXEMPLES=true  → simulateur (exemples JSON du contrat)
 * NEXT_PUBLIC_UTILISER_EXEMPLES=false → vrai backend
 *
 * À la différence de l'application des donneurs, les routes de l'espace
 * agent sont livrées une par une (P3 à P10, S5 à S7) : tant que le
 * tableau de bord n'a pas de route réelle, le simulateur reste la seule
 * option possible pour lui, même si la connexion, elle, est déjà en
 * place côté backend.
 *
 * Les routes et les types viennent de packages/contrat-api : si le
 * contrat change, TypeScript signale ici ce qu'il faut adapter.
 */
import type {
  AgentConnexionReponse, Reponse, ReponseErreur, TableauDeBordAgent,
} from "@dds/contrat-api";
import { ErreurApi } from "./erreurs";
import { fermerSession, lireJeton } from "./session";
import { simulateur } from "./simulateur";

export interface ApiPlateforme {
  connexion(email: string, motDePasse: string): Promise<AgentConnexionReponse>;
  tableauDeBord(): Promise<TableauDeBordAgent>;
}

export const UTILISER_EXEMPLES = process.env.NEXT_PUBLIC_UTILISER_EXEMPLES !== "false";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Methode = "GET" | "POST" | "PUT" | "PATCH";

async function appel<T>(methode: Methode, chemin: string, corps?: unknown): Promise<T> {
  const jeton = lireJeton();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${chemin}`, {
      method: methode,
      headers: {
        "Content-Type": "application/json",
        ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
      },
      body: corps === undefined ? undefined : JSON.stringify(corps),
    });
  } catch {
    throw new ErreurApi("Le service ne répond pas. Vérifiez qu’il est démarré, puis réessayez.", "RESEAU");
  }

  const contenu = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const erreur = (contenu as ReponseErreur | null)?.erreur;
    if (res.status === 401 && jeton) {
      fermerSession();
      window.location.assign("/");
    }
    throw new ErreurApi(
      erreur?.message ?? "Le service a rencontré un problème. Réessayez.",
      erreur?.code ?? "ERREUR_SERVEUR",
      erreur?.champ,
    );
  }
  return (contenu as Reponse<T> | null)?.donnees ?? (null as T);
}

const reseau: ApiPlateforme = {
  connexion: (email, motDePasse) => appel("POST", "/auth/agent/connexion", { email, motDePasse }),
  // Pas encore livrée par Zozerigué (P6, S6) : la route n'existe pas
  // encore côté backend. Un essai réel se solde par une 404, attendue
  // tant que NEXT_PUBLIC_UTILISER_EXEMPLES reste à true.
  tableauDeBord: () => appel("GET", "/agent/tableau-de-bord"),
};

export const api: ApiPlateforme = UTILISER_EXEMPLES ? simulateur : reseau;
