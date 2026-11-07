import { Router } from "express";
import { z } from "zod";
import type {
  CarteDonneur, Canal, DonHistorique, GroupeSanguin, Notification, ProfilDonneur,
} from "@dds/contrat-api";
import { AppError } from "../lib/erreurs.js";
import { requete, transaction } from "../lib/db.js";
import { hacher, verifier } from "../lib/motdepasse.js";
import { lireRegle } from "../lib/regles.js";
import { valider } from "../lib/validation.js";
import { inscrireEvenement } from "../lib/evenements.js";
import { ajouterMois, aujourdHui, instantISO } from "../lib/format.js";
import { formaterAlerte, SELECT_ALERTE, type LigneAlerte } from "../lib/alertes.js";

/**
 * Routes « donneur connecté » (écrans D8 à D14), montées sous /donneurs/moi.
 * Le middleware (authentifier + exigerDonneur) est posé dans index.ts.
 */
export const routeDonneurs = Router();

const CANAUX = ["whatsapp", "sms", "appel"] as const;

// ---------------------------------------------------------------------
// Lecture du profil
// ---------------------------------------------------------------------
interface LigneProfil {
  id: string;
  numero_donneur: string;
  nom: string;
  prenom: string;
  sexe: "F" | "M";
  date_naissance: string;
  telephone: string;
  groupe_sanguin: string | null;
  canaux: string[];
  en_pause: boolean;
  fin_pause: string | null;
  cree_le: Date;
  zone_id: string | null;
  zone_nom: string | null;
  zone_ville: string | null;
}

const SELECT_PROFIL = `
  select d.id, d.numero_donneur, d.nom, d.prenom, d.sexe,
         to_char(d.date_naissance, 'YYYY-MM-DD') as date_naissance,
         d.telephone, d.groupe_sanguin, d.canaux, d.cree_le,
         (d.pause_jusquau is not null and d.pause_jusquau >= current_date) as en_pause,
         case when d.pause_jusquau is not null and d.pause_jusquau >= current_date
              then to_char(d.pause_jusquau, 'YYYY-MM-DD') else null end as fin_pause,
         z.id as zone_id, z.nom as zone_nom, z.ville as zone_ville
  from donneurs d
  left join zones z on z.id = d.zone_id
  where d.id = $1 and d.actif
`;

function formaterProfil(l: LigneProfil): ProfilDonneur {
  // Invariant : un donneur inscrit via l'application a toujours une zone.
  if (!l.zone_id || !l.zone_nom || !l.zone_ville) {
    throw new AppError("ERREUR_SERVEUR", "Donneur sans zone.", 500);
  }
  return {
    id: l.id,
    numeroDonneur: l.numero_donneur,
    nom: l.nom,
    prenom: l.prenom,
    sexe: l.sexe,
    dateNaissance: l.date_naissance,
    telephone: l.telephone,
    groupeSanguin: l.groupe_sanguin as GroupeSanguin | null,
    zone: { id: l.zone_id, nom: l.zone_nom, ville: l.zone_ville },
    canaux: l.canaux as Canal[],
    enPause: l.en_pause,
    finPause: l.fin_pause,
    creeLe: instantISO(l.cree_le),
  };
}

async function lireProfil(donneurId: string): Promise<ProfilDonneur> {
  const { rows } = await requete<LigneProfil>(SELECT_PROFIL, [donneurId]);
  if (!rows[0]) throw new AppError("NON_CONNECTE", "Compte introuvable ou désactivé.", 401);
  return formaterProfil(rows[0]);
}

// ---------------------------------------------------------------------
// D13 — profil
// ---------------------------------------------------------------------
routeDonneurs.get("/", async (req, res) => {
  res.json({ donnees: await lireProfil(req.utilisateur!.id) });
});

const schemaModification = z.object({
  zoneId: z.string().uuid("Zone invalide.").optional(),
  canaux: z.array(z.enum(CANAUX)).min(1, "Gardez au moins un moyen de contact.").optional(),
}).refine((d) => d.zoneId !== undefined || d.canaux !== undefined, {
  message: "Rien à modifier.",
});

routeDonneurs.patch("/", async (req, res) => {
  const donneurId = req.utilisateur!.id;
  const d = valider(schemaModification, req.body);

  await transaction(async (client) => {
    if (d.zoneId !== undefined) {
      await client.query("update donneurs set zone_id = $1 where id = $2", [d.zoneId, donneurId]);
    }
    if (d.canaux !== undefined) {
      await client.query("update donneurs set canaux = $1 where id = $2", [d.canaux, donneurId]);
    }
  });
  await inscrireEvenement({ type: "modification", donneurId, details: { champs: Object.keys(d) } });

  res.json({ donnees: await lireProfil(donneurId) });
});

// ---------------------------------------------------------------------
// D13 — pause / reprise des alertes
// ---------------------------------------------------------------------
const schemaPause = z.object({
  enPause: z.boolean(),
  finPause: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format AAAA-MM-JJ.")
    .nullable(),
});

routeDonneurs.put("/pause", async (req, res) => {
  const donneurId = req.utilisateur!.id;
  const d = valider(schemaPause, req.body);

  const pauseJusquau = d.enPause ? d.finPause : null;
  await requete("update donneurs set pause_jusquau = $1 where id = $2", [pauseJusquau, donneurId]);
  await inscrireEvenement({ type: "pause", donneurId, details: { enPause: d.enPause, finPause: pauseJusquau } });

  res.json({ donnees: await lireProfil(donneurId) });
});

// ---------------------------------------------------------------------
// D13 — changement de mot de passe
// ---------------------------------------------------------------------
const schemaMotDePasse = z.object({
  ancienMotDePasse: z.string().min(1, "Mot de passe actuel requis."),
  nouveauMotDePasse: z.string().min(8, "Le nouveau mot de passe doit faire au moins 8 caractères."),
});

routeDonneurs.put("/mot-de-passe", async (req, res) => {
  const donneurId = req.utilisateur!.id;
  const d = valider(schemaMotDePasse, req.body);

  const { rows } = await requete<{ mot_de_passe: string | null }>(
    "select mot_de_passe from donneurs where id = $1 and actif",
    [donneurId],
  );
  const donneur = rows[0];
  if (!donneur || !(await verifier(d.ancienMotDePasse, donneur.mot_de_passe ?? ""))) {
    throw new AppError("MOT_DE_PASSE_INCORRECT", "Le mot de passe actuel n'est pas le bon.", 400, "ancienMotDePasse");
  }

  const hash = await hacher(d.nouveauMotDePasse);
  await requete("update donneurs set mot_de_passe = $1, doit_changer_mot_de_passe = false where id = $2", [hash, donneurId]);
  await inscrireEvenement({ type: "modification", donneurId, details: { champ: "mot_de_passe" } });

  // TODO (prototype) : invalider les autres sessions ouvertes (versionnage de jeton).
  res.json({ donnees: null });
});

// ---------------------------------------------------------------------
// D8 — carte de donneur
// ---------------------------------------------------------------------
interface LigneCarte {
  numero_donneur: string;
  prenom: string;
  nom: string;
  sexe: "F" | "M";
  groupe_sanguin: string | null;
  prochaine_eligibilite: string | null;
  en_pause: boolean;
  zone_nom: string;
  zone_ville: string;
  nombre_dons: number;
  dernier_don: string | null;
  ajourne_jusquau: string | null;
}

routeDonneurs.get("/carte", async (req, res) => {
  const donneurId = req.utilisateur!.id;
  const { rows } = await requete<LigneCarte>(
    `select d.numero_donneur, d.prenom, d.nom, d.sexe, d.groupe_sanguin,
            to_char(d.prochaine_eligibilite, 'YYYY-MM-DD') as prochaine_eligibilite,
            (d.pause_jusquau is not null and d.pause_jusquau >= current_date) as en_pause,
            coalesce(z.nom, '') as zone_nom, coalesce(z.ville, '') as zone_ville,
            (select count(*)::int from passages p where p.donneur_id = d.id and p.resultat = 'apte') as nombre_dons,
            (select to_char(max(p.date), 'YYYY-MM-DD') from passages p
              where p.donneur_id = d.id and p.resultat = 'apte') as dernier_don,
            (select to_char(max(p.ajourne_jusquau), 'YYYY-MM-DD') from passages p
              where p.donneur_id = d.id and p.resultat = 'ajourne' and p.ajourne_jusquau >= current_date) as ajourne_jusquau
     from donneurs d
     left join zones z on z.id = d.zone_id
     where d.id = $1 and d.actif`,
    [donneurId],
  );
  const d = rows[0];
  if (!d) throw new AppError("NON_CONNECTE", "Compte introuvable ou désactivé.", 401);

  const delaiMois = await lireRegle(d.sexe === "F" ? "delai_femme_mois" : "delai_homme_mois", d.sexe === "F" ? 4 : 3);

  // La date la plus tardive l'emporte : don récent, ajournement en cours ou
  // date d'éligibilité déjà calculée par le centre.
  const base = d.dernier_don ? ajouterMois(d.dernier_don, delaiMois) : null;
  const candidates = [base, d.prochaine_eligibilite, d.ajourne_jusquau].filter((x): x is string => !!x);
  const prochainDonPossible = candidates.length ? candidates.sort().at(-1)! : null;
  const eligible = prochainDonPossible === null || prochainDonPossible <= aujourdHui();

  const carte: CarteDonneur = {
    numeroDonneur: d.numero_donneur,
    nomComplet: `${d.prenom} ${d.nom}`,
    groupeSanguin: d.groupe_sanguin as GroupeSanguin | null,
    zone: d.zone_nom ? `${d.zone_nom}, ${d.zone_ville}` : d.zone_ville,
    nombreDons: d.nombre_dons,
    dernierDon: d.dernier_don,
    prochainDonPossible,
    eligible,
    delaiMois,
    enPause: d.en_pause,
  };
  res.json({ donnees: carte });
});

// ---------------------------------------------------------------------
// D11 — historique des dons (le motif d'ajournement n'est jamais transmis)
// ---------------------------------------------------------------------
routeDonneurs.get("/historique", async (req, res) => {
  const { rows } = await requete<DonHistorique>(
    `select p.id, to_char(p.date, 'YYYY-MM-DD') as date, s.nom as centre, p.resultat
     from passages p
     join sites s on s.id = p.site_id
     where p.donneur_id = $1
     order by p.date desc`,
    [req.utilisateur!.id],
  );
  res.json({ donnees: rows });
});

// ---------------------------------------------------------------------
// D14 — notifications
// ---------------------------------------------------------------------
interface LigneNotification {
  id: string;
  type: string;
  titre: string;
  message: string;
  lue: boolean;
  cree_le: Date;
  lien: string | null;
}

routeDonneurs.get("/notifications", async (req, res) => {
  const { rows } = await requete<LigneNotification>(
    "select id, type, titre, message, lue, cree_le, lien from messages_donneurs where donneur_id = $1 order by cree_le desc",
    [req.utilisateur!.id],
  );
  const notifications: Notification[] = rows.map((n) => ({
    id: n.id,
    type: n.type as Notification["type"],
    titre: n.titre,
    message: n.message,
    lue: n.lue,
    creeLe: instantISO(n.cree_le),
    lien: n.lien,
  }));
  res.json({ donnees: notifications });
});

const schemaLues = z.object({
  ids: z.array(z.string().uuid("Identifiant invalide.")).optional(),
});

routeDonneurs.post("/notifications/lues", async (req, res) => {
  const donneurId = req.utilisateur!.id;
  const d = valider(schemaLues, req.body);
  if (d.ids === undefined) {
    await requete("update messages_donneurs set lue = true where donneur_id = $1", [donneurId]);
  } else if (d.ids.length > 0) {
    await requete("update messages_donneurs set lue = true where donneur_id = $1 and id = any($2::uuid[])", [donneurId, d.ids]);
  }
  res.json({ donnees: null });
});

// ---------------------------------------------------------------------
// D9 / D10 — alertes envoyées au donneur
// ---------------------------------------------------------------------
routeDonneurs.get("/alertes", async (req, res) => {
  const { rows } = await requete<LigneAlerte>(`${SELECT_ALERTE} order by a.cree_le desc`, [req.utilisateur!.id]);
  res.json({ donnees: rows.map(formaterAlerte) });
});

routeDonneurs.get("/alertes/:id", async (req, res) => {
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) throw new AppError("INTROUVABLE", "Cette alerte n'existe pas.", 404);

  const { rows } = await requete<LigneAlerte>(`${SELECT_ALERTE} and a.id = $2`, [req.utilisateur!.id, id.data]);
  if (!rows[0]) throw new AppError("INTROUVABLE", "Cette alerte n'existe pas.", 404);
  res.json({ donnees: formaterAlerte(rows[0]) });
});
