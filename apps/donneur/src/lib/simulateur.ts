/**
 * Simulateur du backend, utilisé en semaines 3 et 4 (NEXT_PUBLIC_UTILISER_EXEMPLES=true).
 *
 * Il part des exemples JSON du contrat d'API et se comporte comme le vrai
 * backend : il valide, renvoie les mêmes codes d'erreur, garde les réponses
 * aux alertes. Son état est gardé dans le navigateur (localStorage), pour
 * que la démonstration survive à un rechargement.
 *
 * Comptes de démonstration
 *   Numéro 70 00 00 01, mot de passe « donneur2026 » (Awa, O+, 5 passages)
 *   Code WhatsApp simulé : 123456
 *   Demande de campagne déjà acceptée : CAMP-2026-0007 / 70 11 22 33
 *
 * Pour repartir de zéro : Profil → « Réinitialiser la démonstration »,
 * ou effacer la clé « dds:simulateur » dans le navigateur.
 */
import type {
  Alerte, CarteDonneur, CodeEnvoye, ConnexionReponse, DonHistorique, InscriptionDonneurRequete,
  Notification, ProfilDonneur, Reponse, Zone, Centre, DemandeCampagne,
} from "@dds/contrat-api";
import type { ApiDonneur } from "./api";
import { ErreurApi } from "./erreurs";
import { lireJeton } from "./session";

import exZones from "@dds/contrat-api/exemples/zones.json";
import exProfil from "@dds/contrat-api/exemples/profil.json";
import exAlertes from "@dds/contrat-api/exemples/alertes.json";
import exHistorique from "@dds/contrat-api/exemples/historique.json";
import exCentres from "@dds/contrat-api/exemples/centres.json";
import exNotifications from "@dds/contrat-api/exemples/notifications.json";
import exDemandeCampagne from "@dds/contrat-api/exemples/demande-campagne.json";

export const CODE_SIMULE = "123456";
const MOT_DE_PASSE_DEMO = "donneur2026";
const CLE = "dds:simulateur";
const LATENCE_MS = 450;
const EXPIRE_DANS = 600;
const RENVOI_DANS = 60;

/**
 * Délai entre deux dons, en mois, confirmé par le Responsable Qualité du CNTS
 * (prototype CNTS-Registering). Sera remplacé par les valeurs de l'Annexe E,
 * calculées côté backend.
 */
const DELAI_MOIS = { M: 3, F: 4 } as const;

type Compte = {
  motDePasse: string;
  verifie: boolean;
  profil: ProfilDonneur;
  historique: DonHistorique[];
  alertes: Alerte[];
  notifications: Notification[];
};

type Etat = {
  comptes: Record<string, Compte>;      // clé : téléphone international
  enAttente: Record<string, InscriptionDonneurRequete>;
  demandesCampagne?: DemandeCampagne[];   // facultatif : absent des états enregistrés avant cet ajout
};

const donnees = <T,>(json: unknown) => structuredClone((json as Reponse<T>).donnees);

/** Rend les exemples « vivants » : les alertes ouvertes datent d'aujourd'hui. */
function etatInitial(): Etat {
  const maintenant = Date.now();
  const heure = 3600_000;
  const alertes = donnees<Alerte[]>(exAlertes).map((a, i) => {
    if (a.statut !== "ouverte") {
      // Alerte close : reçue il y a quelques jours, délai déjà passé.
      return { ...a, creeLe: new Date(maintenant - (5 + i) * 24 * heure).toISOString(),
               dateLimite: new Date(maintenant - (3 + i) * 24 * heure).toISOString() };
    }
    const limite = new Date(maintenant + (2 + i * 2) * 24 * heure);
    limite.setHours(18, 0, 0, 0);
    return { ...a, creeLe: new Date(maintenant - (i + 1) * 3 * heure).toISOString(), dateLimite: limite.toISOString() };
  });
  const notifications = donnees<Notification[]>(exNotifications).map((n) => {
    if (n.type === "alerte") return { ...n, creeLe: alertes[0].creeLe };
    if (n.type === "eligibilite") return { ...n, creeLe: new Date(maintenant - 26 * heure).toISOString() };
    return n;
  });
  const profil = donnees<ProfilDonneur>(exProfil);
  return {
    comptes: {
      [profil.telephone]: {
        motDePasse: MOT_DE_PASSE_DEMO,
        verifie: true,
        profil,
        historique: donnees<DonHistorique[]>(exHistorique),
        alertes,
        notifications,
      },
    },
    enAttente: {},
    demandesCampagne: [donnees<DemandeCampagne>(exDemandeCampagne)],
  };
}

function lire(): Etat {
  const brut = window.localStorage.getItem(CLE);
  if (brut) {
    const etat = JSON.parse(brut) as Etat;
    etat.demandesCampagne ??= [donnees<DemandeCampagne>(exDemandeCampagne)];
    return etat;
  }
  const etat = etatInitial();
  ecrire(etat);
  return etat;
}

function ecrire(etat: Etat) {
  window.localStorage.setItem(CLE, JSON.stringify(etat));
}

export function reinitialiserSimulateur() {
  window.localStorage.removeItem(CLE);
}

const attendre = <T,>(valeur: T): Promise<T> =>
  new Promise((r) => setTimeout(() => r(structuredClone(valeur)), LATENCE_MS));

const echec = (message: string, code: ErreurApi["code"], champ?: string): Promise<never> =>
  new Promise((_, rejeter) => setTimeout(() => rejeter(new ErreurApi(message, code, champ)), LATENCE_MS));

const jetonPour = (telephone: string) => `simulateur.${telephone}`;

/** Compte du donneur connecté, d'après le jeton. */
function compteConnecte(etat: Etat): Compte {
  const jeton = lireJeton();
  const telephone = jeton?.startsWith("simulateur.") ? jeton.slice("simulateur.".length) : null;
  const compte = telephone ? etat.comptes[telephone] : undefined;
  if (!compte) throw new ErreurApi("Votre session a expiré. Connectez-vous à nouveau.", "NON_CONNECTE");
  return compte;
}

/** Exécute une action sur le compte connecté et enregistre l'état. */
function surCompte<T>(action: (compte: Compte) => T): Promise<T> {
  try {
    const etat = lire();
    const resultat = action(compteConnecte(etat));
    ecrire(etat);
    return attendre(resultat);
  } catch (probleme) {
    return Promise.reject(probleme);
  }
}

function codeEnvoye(telephone: string): CodeEnvoye {
  return { telephone, canal: "whatsapp", expireDans: EXPIRE_DANS, renvoiPossibleDans: RENVOI_DANS };
}

function connexionDe(compte: Compte): ConnexionReponse {
  return {
    jeton: jetonPour(compte.profil.telephone),
    utilisateur: { id: compte.profil.id, role: "donneur", nomComplet: `${compte.profil.prenom} ${compte.profil.nom}` },
  };
}

function ajouterMois(date: string, mois: number): Date {
  const d = new Date(date);
  const jour = d.getDate();
  d.setMonth(d.getMonth() + mois);
  if (d.getDate() < jour) d.setDate(0);
  return d;
}

function calculerCarte(compte: Compte): CarteDonneur {
  const { profil, historique } = compte;
  const dons = historique.filter((h) => h.resultat === "apte").sort((a, b) => b.date.localeCompare(a.date));
  const dernierDon = dons[0]?.date ?? null;
  const delaiMois = DELAI_MOIS[profil.sexe];
  const prochain = dernierDon ? ajouterMois(dernierDon, delaiMois) : null;
  const aujourdHui = new Date();
  aujourdHui.setHours(0, 0, 0, 0);
  return {
    numeroDonneur: profil.numeroDonneur,
    nomComplet: `${profil.prenom} ${profil.nom}`,
    groupeSanguin: profil.groupeSanguin,
    zone: `${profil.zone.nom}, ${profil.zone.ville}`,
    nombreDons: dons.length,
    dernierDon,
    prochainDonPossible: prochain ? prochain.toISOString().slice(0, 10) : null,
    eligible: !prochain || prochain <= aujourdHui,
    delaiMois,
    enPause: profil.enPause,
  };
}

export const simulateur: ApiDonneur = {
  zones: () => attendre(donnees<Zone[]>(exZones)),

  inscription(corps) {
    const etat = lire();
    if (etat.comptes[corps.telephone]?.verifie) {
      return echec("Ce numéro a déjà un compte. Connectez-vous, ou utilisez « Mot de passe oublié ».",
        "TELEPHONE_DEJA_INSCRIT", "telephone");
    }
    etat.enAttente[corps.telephone] = corps;
    ecrire(etat);
    return attendre(codeEnvoye(corps.telephone));
  },

  verification(telephone, code) {
    const etat = lire();
    const demande = etat.enAttente[telephone];
    if (!demande) return echec("Ce code a expiré. Demandez-en un nouveau.", "CODE_EXPIRE", "code");
    if (code !== CODE_SIMULE) return echec("Ce code n’est pas le bon. Vérifiez le message WhatsApp reçu.", "CODE_INCORRECT", "code");
    const zone = donnees<Zone[]>(exZones).find((z) => z.id === demande.zoneId)!;
    const maintenant = new Date().toISOString();
    const compte: Compte = {
      motDePasse: demande.motDePasse,
      verifie: true,
      profil: {
        id: `d_${Date.now().toString(36)}`,
        numeroDonneur: `DDS-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1e6)).padStart(6, "0")}`,
        nom: demande.nom, prenom: demande.prenom, sexe: demande.sexe,
        dateNaissance: demande.dateNaissance, telephone,
        groupeSanguin: demande.groupeSanguin, zone, canaux: demande.canaux,
        enPause: false, finPause: null, creeLe: maintenant,
      },
      historique: [],
      alertes: [],
      notifications: [{
        id: `n_${Date.now().toString(36)}`, type: "compte", titre: "Bienvenue",
        message: "Votre numéro est vérifié. Vous serez prévenu quand votre groupe sera recherché près de chez vous.",
        lue: false, creeLe: maintenant, lien: "/carte",
      }],
    };
    etat.comptes[telephone] = compte;
    delete etat.enAttente[telephone];
    ecrire(etat);
    return attendre(connexionDe(compte));
  },

  renvoyerCode: (corps) => attendre(codeEnvoye(corps.telephone)),

  connexion(telephone, motDePasse) {
    const compte = lire().comptes[telephone];
    if (!compte || compte.motDePasse !== motDePasse) {
      return echec("Numéro de téléphone ou mot de passe incorrect.", "IDENTIFIANTS_INVALIDES");
    }
    return attendre(connexionDe(compte));
  },

  // Même réponse que le numéro soit inscrit ou non.
  motDePasseOublie: (telephone) => attendre(codeEnvoye(telephone)),

  nouveauMotDePasse({ telephone, code, motDePasse }) {
    if (code !== CODE_SIMULE) return echec("Ce code n’est pas le bon. Vérifiez le message WhatsApp reçu.", "CODE_INCORRECT", "code");
    const etat = lire();
    const compte = etat.comptes[telephone];
    if (compte) {
      compte.motDePasse = motDePasse;
      ecrire(etat);
    }
    return attendre(null);
  },

  profil: () => surCompte((c) => c.profil),

  modifierProfil: (corps) => surCompte((c) => {
    if (corps.zoneId) c.profil.zone = donnees<Zone[]>(exZones).find((z) => z.id === corps.zoneId) ?? c.profil.zone;
    if (corps.canaux) {
      if (corps.canaux.length === 0) throw new ErreurApi("Gardez au moins un moyen de contact.", "DONNEES_INVALIDES", "canaux");
      c.profil.canaux = corps.canaux;
    }
    return c.profil;
  }),

  mettreEnPause: ({ enPause, finPause }) => surCompte((c) => {
    c.profil.enPause = enPause;
    c.profil.finPause = enPause ? finPause : null;
    return c.profil;
  }),

  changerMotDePasse: ({ ancienMotDePasse, nouveauMotDePasse }) => surCompte((c) => {
    if (c.motDePasse !== ancienMotDePasse) {
      throw new ErreurApi("Le mot de passe actuel n’est pas le bon.", "MOT_DE_PASSE_INCORRECT", "ancienMotDePasse");
    }
    c.motDePasse = nouveauMotDePasse;
    return null;
  }),

  carte: () => surCompte(calculerCarte),

  alertes: () => surCompte((c) => c.alertes),

  alerte: (id) => surCompte((c) => {
    const alerte = c.alertes.find((a) => a.id === id);
    if (!alerte) throw new ErreurApi("Cette alerte n’existe plus.", "INTROUVABLE");
    return alerte;
  }),

  repondreAlerte: (id, corps) => surCompte((c) => {
    const alerte = c.alertes.find((a) => a.id === id);
    if (!alerte) throw new ErreurApi("Cette alerte n’existe plus.", "INTROUVABLE");
    if (alerte.statut === "cloturee" || new Date(alerte.dateLimite) < new Date()) {
      throw new ErreurApi("Cette alerte est close : le centre n’attend plus de réponse.", "ALERTE_CLOTUREE");
    }
    alerte.maReponse = corps.reponse;
    alerte.motifRefus = corps.reponse === "pas_disponible" ? corps.motifRefus ?? "autre" : null;
    alerte.venue = corps.reponse === "je_viens" ? corps.venue ?? alerte.venue ?? null : null;
    return alerte;
  }),

  historique: () => surCompte((c) => [...c.historique].sort((a, b) => b.date.localeCompare(a.date))),

  centres: () => attendre(donnees<Centre[]>(exCentres)),

  notifications: () => surCompte((c) => [...c.notifications].sort((a, b) => b.creeLe.localeCompare(a.creeLe))),

  marquerLues: ({ ids }) => surCompte((c) => {
    c.notifications.forEach((n) => { if (!ids || ids.includes(n.id)) n.lue = true; });
    return null;
  }),

  deposerDemandeCampagne(corps) {
    const etat = lire();
    const demandes = etat.demandesCampagne!;
    const duJour = demandes.filter((d) => d.telephone === corps.telephone
      && Date.now() - new Date(d.creeLe).getTime() < 24 * 3600_000);
    if (duJour.length >= 3) {
      return echec("Vous avez déjà envoyé trois demandes aujourd’hui. Le CNTS vous rappellera.", "TROP_DE_TENTATIVES");
    }
    const { zoneId, ...reste } = corps;
    const zone = donnees<Zone[]>(exZones).find((z) => z.id === zoneId);
    if (!zone) return echec("Choisissez la zone de la collecte.", "DONNEES_INVALIDES", "zoneId");
    const numero = demandes.length + 7;
    const demande: DemandeCampagne = {
      ...reste,
      id: `dc_${Date.now().toString(36)}`,
      reference: `CAMP-${new Date().getFullYear()}-${String(numero).padStart(4, "0")}`,
      zone,
      statut: "en_attente",
      creeLe: new Date().toISOString(),
      reponseCnts: null,
    };
    demandes.push(demande);
    ecrire(etat);
    return attendre(demande);
  },

  suivreDemandeCampagne({ reference, telephone }) {
    const demande = lire().demandesCampagne!.find(
      (d) => d.reference.toUpperCase() === reference.trim().toUpperCase() && d.telephone === telephone);
    if (!demande) {
      return echec("Aucune demande ne correspond à cette référence et à ce numéro. Vérifiez les deux.", "INTROUVABLE");
    }
    return attendre(demande);
  },
};
