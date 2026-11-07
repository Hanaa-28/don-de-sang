"use client";
/**
 * D3 · Inscription, en trois étapes (déroulé repris de DJIGUI) :
 *   1. Qui êtes-vous ?        nom, prénom, sexe, date de naissance (18 ans révolus)
 *   2. Comment vous joindre ? numéro WhatsApp (saisi deux fois), zone, groupe, canaux
 *   3. Sécurisez votre compte mot de passe, accord (accord de recontact du CNTS)
 * Ce qui est saisi est gardé quand on revient en arrière.
 * À l'envoi, un code part par WhatsApp et l'on passe à D4.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Canal, GroupeSanguin, Sexe, Zone } from "@dds/contrat-api";
import Bouton from "@/components/Bouton";
import { ChampDate, ChampMotDePasse, ChampTelephone, ChampTexte, ChoixGroupe, ChoixZone } from "@/components/Champs";
import { MessageErreur } from "@/components/Messages";
import { api } from "@/lib/api";
import { ErreurApi, messageDe } from "@/lib/erreurs";
import { numeroInternational } from "@/lib/format";
import { AGE_MINIMUM, CANAUX, LONGUEUR_MOT_DE_PASSE, ageRevolu, dateExiste, numeroValide } from "@/lib/regles";
import { memoriserVerification } from "@/lib/session";

type Formulaire = {
  nom: string; prenom: string; sexe: Sexe | ""; jour: string; mois: string; annee: string;
  telephone: string; confirmation: string; zoneId: string;
  groupe: GroupeSanguin | null; groupeInconnu: boolean; canaux: Canal[];
  motDePasse: string; consentement: boolean;
};

type Erreurs = Partial<Record<keyof Formulaire | "date" | "general", string>>;

const TITRES = ["Qui êtes-vous ?", "Comment vous joindre ?", "Sécurisez votre compte"];
const SOUS_TITRES = [
  "Ces informations figureront sur votre carte de donneur.",
  "Le centre vous préviendra sur ce numéro.",
  "Dernière étape : un mot de passe et votre accord.",
];

/** Étape où se trouve chaque champ, pour y revenir si le serveur le refuse. */
const ETAPE_DU_CHAMP: Record<string, number> = {
  nom: 1, prenom: 1, sexe: 1, dateNaissance: 1,
  telephone: 2, zoneId: 2, groupeSanguin: 2, canaux: 2,
  motDePasse: 3, consentement: 3,
};

export default function Inscription() {
  const routeur = useRouter();
  const [etape, setEtape] = useState(1);
  const [zones, setZones] = useState<Zone[]>([]);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [enCours, setEnCours] = useState(false);
  const [f, setF] = useState<Formulaire>({
    nom: "", prenom: "", sexe: "", jour: "", mois: "", annee: "",
    telephone: "", confirmation: "", zoneId: "",
    groupe: null, groupeInconnu: false, canaux: ["whatsapp"],
    motDePasse: "", consentement: false,
  });

  useEffect(() => { api.zones().then(setZones).catch((p) => setErreurs({ general: messageDe(p) })); }, []);

  const changer = <K extends keyof Formulaire>(cle: K, valeur: Formulaire[K]) => {
    setF((avant) => ({ ...avant, [cle]: valeur }));
    setErreurs((avant) => ({ ...avant, [cle]: undefined, general: undefined }));
  };

  const chiffres = (v: string) => v.replace(/\D/g, "");
  const telValide = numeroValide(f.telephone);
  const confirmationValide = telValide && chiffres(f.telephone) === chiffres(f.confirmation);
  const dateNaissance = `${f.annee}-${f.mois.padStart(2, "0")}-${f.jour.padStart(2, "0")}`;

  function verifier(n: number): Erreurs {
    const e: Erreurs = {};
    if (n === 1) {
      if (!f.nom.trim()) e.nom = "Écrivez votre nom.";
      if (!f.prenom.trim()) e.prenom = "Écrivez votre prénom.";
      if (!f.sexe) e.sexe = "Choisissez Femme ou Homme.";
      if (!dateExiste(f.jour, f.mois, f.annee)) e.date = "Cette date n’existe pas. Vérifiez le jour, le mois et l’année.";
      else if (ageRevolu(dateNaissance) < AGE_MINIMUM) {
        e.date = `Il faut avoir ${AGE_MINIMUM} ans révolus pour donner son sang. Vous pourrez créer votre compte à votre majorité.`;
      }
    }
    if (n === 2) {
      if (!telValide) e.telephone = "Le numéro doit compter 8 chiffres.";
      else if (!confirmationValide) e.confirmation = "Les deux numéros ne sont pas identiques.";
      if (!f.zoneId) e.zoneId = "Choisissez votre quartier.";
      if (!f.groupe && !f.groupeInconnu) e.groupe = "Choisissez votre groupe, ou cochez « Je ne connais pas mon groupe ».";
      if (f.canaux.length === 0) e.canaux = "Choisissez au moins un moyen de contact.";
    }
    if (n === 3) {
      if (f.motDePasse.length < LONGUEUR_MOT_DE_PASSE) e.motDePasse = `Au moins ${LONGUEUR_MOT_DE_PASSE} caractères.`;
      if (!f.consentement) e.consentement = "Votre accord est nécessaire pour que le centre puisse vous prévenir.";
    }
    return e;
  }

  function suivant() {
    const e = verifier(etape);
    setErreurs(e);
    if (Object.keys(e).length === 0) {
      setEtape(etape + 1);
      window.scrollTo({ top: 0 });
    }
  }

  async function envoyer() {
    const e = verifier(3);
    setErreurs(e);
    if (Object.keys(e).length) return;
    setEnCours(true);
    const telephone = numeroInternational(f.telephone);
    try {
      const envoi = await api.inscription({
        nom: f.nom.trim(), prenom: f.prenom.trim(), sexe: f.sexe as Sexe, dateNaissance,
        telephone, motDePasse: f.motDePasse,
        groupeSanguin: f.groupeInconnu ? null : f.groupe,
        zoneId: f.zoneId, canaux: f.canaux, consentement: true,
      });
      memoriserVerification({
        telephone, objet: "inscription",
        renvoiPossibleLe: Date.now() + envoi.renvoiPossibleDans * 1000,
        expireLe: Date.now() + envoi.expireDans * 1000,
      });
      routeur.push("/verification");
    } catch (p) {
      const champ = p instanceof ErreurApi ? p.champ : undefined;
      if (champ && ETAPE_DU_CHAMP[champ]) {
        setEtape(ETAPE_DU_CHAMP[champ]);
        setErreurs({ [champ === "dateNaissance" ? "date" : champ]: messageDe(p) });
      } else {
        setErreurs({ general: messageDe(p) });
      }
      setEnCours(false);
    }
  }

  const basculerCanal = (c: Canal) =>
    changer("canaux", f.canaux.includes(c) ? f.canaux.filter((x) => x !== c) : [...f.canaux, c]);

  return (
    <main className="acces">
      {etape === 1 ? (
        <Link href="/bienvenue" className="lien retour"><ArrowLeft size={18} aria-hidden="true" />Retour</Link>
      ) : (
        <button type="button" className="lien retour" onClick={() => setEtape(etape - 1)}>
          <ArrowLeft size={18} aria-hidden="true" />Étape précédente
        </button>
      )}

      <div className="acces__entete">
        <div className="segments" aria-hidden="true">
          {[1, 2, 3].map((n) => <span key={n} className={etape >= n ? "actif" : ""} />)}
        </div>
        <span className="petit">Étape {etape} sur 3</span>
        <h1 className="titre-grand">{TITRES[etape - 1]}</h1>
        <p className="appui">{SOUS_TITRES[etape - 1]}</p>
      </div>

      <form className="pile-l" noValidate onSubmit={(e) => { e.preventDefault(); if (etape < 3) suivant(); else envoyer(); }}>
        {etape === 1 && (
          <>
            <ChampTexte etiquette="Nom" autoComplete="family-name" value={f.nom} erreur={erreurs.nom}
                        onChange={(e) => changer("nom", e.target.value)} />
            <ChampTexte etiquette="Prénom" autoComplete="given-name" value={f.prenom} erreur={erreurs.prenom}
                        onChange={(e) => changer("prenom", e.target.value)} />
            <fieldset className={`champ${erreurs.sexe ? " champ--erreur" : ""}`} style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="champ__etiquette" style={{ padding: 0, marginBottom: "var(--e1)" }}>Sexe</legend>
              <div className="touches-2">
                {([["F", "Femme"], ["M", "Homme"]] as const).map(([code, mot]) => (
                  <button key={code} type="button" className="touche" aria-pressed={f.sexe === code}
                          onClick={() => changer("sexe", code)}>{mot}</button>
                ))}
              </div>
              {erreurs.sexe && <span className="champ__aide-erreur">{erreurs.sexe}</span>}
            </fieldset>
            <ChampDate etiquette="Date de naissance" jour={f.jour} mois={f.mois} annee={f.annee}
                       erreur={erreurs.date} aide={`Il faut avoir ${AGE_MINIMUM} ans révolus pour donner son sang.`}
                       surChange={(cle, v) => { changer(cle, v); setErreurs((a) => ({ ...a, date: undefined })); }} />
          </>
        )}

        {etape === 2 && (
          <>
            <ChampTelephone etiquette="Numéro WhatsApp" valeur={f.telephone} valide={telValide}
                            erreur={erreurs.telephone} surChange={(v) => changer("telephone", v)}
                            aide="Un code de vérification sera envoyé sur WhatsApp à ce numéro." />
            <ChampTelephone etiquette="Écrivez à nouveau ce numéro" valeur={f.confirmation} valide={confirmationValide}
                            erreur={erreurs.confirmation} autoComplete="off" empecherCollage
                            surChange={(v) => changer("confirmation", v)} />
            <ChoixZone zones={zones} valeur={f.zoneId} erreur={erreurs.zoneId} surChoix={(id) => changer("zoneId", id)} />
            <ChoixGroupe valeur={f.groupe} inconnu={f.groupeInconnu} erreur={erreurs.groupe}
                         surChoix={(g) => changer("groupe", g)}
                         surInconnu={(v) => { changer("groupeInconnu", v); if (v) changer("groupe", null); setErreurs((a) => ({ ...a, groupe: undefined })); }} />
            <fieldset className={`champ${erreurs.canaux ? " champ--erreur" : ""}`} style={{ border: 0, padding: 0, margin: 0 }}>
              <legend className="champ__etiquette" style={{ padding: 0, marginBottom: "var(--e1)" }}>
                Comment le centre peut vous prévenir
              </legend>
              <div className="rang-flexible">
                {CANAUX.map(({ cle, mot }) => (
                  <button key={cle} type="button" className="touche" aria-pressed={f.canaux.includes(cle)}
                          onClick={() => basculerCanal(cle)}>{mot}</button>
                ))}
              </div>
              {erreurs.canaux && <span className="champ__aide-erreur">{erreurs.canaux}</span>}
            </fieldset>
          </>
        )}

        {etape === 3 && (
          <>
            <ChampMotDePasse etiquette="Mot de passe" nouveau montrerForce valeur={f.motDePasse}
                             erreur={erreurs.motDePasse} surChange={(v) => changer("motDePasse", v)}
                             aide={`Au moins ${LONGUEUR_MOT_DE_PASSE} caractères. Mélangez lettres et chiffres.`} />
            <div className={`champ${erreurs.consentement ? " champ--erreur" : ""}`}>
              <label className="case">
                <input type="checkbox" checked={f.consentement}
                       onChange={(e) => changer("consentement", e.target.checked)} />
                <span>
                  J’accepte que le centre de transfusion conserve ces informations et me prévienne
                  quand mon groupe sanguin est recherché. Je peux mettre les alertes en pause à tout moment.
                </span>
              </label>
              {erreurs.consentement && <span className="champ__aide-erreur">{erreurs.consentement}</span>}
            </div>
          </>
        )}

        <MessageErreur>{erreurs.general}</MessageErreur>

        <Bouton type="submit" large enCours={enCours} motEnCours="Envoi du code">
          {etape < 3 ? "Continuer" : "Créer mon compte"}
        </Bouton>
      </form>

      <p className="appui centre">
        Déjà inscrit ? <Link href="/connexion" className="lien">Se connecter</Link>
      </p>
    </main>
  );
}
