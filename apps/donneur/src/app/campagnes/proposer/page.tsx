"use client";
/**
 * C1 · Proposer une collecte (page publique).
 * Trois blocs : la structure, la collecte, ce qui est disponible sur place.
 * À l'envoi, la demande part au CNTS et la structure reçoit une référence.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck } from "lucide-react";
import type { DemandeCampagne, Equipement, MomentCollecte, TypeStructure, Zone } from "@dds/contrat-api";
import Bouton from "@/components/Bouton";
import { ChampTelephone, ChampTexte, ChoixZone } from "@/components/Champs";
import { MessageErreur } from "@/components/Messages";
import RetourPrecedent from "@/components/RetourPrecedent";
import { api } from "@/lib/api";
import { ErreurApi, messageDe } from "@/lib/erreurs";
import { dateLongue, numeroInternational, numeroLisible } from "@/lib/format";
import {
  DELAI_MIN_CAMPAGNE_JOURS, EQUIPEMENTS, MOMENTS, PARTICIPANTS_MINIMUM, TYPES_STRUCTURE, libelle, numeroValide,
} from "@/lib/regles";
import { CLE_DERNIERE_DEMANDE } from "@/lib/session";

type Formulaire = {
  structure: string; typeStructure: TypeStructure | ""; responsable: string; telephone: string;
  zoneId: string; lieu: string; dateSouhaitee: string; moment: MomentCollecte | "";
  participants: string; equipements: Equipement[]; precisions: string;
};
type Erreurs = Partial<Record<keyof Formulaire | "general", string>>;

/** Date la plus proche acceptée, au format AAAA-MM-JJ. */
function dateMinimum(): string {
  const d = new Date();
  d.setDate(d.getDate() + DELAI_MIN_CAMPAGNE_JOURS);
  return d.toISOString().slice(0, 10);
}

export default function ProposerCollecte() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  const [enCours, setEnCours] = useState(false);
  const [envoyee, setEnvoyee] = useState<DemandeCampagne | null>(null);
  const [f, setF] = useState<Formulaire>({
    structure: "", typeStructure: "", responsable: "", telephone: "",
    zoneId: "", lieu: "", dateSouhaitee: "", moment: "",
    participants: "", equipements: [], precisions: "",
  });

  useEffect(() => { api.zones().then(setZones).catch((p) => setErreurs({ general: messageDe(p) })); }, []);

  const changer = <K extends keyof Formulaire>(cle: K, valeur: Formulaire[K]) => {
    setF((a) => ({ ...a, [cle]: valeur }));
    setErreurs((a) => ({ ...a, [cle]: undefined, general: undefined }));
  };
  const basculerEquipement = (e: Equipement) =>
    changer("equipements", f.equipements.includes(e) ? f.equipements.filter((x) => x !== e) : [...f.equipements, e]);

  function verifier(): Erreurs {
    const e: Erreurs = {};
    if (f.structure.trim().length < 3) e.structure = "Écrivez le nom de votre groupe ou de votre structure.";
    if (!f.typeStructure) e.typeStructure = "Choisissez le type de structure.";
    if (f.responsable.trim().length < 3) e.responsable = "Écrivez le nom de la personne à contacter.";
    if (!numeroValide(f.telephone)) e.telephone = "Le numéro doit compter 8 chiffres.";
    if (!f.zoneId) e.zoneId = "Choisissez le quartier de la collecte.";
    if (f.lieu.trim().length < 3) e.lieu = "Précisez le lieu : cour de l’école, salle, terrain…";
    if (!f.dateSouhaitee) e.dateSouhaitee = "Choisissez une date.";
    else if (f.dateSouhaitee < dateMinimum()) {
      e.dateSouhaitee = `Choisissez une date à partir du ${dateLongue(dateMinimum())} : le CNTS a besoin de ${DELAI_MIN_CAMPAGNE_JOURS} jours pour s’organiser.`;
    }
    if (!f.moment) e.moment = "Choisissez le moment de la journée.";
    const n = Number(f.participants);
    if (!f.participants || !Number.isInteger(n) || n < 1) e.participants = "Indiquez une estimation du nombre de donneurs.";
    else if (n < PARTICIPANTS_MINIMUM) e.participants = `Le CNTS se déplace à partir de ${PARTICIPANTS_MINIMUM} donneurs environ.`;
    return e;
  }

  async function envoyer(ev: React.FormEvent) {
    ev.preventDefault();
    const e = verifier();
    setErreurs(e);
    if (Object.keys(e).length) {
      document.querySelector(".champ--erreur")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setEnCours(true);
    try {
      const demande = await api.deposerDemandeCampagne({
        structure: f.structure.trim(), typeStructure: f.typeStructure as TypeStructure,
        responsable: f.responsable.trim(), telephone: numeroInternational(f.telephone),
        zoneId: f.zoneId, lieu: f.lieu.trim(), dateSouhaitee: f.dateSouhaitee,
        moment: f.moment as MomentCollecte, participantsAttendus: Number(f.participants),
        equipements: f.equipements, precisions: f.precisions.trim(),
      });
      window.sessionStorage.setItem(CLE_DERNIERE_DEMANDE,
        JSON.stringify({ reference: demande.reference, telephone: demande.telephone }));
      setEnvoyee(demande);
      window.scrollTo({ top: 0 });
    } catch (p) {
      const champ = p instanceof ErreurApi ? (p.champ as keyof Formulaire | undefined) : undefined;
      setErreurs(champ ? { [champ]: messageDe(p) } : { general: messageDe(p) });
    } finally {
      setEnCours(false);
    }
  }

  if (envoyee) return <Confirmation demande={envoyee} />;

  return (
    <main className="page page--sans-barre pile-l">
      <RetourPrecedent secours="/campagnes" />
      <div className="pile-s">
        <h1 className="titre-grand">Proposer une collecte</h1>
        <p className="appui">Le CNTS vous rappellera sur le numéro indiqué pour confirmer.</p>
      </div>

      <form className="pile-l" noValidate onSubmit={envoyer}>
        <section className="formulaire-section">
          <h2>Votre structure</h2>
          <ChampTexte etiquette="Nom du groupe ou de la structure" value={f.structure} erreur={erreurs.structure}
                      placeholder="Lycée de Tanghin, Jeunes du secteur 12…" onChange={(e) => changer("structure", e.target.value)} />
          <div className={`champ${erreurs.typeStructure ? " champ--erreur" : ""}`}>
            <label className="champ__etiquette" htmlFor="type-structure">Type de structure</label>
            <span className="champ__groupe">
              <select id="type-structure" className="champ__saisie" value={f.typeStructure}
                      onChange={(e) => changer("typeStructure", e.target.value as TypeStructure)}>
                <option value="">Choisir</option>
                {TYPES_STRUCTURE.map((t) => <option key={t.cle} value={t.cle}>{t.mot}</option>)}
              </select>
            </span>
            {erreurs.typeStructure && <span className="champ__aide-erreur">{erreurs.typeStructure}</span>}
          </div>
          <ChampTexte etiquette="Personne responsable" autoComplete="name" value={f.responsable} erreur={erreurs.responsable}
                      placeholder="Nom et prénom" onChange={(e) => changer("responsable", e.target.value)} />
          <ChampTelephone etiquette="Son numéro de téléphone" valeur={f.telephone} valide={numeroValide(f.telephone)}
                          erreur={erreurs.telephone} surChange={(v) => changer("telephone", v)}
                          aide="Le CNTS appellera ce numéro. Il servira aussi à suivre la demande." />
        </section>

        <hr className="filet" />

        <section className="formulaire-section">
          <h2>La collecte</h2>
          <ChoixZone zones={zones} valeur={f.zoneId} erreur={erreurs.zoneId} surChoix={(id) => changer("zoneId", id)} />
          <ChampTexte etiquette="Lieu précis" value={f.lieu} erreur={erreurs.lieu}
                      placeholder="Cour de l’école, salle polyvalente…" onChange={(e) => changer("lieu", e.target.value)} />
          <ChampTexte etiquette="Date souhaitée" type="date" min={dateMinimum()} value={f.dateSouhaitee}
                      erreur={erreurs.dateSouhaitee} aide={`Au plus tôt le ${dateLongue(dateMinimum())}.`}
                      onChange={(e) => changer("dateSouhaitee", e.target.value)} />
          <fieldset className={`champ${erreurs.moment ? " champ--erreur" : ""}`} style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="champ__etiquette" style={{ padding: 0, marginBottom: "var(--e1)" }}>Moment de la journée</legend>
            <div className="rang-flexible">
              {MOMENTS.map((m) => (
                <button key={m.cle} type="button" className="touche" aria-pressed={f.moment === m.cle}
                        onClick={() => changer("moment", m.cle)}>{m.mot}</button>
              ))}
            </div>
            {erreurs.moment && <span className="champ__aide-erreur">{erreurs.moment}</span>}
          </fieldset>
          <ChampTexte etiquette="Nombre de donneurs attendus" type="number" inputMode="numeric" min={1}
                      value={f.participants} erreur={erreurs.participants}
                      aide={`Une estimation suffit. Le CNTS se déplace à partir de ${PARTICIPANTS_MINIMUM} donneurs environ.`}
                      onChange={(e) => changer("participants", e.target.value.replace(/\D/g, ""))} />
        </section>

        <hr className="filet" />

        <section className="formulaire-section">
          <h2>Sur place</h2>
          <fieldset className="champ" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="champ__etiquette" style={{ padding: 0, marginBottom: "var(--e2)" }}>
              Ce que vous pouvez fournir
            </legend>
            <div className="cases-liste">
              {EQUIPEMENTS.map((e) => (
                <label key={e.cle} className="case">
                  <input type="checkbox" checked={f.equipements.includes(e.cle)} onChange={() => basculerEquipement(e.cle)} />
                  <span>{e.mot}</span>
                </label>
              ))}
            </div>
            <span className="champ__aide">Le CNTS apporte tout le matériel médical.</span>
          </fieldset>
          <div className="champ">
            <label className="champ__etiquette" htmlFor="precisions">Précisions (facultatif)</label>
            <textarea id="precisions" className="zone-texte" maxLength={500} value={f.precisions}
                      placeholder="Collectes déjà organisées, contraintes d’accès, événement associé…"
                      onChange={(e) => changer("precisions", e.target.value)} />
          </div>
        </section>

        <MessageErreur>{erreurs.general}</MessageErreur>
        <Bouton type="submit" large enCours={enCours} motEnCours="Envoi au CNTS">Envoyer la demande au CNTS</Bouton>
        <p className="petit centre">
          Ces informations servent uniquement à organiser la collecte. Le CNTS reste seul à décider des collectes qu’il programme.
        </p>
      </form>
    </main>
  );
}

function Confirmation({ demande }: { demande: DemandeCampagne }) {
  return (
    <main className="page page--sans-barre pile-l">
      <div className="pile-s" style={{ alignItems: "center", textAlign: "center" }}>
        <span className="etat-vide__icone" style={{ background: "var(--seve-clair)", color: "var(--seve)" }}>
          <CircleCheck size={30} aria-hidden="true" />
        </span>
        <h1 className="titre-grand">Demande envoyée au CNTS</h1>
        <p className="appui">Merci ! Notez cette référence : elle vous servira à suivre votre demande.</p>
      </div>

      <p className="reference" aria-label={`Référence ${demande.reference}`}>{demande.reference}</p>

      <dl className="liste">
        {[
          ["Structure", demande.structure],
          ["Lieu", `${demande.lieu}, ${demande.zone.nom}`],
          ["Date souhaitée", `${dateLongue(demande.dateSouhaitee)}, ${libelle(MOMENTS, demande.moment).toLowerCase()}`],
          ["Donneurs attendus", String(demande.participantsAttendus)],
        ].map(([cle, valeur]) => (
          <div key={cle} className="ligne">
            <dt className="ligne__corps appui">{cle}</dt>
            <dd style={{ margin: 0, textAlign: "right" }} className="fort">{valeur}</dd>
          </div>
        ))}
      </dl>

      <p className="appui">
        Le CNTS va étudier votre demande et rappellera {demande.responsable} au{" "}
        <span className="chiffres">+226 {numeroLisible(demande.telephone)}</span> pour confirmer la date et l’organisation.
      </p>

      <div className="pile">
        <Link href="/campagnes/suivi" className="bouton bouton--principal bouton--large">Suivre ma demande</Link>
        <Link href="/campagnes" className="bouton bouton--secondaire bouton--large">Terminer</Link>
      </div>
    </main>
  );
}
