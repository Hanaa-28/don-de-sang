import { Router } from "express";
import { z } from "zod";
import type { Canal, DonneurAgent, GroupeSanguin } from "@dds/contrat-api";
import { AppError } from "../lib/erreurs.js";
import { requete, transaction } from "../lib/db.js";
import { hacher } from "../lib/motdepasse.js";
import { valider } from "../lib/validation.js";
import { inscrireEvenement } from "../lib/evenements.js";
import { genererMotDePasseTemporaire } from "../lib/code.js";
import { instantISO } from "../lib/format.js";

/**
 * Routes « agent d'accueil » (P3), montées sous /donneurs :
 *   GET  /donneurs?telephone=…      retrouver un donneur
 *   POST /donneurs                  inscrire un donneur sur place
 *   POST /donneurs/:id/reinitialisation   mot de passe temporaire
 * Le middleware (authentifier + exigerRole agent_accueil/admin) est posé dans index.ts.
 */
export const routeGestion = Router();

const TELEPHONE = /^\+226\d{8}$/;
const GROUPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;
const CANAUX = ["whatsapp", "sms", "appel"] as const;

interface LigneDonneurAgent {
  id: string;
  numero_donneur: string;
  nom: string;
  prenom: string;
  sexe: "F" | "M";
  date_naissance: string;
  telephone: string;
  telephone_verifie: boolean;
  groupe_sanguin: string | null;
  canaux: string[];
  origine: "application" | "sur_place";
  actif: boolean;
  en_pause: boolean;
  cree_le: Date;
  zone_id: string | null;
  zone_nom: string | null;
  zone_ville: string | null;
}

const SELECT_DONNEUR_AGENT = `
  select d.id, d.numero_donneur, d.nom, d.prenom, d.sexe,
         to_char(d.date_naissance, 'YYYY-MM-DD') as date_naissance,
         d.telephone, d.telephone_verifie, d.groupe_sanguin, d.canaux,
         d.origine, d.actif, d.cree_le,
         (d.pause_jusquau is not null and d.pause_jusquau >= current_date) as en_pause,
         z.id as zone_id, z.nom as zone_nom, z.ville as zone_ville
  from donneurs d
  left join zones z on z.id = d.zone_id
`;

function formaterDonneurAgent(l: LigneDonneurAgent): DonneurAgent {
  return {
    id: l.id,
    numeroDonneur: l.numero_donneur,
    nom: l.nom,
    prenom: l.prenom,
    sexe: l.sexe,
    dateNaissance: l.date_naissance,
    telephone: l.telephone,
    telephoneVerifie: l.telephone_verifie,
    groupeSanguin: l.groupe_sanguin as GroupeSanguin | null,
    zone: l.zone_id && l.zone_nom && l.zone_ville
      ? { id: l.zone_id, nom: l.zone_nom, ville: l.zone_ville }
      : null,
    canaux: l.canaux as Canal[],
    enPause: l.en_pause,
    actif: l.actif,
    origine: l.origine,
    creeLe: instantISO(l.cree_le),
  };
}

// ---------------------------------------------------------------------
// Retrouver un donneur par son numéro de téléphone
// ---------------------------------------------------------------------
routeGestion.get("/", async (req, res) => {
  const telephone = z.string().regex(TELEPHONE, "Numéro au format +226XXXXXXXX.").safeParse(req.query.telephone);
  if (!telephone.success) {
    throw new AppError("DONNEES_INVALIDES", "Numéro au format +226XXXXXXXX.", 400, "telephone");
  }

  const { rows } = await requete<LigneDonneurAgent>(`${SELECT_DONNEUR_AGENT} where d.telephone = $1`, [telephone.data]);
  if (!rows[0]) throw new AppError("INTROUVABLE", "Aucun donneur avec ce numéro.", 404);
  res.json({ donnees: formaterDonneurAgent(rows[0]) });
});

// ---------------------------------------------------------------------
// Inscrire un donneur sur place (sans l'application)
// ---------------------------------------------------------------------
const schemaInscriptionSurPlace = z.object({
  nom: z.string().trim().min(1, "Le nom est requis."),
  prenom: z.string().trim().min(1, "Le prénom est requis."),
  sexe: z.enum(["F", "M"]),
  dateNaissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date au format AAAA-MM-JJ."),
  telephone: z.string().regex(TELEPHONE, "Numéro au format +226XXXXXXXX."),
  zoneId: z.string().uuid("Zone invalide.").nullable().optional(),
  groupeSanguin: z.enum(GROUPES).nullable().optional(),
  canaux: z.array(z.enum(CANAUX)).optional(),
});

routeGestion.post("/", async (req, res) => {
  const agent = req.utilisateur!;
  const d = valider(schemaInscriptionSurPlace, req.body);

  const deja = await requete("select id from donneurs where telephone = $1", [d.telephone]);
  if (deja.rowCount) {
    throw new AppError("TELEPHONE_DEJA_INSCRIT", "Ce numéro est déjà inscrit.", 409, "telephone");
  }

  const id = await transaction(async (client) => {
    const numero = await client.query<{ n: string }>("select nextval('numero_donneur_seq') as n");
    const numeroDonneur = `DDS-${new Date().getFullYear()}-${String(numero.rows[0].n).padStart(6, "0")}`;
    const ins = await client.query<{ id: string }>(
      `insert into donneurs (numero_donneur, nom, prenom, sexe, date_naissance, telephone,
         zone_id, groupe_sanguin, canaux, origine)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,'sur_place')
       returning id`,
      [
        numeroDonneur, d.nom, d.prenom, d.sexe, d.dateNaissance, d.telephone,
        d.zoneId ?? null, d.groupeSanguin ?? null, d.canaux ?? ["appel"],
      ],
    );
    return ins.rows[0].id;
  });

  await inscrireEvenement({ type: "inscription", donneurId: id, agentId: agent.id, siteId: agent.siteId, details: { origine: "sur_place" } });

  const { rows } = await requete<LigneDonneurAgent>(`${SELECT_DONNEUR_AGENT} where d.id = $1`, [id]);
  res.status(201).json({ donnees: formaterDonneurAgent(rows[0]) });
});

// ---------------------------------------------------------------------
// Réinitialiser le mot de passe d'un donneur (mot de passe temporaire)
// ---------------------------------------------------------------------
routeGestion.post("/:id/reinitialisation", async (req, res) => {
  const agent = req.utilisateur!;
  const id = z.string().uuid().safeParse(req.params.id);
  if (!id.success) throw new AppError("INTROUVABLE", "Donneur introuvable.", 404);

  const { rows } = await requete<{ id: string }>("select id from donneurs where id = $1 and actif", [id.data]);
  if (!rows[0]) throw new AppError("INTROUVABLE", "Donneur introuvable.", 404);

  const motDePasseTemporaire = genererMotDePasseTemporaire();
  const hash = await hacher(motDePasseTemporaire);
  await requete(
    "update donneurs set mot_de_passe = $1, doit_changer_mot_de_passe = true where id = $2",
    [hash, id.data],
  );

  await inscrireEvenement({
    type: "reinitialisation",
    donneurId: id.data,
    agentId: agent.id,
    siteId: agent.siteId,
    details: { par: "agent" },
  });

  // Renvoyé en clair une seule fois : c'est l'agent qui le transmet au donneur.
  res.json({ donnees: { motDePasseTemporaire } });
});
