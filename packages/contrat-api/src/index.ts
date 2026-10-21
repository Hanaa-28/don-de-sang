/**
 * Contrat d'API — Plateforme de don de sang.
 * Version provisoire : à compléter et figer avant le jalon J1 (dimanche 25 octobre 2026).
 */

// ---------- Enveloppe commune ----------
export type Reponse<T> = { donnees: T };
export type ReponseErreur = { erreur: { code: string; message: string } };

// ---------- Référentiels ----------
export type GroupeSanguin = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type Role =
  | "donneur" | "agent_accueil" | "agent_prelevement" | "agent_labo"
  | "agent_stock" | "agent_depot" | "admin";
export type StatutAlerte = "ouverte" | "cloturee";
export type ReponseAlerte = "je_viens" | "pas_disponible";

// ---------- Authentification ----------
export interface ConnexionRequete { telephone: string; motDePasse: string }
export interface ConnexionReponse {
  jeton: string;
  utilisateur: { id: string; role: Role; nomComplet: string };
}

export interface InscriptionDonneurRequete {
  nom: string;
  prenom: string;
  telephone: string;
  motDePasse: string;
  dateNaissance: string; // AAAA-MM-JJ
  sexe: "F" | "M";
  groupeSanguin?: GroupeSanguin;
  zone: string;
}

// ---------- Donneur ----------
export interface ProfilDonneur {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  groupeSanguin: GroupeSanguin | null;
  zone: string;
  enPause: boolean;
  finPause: string | null;
}

export interface CarteDonneur {
  numeroDonneur: string;
  nomComplet: string;
  groupeSanguin: GroupeSanguin | null;
  nombreDons: number;
  dernierDon: string | null;
  prochainDonPossible: string | null;
  eligible: boolean;
}

export interface Alerte {
  id: string;
  groupeSanguin: GroupeSanguin;
  centre: { id: string; nom: string; adresse: string };
  message: string;
  statut: StatutAlerte;
  creeLe: string;
  maReponse: ReponseAlerte | null;
}

export interface DonHistorique {
  id: string;
  date: string;
  centre: string;
  resultat: "apte" | "ajourne";
}

export interface Centre {
  id: string;
  nom: string;
  adresse: string;
  telephone: string;
  horaires: string;
}

export interface Notification {
  id: string;
  titre: string;
  message: string;
  lue: boolean;
  creeLe: string;
}
