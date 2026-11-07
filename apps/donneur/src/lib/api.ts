/**
 * Client d'API de l'application des donneurs.
 *
 * C'est le SEUL endroit où l'application parle au backend : les écrans appellent
 * `api.xxx()` et ne savent pas d'où viennent les données.
 *
 * NEXT_PUBLIC_UTILISER_EXEMPLES=true  → simulateur (exemples JSON du contrat), semaines 3-4
 * NEXT_PUBLIC_UTILISER_EXEMPLES=false → vrai backend, à partir de la semaine 5
 *
 * Les routes et les types viennent de packages/contrat-api : si le contrat change,
 * TypeScript signale ici ce qu'il faut adapter.
 */
import type {
  Alerte, CarteDonneur, Centre, ChangerMotDePasseRequete, CodeEnvoye, ConnexionReponse,
  DonHistorique, InscriptionDonneurRequete, MarquerLuesRequete, MiseEnPauseRequete,
  ModifierProfilRequete, NouveauMotDePasseRequete, Notification, ProfilDonneur,
  RepondreAlerteRequete, Reponse, ReponseErreur, RenvoiCodeRequete, Zone,
  DemandeCampagne, DemandeCampagneRequete, SuiviDemandeCampagneRequete,
} from "@dds/contrat-api";
import { ErreurApi } from "./erreurs";
import { fermerSession, lireJeton } from "./session";
import { simulateur } from "./simulateur";

export interface ApiDonneur {
  // Public
  zones(): Promise<Zone[]>;
  inscription(corps: InscriptionDonneurRequete): Promise<CodeEnvoye>;
  verification(telephone: string, code: string): Promise<ConnexionReponse>;
  renvoyerCode(corps: RenvoiCodeRequete): Promise<CodeEnvoye>;
  connexion(telephone: string, motDePasse: string): Promise<ConnexionReponse>;
  motDePasseOublie(telephone: string): Promise<CodeEnvoye>;
  nouveauMotDePasse(corps: NouveauMotDePasseRequete): Promise<null>;
  // Donneur connecté
  profil(): Promise<ProfilDonneur>;
  modifierProfil(corps: ModifierProfilRequete): Promise<ProfilDonneur>;
  mettreEnPause(corps: MiseEnPauseRequete): Promise<ProfilDonneur>;
  changerMotDePasse(corps: ChangerMotDePasseRequete): Promise<null>;
  carte(): Promise<CarteDonneur>;
  alertes(): Promise<Alerte[]>;
  alerte(id: string): Promise<Alerte>;
  repondreAlerte(id: string, corps: RepondreAlerteRequete): Promise<Alerte>;
  historique(): Promise<DonHistorique[]>;
  centres(): Promise<Centre[]>;
  notifications(): Promise<Notification[]>;
  marquerLues(corps: MarquerLuesRequete): Promise<null>;
  // Campagnes de collecte (public, sans compte)
  deposerDemandeCampagne(corps: DemandeCampagneRequete): Promise<DemandeCampagne>;
  suivreDemandeCampagne(corps: SuiviDemandeCampagneRequete): Promise<DemandeCampagne>;
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
    throw new ErreurApi("Pas de connexion. Vérifiez votre réseau, puis réessayez.", "RESEAU");
  }

  const contenu = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    const erreur = (contenu as ReponseErreur | null)?.erreur;
    if (res.status === 401 && jeton) {
      // Jeton expiré ou révoqué : retour à la connexion.
      fermerSession();
      window.location.assign("/connexion");
    }
    throw new ErreurApi(
      erreur?.message ?? "Le service ne répond pas correctement. Réessayez dans un instant.",
      erreur?.code ?? "ERREUR_SERVEUR",
      erreur?.champ,
    );
  }
  return (contenu as Reponse<T> | null)?.donnees ?? (null as T);
}

const reseau: ApiDonneur = {
  zones: () => appel("GET", "/zones"),
  inscription: (corps) => appel("POST", "/auth/inscription", corps),
  verification: (telephone, code) => appel("POST", "/auth/verification", { telephone, code }),
  renvoyerCode: (corps) => appel("POST", "/auth/code/renvoi", corps),
  connexion: (telephone, motDePasse) => appel("POST", "/auth/connexion", { telephone, motDePasse }),
  motDePasseOublie: (telephone) => appel("POST", "/auth/mot-de-passe-oublie", { telephone }),
  nouveauMotDePasse: (corps) => appel("POST", "/auth/nouveau-mot-de-passe", corps),

  profil: () => appel("GET", "/donneurs/moi"),
  modifierProfil: (corps) => appel("PATCH", "/donneurs/moi", corps),
  mettreEnPause: (corps) => appel("PUT", "/donneurs/moi/pause", corps),
  changerMotDePasse: (corps) => appel("PUT", "/donneurs/moi/mot-de-passe", corps),
  carte: () => appel("GET", "/donneurs/moi/carte"),
  alertes: () => appel("GET", "/donneurs/moi/alertes"),
  alerte: (id) => appel("GET", `/donneurs/moi/alertes/${encodeURIComponent(id)}`),
  repondreAlerte: (id, corps) => appel("POST", `/alertes/${encodeURIComponent(id)}/reponse`, corps),
  historique: () => appel("GET", "/donneurs/moi/historique"),
  centres: () => appel("GET", "/centres"),
  notifications: () => appel("GET", "/donneurs/moi/notifications"),
  marquerLues: (corps) => appel("POST", "/donneurs/moi/notifications/lues", corps),

  deposerDemandeCampagne: (corps) => appel("POST", "/campagnes/demandes", corps),
  suivreDemandeCampagne: (corps) => appel("POST", "/campagnes/demandes/suivi", corps),
};

export const api: ApiDonneur = UTILISER_EXEMPLES ? simulateur : reseau;
