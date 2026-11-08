/**
 * Règles de saisie et libellés partagés par les écrans.
 * Les règles médicales (délais, éligibilité) sont calculées par le backend :
 * l'application ne fait qu'afficher ce qu'il renvoie.
 */
import type {
  Canal, Creneau, Equipement, GroupeSanguin, MomentCollecte, MotifRefus, MoyenDeplacement,
  StatutDemandeCampagne, TypeStructure,
} from "@dds/contrat-api";

/** Ordre d'affichage : les plus fréquents d'abord (Djigui). */
export const GROUPES: GroupeSanguin[] = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"];

/** Groupes rares, à signaler (prototype CNTS-Registering). */
export const GROUPES_RARES: GroupeSanguin[] = ["O-", "A-", "B-", "AB-"];

export const AGE_MINIMUM = 18;
export const LONGUEUR_MOT_DE_PASSE = 8;
export const LONGUEUR_CODE = 6;

export const CANAUX: { cle: Canal; mot: string }[] = [
  { cle: "whatsapp", mot: "WhatsApp" },
  { cle: "sms", mot: "SMS" },
  { cle: "appel", mot: "Appel" },
];

export const MOTIFS_REFUS: { cle: MotifRefus; mot: string }[] = [
  { cle: "don_recent", mot: "J’ai donné récemment" },
  { cle: "absent", mot: "Je ne suis pas en ville" },
  { cle: "sante", mot: "Raison de santé" },
  { cle: "autre", mot: "Autre raison" },
];

export const CRENEAUX: { cle: Creneau; mot: string }[] = [
  { cle: "08h-10h", mot: "8h – 10h" },
  { cle: "10h-12h", mot: "10h – 12h" },
  { cle: "12h-14h", mot: "12h – 14h" },
  { cle: "14h-16h", mot: "14h – 16h" },
];

export const MOYENS: { cle: MoyenDeplacement; mot: string }[] = [
  { cle: "a_pied", mot: "À pied" },
  { cle: "deux_roues", mot: "Deux-roues" },
  { cle: "transport_commun", mot: "Taxi ou bus" },
];

export const libelle = <T extends string>(liste: { cle: T; mot: string }[], cle: T | null | undefined) =>
  liste.find((e) => e.cle === cle)?.mot ?? "";

/** Numéro burkinabè : 8 chiffres, avec ou sans +226. */
export function numeroValide(saisie: string): boolean {
  return /^\d{8}$/.test(saisie.replace(/\D/g, "").replace(/^226(?=\d{8}$)/, ""));
}

export function ageRevolu(dateNaissance: string): number {
  const n = new Date(dateNaissance);
  const a = new Date();
  let age = a.getFullYear() - n.getFullYear();
  if (a.getMonth() < n.getMonth() || (a.getMonth() === n.getMonth() && a.getDate() < n.getDate())) age--;
  return age;
}

/** Une date AAAA-MM-JJ qui existe vraiment (pas de 31 février). */
export function dateExiste(jour: string, mois: string, annee: string): boolean {
  const j = Number(jour), m = Number(mois), a = Number(annee);
  if (!j || !m || a < 1900) return false;
  const d = new Date(a, m - 1, j);
  return d.getFullYear() === a && d.getMonth() === m - 1 && d.getDate() === j;
}

// ---------------------------------------------------------------------
// Campagnes de collecte (types de structures repris de CNTS-Registering)
// ---------------------------------------------------------------------

/** Délai minimum entre la demande et la date souhaitée : le CNTS doit organiser son équipe mobile. À confirmer avec le CNTS. */
export const DELAI_MIN_CAMPAGNE_JOURS = 14;
/** Le CNTS se déplace pour un nombre suffisant de donneurs. À confirmer avec le CNTS. */
export const PARTICIPANTS_MINIMUM = 20;

export const TYPES_STRUCTURE: { cle: TypeStructure; mot: string }[] = [
  { cle: "jeunes_quartier", mot: "Groupe de jeunes de quartier" },
  { cle: "etablissement_scolaire", mot: "Établissement scolaire" },
  { cle: "etablissement_superieur", mot: "Université ou grande école" },
  { cle: "association", mot: "Association" },
  { cle: "entreprise", mot: "Entreprise ou service" },
  { cle: "communaute_religieuse", mot: "Communauté religieuse" },
  { cle: "autre", mot: "Autre" },
];

export const MOMENTS: { cle: MomentCollecte; mot: string }[] = [
  { cle: "matin", mot: "Matin" },
  { cle: "apres_midi", mot: "Après-midi" },
  { cle: "journee", mot: "Journée entière" },
];

export const EQUIPEMENTS: { cle: Equipement; mot: string }[] = [
  { cle: "salle_ou_abri", mot: "Une salle ou un abri à l’ombre" },
  { cle: "tables_chaises", mot: "Des tables et des chaises" },
  { cle: "electricite", mot: "Une prise électrique" },
  { cle: "eau", mot: "De l’eau à boire" },
  { cle: "collation", mot: "Une collation pour les donneurs" },
];

export const STATUTS_DEMANDE: Record<StatutDemandeCampagne, { mot: string; ton: "ocre" | "seve" | "neutre" }> = {
  en_attente: { mot: "En attente de réponse du CNTS", ton: "ocre" },
  acceptee: { mot: "Collecte acceptée", ton: "seve" },
  refusee: { mot: "Demande non retenue", ton: "neutre" },
};
