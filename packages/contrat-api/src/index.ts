/**
 * Contrat d'API — Plateforme de don de sang.
 *
 * Source de vérité entre le backend et les deux interfaces.
 * Version 0.2 : toutes les routes de l'application des donneurs (écrans D1 à D14).
 * À valider par Zozerigué (backend) et Solange avant d'être figé (jalon J1).
 *
 * Conventions :
 *  - Succès : { "donnees": ... }   Échec : { "erreur": { "code", "message", "champ"? } }
 *  - Dates : "AAAA-MM-JJ" ; dates-heures : ISO 8601 en UTC.
 *  - Téléphone : format international "+226XXXXXXXX".
 *  - Routes protégées : en-tête "Authorization: Bearer <jeton>".
 */

// =====================================================================
// Enveloppe commune
// =====================================================================
export type Reponse<T> = { donnees: T };
export type ReponseErreur = {
  erreur: {
    code: CodeErreur;
    message: string;
    /** Nom du champ de la requête en cause, pour l'afficher sous le bon champ. */
    champ?: string;
  };
};

export type CodeErreur =
  | "IDENTIFIANTS_INVALIDES"
  | "TELEPHONE_DEJA_INSCRIT"
  | "TELEPHONE_NON_VERIFIE"
  | "CODE_INCORRECT"
  | "CODE_EXPIRE"
  | "TROP_DE_TENTATIVES"
  | "ALERTE_CLOTUREE"
  | "MOT_DE_PASSE_INCORRECT"
  | "DONNEES_INVALIDES"
  | "NON_CONNECTE"
  | "INTROUVABLE"
  | "ERREUR_SERVEUR";

// =====================================================================
// Référentiels
// =====================================================================
export type GroupeSanguin = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type Sexe = "F" | "M";
export type Role =
  | "donneur" | "agent_accueil" | "agent_prelevement" | "agent_labo"
  | "agent_stock" | "agent_depot" | "admin";

/** Moyens par lesquels le donneur accepte d'être prévenu. */
export type Canal = "whatsapp" | "sms" | "appel";

export type StatutAlerte = "ouverte" | "cloturee";
export type ReponseAlerte = "je_viens" | "pas_disponible";
export type MotifRefus = "don_recent" | "absent" | "sante" | "autre";
export type Creneau = "08h-10h" | "10h-12h" | "12h-14h" | "14h-16h";
export type MoyenDeplacement = "a_pied" | "deux_roues" | "transport_commun";

/** GET /zones (public) — liste des zones proposées à l'inscription. */
export interface Zone {
  id: string;
  nom: string;   // quartier ou secteur
  ville: string;
}

// =====================================================================
// Authentification (D3 à D7)
// =====================================================================

/** POST /auth/connexion — D5 */
export interface ConnexionRequete { telephone: string; motDePasse: string }
export interface ConnexionReponse {
  jeton: string;
  utilisateur: { id: string; role: Role; nomComplet: string };
}

/**
 * POST /auth/inscription — D3
 * Le compte est créé « non vérifié » ; un code part par WhatsApp.
 * Réponse : CodeEnvoye.
 */
export interface InscriptionDonneurRequete {
  nom: string;
  prenom: string;
  sexe: Sexe;
  dateNaissance: string;               // AAAA-MM-JJ, 18 ans révolus
  telephone: string;                   // +226XXXXXXXX
  motDePasse: string;                  // 8 caractères au moins
  groupeSanguin: GroupeSanguin | null; // null = « je ne sais pas »
  zoneId: string;
  canaux: Canal[];                     // au moins un
  consentement: true;
}

/** Réponse commune aux routes qui envoient un code par WhatsApp. */
export interface CodeEnvoye {
  telephone: string;
  canal: "whatsapp";
  /** Durée de validité du code, en secondes. */
  expireDans: number;
  /** Délai avant de pouvoir redemander un code, en secondes. */
  renvoiPossibleDans: number;
}

/** POST /auth/verification — D4. Réponse : ConnexionReponse (le donneur est connecté). */
export interface VerificationRequete { telephone: string; code: string }

/** POST /auth/code/renvoi — D4 et D7. Réponse : CodeEnvoye. */
export interface RenvoiCodeRequete { telephone: string; objet: "inscription" | "mot_de_passe" }

/**
 * POST /auth/mot-de-passe-oublie — D6. Réponse : CodeEnvoye.
 * Répond de la même façon que le numéro soit inscrit ou non (on ne révèle pas qui est inscrit).
 */
export interface MotDePasseOublieRequete { telephone: string }

/** POST /auth/nouveau-mot-de-passe — D7. Réponse : null. Ferme toutes les sessions ouvertes. */
export interface NouveauMotDePasseRequete { telephone: string; code: string; motDePasse: string }

// =====================================================================
// Donneur connecté
// =====================================================================

/** GET /donneurs/moi — D13 */
export interface ProfilDonneur {
  id: string;
  numeroDonneur: string;
  nom: string;
  prenom: string;
  sexe: Sexe;
  dateNaissance: string;
  telephone: string;
  groupeSanguin: GroupeSanguin | null;
  zone: Zone;
  canaux: Canal[];
  enPause: boolean;
  /** Date de reprise automatique ; null si pas de pause ou pause sans fin. */
  finPause: string | null;
  creeLe: string;
}

/** PATCH /donneurs/moi — D13. Réponse : ProfilDonneur. */
export interface ModifierProfilRequete { zoneId?: string; canaux?: Canal[] }

/**
 * PUT /donneurs/moi/pause — D13. Réponse : ProfilDonneur.
 * enPause=false pour reprendre. Pendant une pause, le donneur ne reçoit aucune alerte.
 */
export interface MiseEnPauseRequete { enPause: boolean; finPause: string | null }

/** PUT /donneurs/moi/mot-de-passe — D13. Réponse : null. */
export interface ChangerMotDePasseRequete { ancienMotDePasse: string; nouveauMotDePasse: string }

/** GET /donneurs/moi/carte — D8. Calculée par le backend avec les valeurs de l'Annexe E. */
export interface CarteDonneur {
  numeroDonneur: string;
  nomComplet: string;
  groupeSanguin: GroupeSanguin | null;
  zone: string;
  nombreDons: number;
  dernierDon: string | null;
  prochainDonPossible: string | null;
  eligible: boolean;
  /** Délai appliqué entre deux dons, en mois (Annexe E). */
  delaiMois: number;
  enPause: boolean;
}

/** Résumé d'un centre, inclus dans une alerte. */
export interface CentreResume {
  id: string;
  nom: string;
  adresse: string;
  telephone: string;
  horaires: string;
}

export interface Venue { creneau: Creneau | null; moyen: MoyenDeplacement | null }

/** GET /donneurs/moi/alertes (D9) et GET /donneurs/moi/alertes/:id (D10). */
export interface Alerte {
  id: string;
  groupeSanguin: GroupeSanguin;
  centre: CentreResume;
  message: string;
  statut: StatutAlerte;
  creeLe: string;
  /** Après cette date-heure, le centre n'attend plus de réponse. */
  dateLimite: string;
  maReponse: ReponseAlerte | null;
  motifRefus: MotifRefus | null;
  venue: Venue | null;
}

/**
 * POST /alertes/:id/reponse — D9, D10. Réponse : Alerte mise à jour.
 * La réponse peut être changée tant que l'alerte est ouverte.
 */
export interface RepondreAlerteRequete {
  reponse: ReponseAlerte;
  motifRefus?: MotifRefus | null;
  venue?: Venue | null;
}

/**
 * GET /donneurs/moi/historique — D11.
 * Règle CNTS : le motif d'un ajournement n'est jamais transmis à l'application.
 */
export interface DonHistorique {
  id: string;
  date: string;
  centre: string;
  resultat: "apte" | "ajourne";
}

/** GET /centres — D12 */
export interface Centre {
  id: string;
  nom: string;
  type: "cnts" | "site_collecte";
  adresse: string;
  ville: string;
  telephone: string;
  horaires: string;
}

/** GET /donneurs/moi/notifications — D14 */
export interface Notification {
  id: string;
  type: "alerte" | "eligibilite" | "compte" | "info";
  titre: string;
  message: string;
  lue: boolean;
  creeLe: string;
  /** Écran à ouvrir au toucher, ex. "/alertes/a_014" ; null si aucun. */
  lien: string | null;
}

/** POST /donneurs/moi/notifications/lues — D14. ids absent = toutes. Réponse : null. */
export interface MarquerLuesRequete { ids?: string[] }

// =====================================================================
// Campagnes de collecte proposées par des structures (pages publiques)
// Repris de la page « Demandes » du prototype CNTS-Registering.
// À valider en point d'équipe : fonctionnalité ajoutée après le calendrier initial.
// =====================================================================

export type TypeStructure =
  | "jeunes_quartier" | "etablissement_scolaire" | "etablissement_superieur"
  | "association" | "entreprise" | "communaute_religieuse" | "autre";

export type MomentCollecte = "matin" | "apres_midi" | "journee";

/** Ce que la structure peut mettre à disposition le jour de la collecte. */
export type Equipement = "salle_ou_abri" | "tables_chaises" | "electricite" | "eau" | "collation";

/** en_attente → acceptee (devient une séance de collecte) ou refusee. */
export type StatutDemandeCampagne = "en_attente" | "acceptee" | "refusee";

/**
 * POST /campagnes/demandes (public, sans compte) — réponse : DemandeCampagne.
 * Le backend limite le nombre de demandes par numéro (TROP_DE_TENTATIVES).
 */
export interface DemandeCampagneRequete {
  structure: string;
  typeStructure: TypeStructure;
  responsable: string;
  telephone: string;              // +226XXXXXXXX, le CNTS rappelle ce numéro
  zoneId: string;
  lieu: string;                   // lieu précis : cour de l'école, salle, terrain…
  dateSouhaitee: string;          // AAAA-MM-JJ, au moins 14 jours après la demande
  moment: MomentCollecte;
  participantsAttendus: number;   // estimation du nombre de donneurs
  equipements: Equipement[];
  precisions: string;             // peut être vide
}

/** Réponse du CNTS, présente quand la demande a été traitée. */
export interface ReponseCnts {
  message: string;
  dateRetenue: string | null;     // AAAA-MM-JJ, si acceptée
  heureDebut: string | null;      // "08:00", si acceptée
  objectifPoches: number | null;  // si acceptée
  contact: string;                // nom et numéro de l'agent qui suit la collecte
}

export interface DemandeCampagne {
  id: string;
  reference: string;              // ex. CAMP-2026-0007, à garder pour le suivi
  structure: string;
  typeStructure: TypeStructure;
  responsable: string;
  telephone: string;
  zone: Zone;
  lieu: string;
  dateSouhaitee: string;
  moment: MomentCollecte;
  participantsAttendus: number;
  equipements: Equipement[];
  precisions: string;
  statut: StatutDemandeCampagne;
  creeLe: string;
  reponseCnts: ReponseCnts | null;
}

/**
 * POST /campagnes/demandes/suivi (public) — réponse : DemandeCampagne.
 * Référence ET numéro exigés ; même erreur INTROUVABLE si l'un des deux est faux.
 * En POST pour ne pas faire passer le numéro de téléphone dans l'adresse.
 */
export interface SuiviDemandeCampagneRequete { reference: string; telephone: string }

/**
 * Côté CNTS (espace agent, Solange / Zozerigué) :
 *   GET   /gestion/campagnes/demandes          → DemandeCampagne[]
 *   PATCH /gestion/campagnes/demandes/:id      → DemandeCampagne
 * Accepter une demande crée une séance de collecte (et peut déclencher une alerte aux donneurs de la zone).
 */
export interface TraiterDemandeCampagneRequete {
  statut: "acceptee" | "refusee";
  message: string;
  dateRetenue?: string;
  heureDebut?: string;
  objectifPoches?: number;
}

// =====================================================================
// Plateforme du CNTS — authentification (Annexe C)
// =====================================================================

/** POST /auth/agent/connexion — connexion d'un agent par e-mail + mot de passe. */
export interface AgentConnexionRequete { email: string; motDePasse: string }

export interface AgentConnecte {
  id: string;
  nomComplet: string;
  email: string;
  roles: Role[];
  siteId: string;
}

export interface AgentConnexionReponse {
  jeton: string;
  utilisateur: AgentConnecte;
}

// =====================================================================
// Plateforme du CNTS — tableau de bord de l'espace agent (P6, provisoire)
//
// Provisoire : aucune route backend n'existe encore pour ce tableau de
// bord (seule l'authentification agent est livrée à ce jour). Ce type
// et son exemple JSON (exemples/tableau-de-bord-agent.json) sont une
// proposition de Solange, à valider avec Zozerigué avant de brancher
// la vraie route /agent/tableau-de-bord (S6, cahier des charges).
// =====================================================================

export type NiveauStock = "normal" | "bas" | "critique" | "en_attente";

/** Une ligne du tableau, pour un groupe sanguin. */
export interface LigneStockGroupe {
  groupeSanguin: GroupeSanguin;
  pochesDisponibles: number;
  seuilBas: number | null;
  seuilCritique: number | null;
  niveau: NiveauStock;
  /** Dernier mouvement enregistré sur ce groupe, ISO 8601 ; null si aucun. */
  dernierMouvement: string | null;
}

/** GET /agent/tableau-de-bord — tableau de bord de l'espace agent. */
export interface TableauDeBordAgent {
  site: { id: string; nom: string };
  stock: LigneStockGroupe[];
  nbCritiques: number;
}
