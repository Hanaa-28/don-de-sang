"use client";
/**
 * D13 · Profil.
 * Ce qui se lit (identité, gérée par le centre) est séparé de ce qui se
 * règle (pause des alertes, zone, moyens de contact, mot de passe).
 * La mise en pause répond au cahier des charges : un donneur en pause ne
 * reçoit aucune alerte.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CirclePause, LogOut, Smartphone } from "lucide-react";
import type { Canal, ProfilDonneur, Zone } from "@dds/contrat-api";
import BlocGroupe from "@/components/BlocGroupe";
import Bouton from "@/components/Bouton";
import { ChampMotDePasse, ChoixZone } from "@/components/Champs";
import { useDonneur } from "@/components/ContexteDonneur";
import EnTete from "@/components/EnTete";
import { Chargement, ErreurChargement } from "@/components/Etats";
import { Encadre, MessageErreur, MessageReussite } from "@/components/Messages";
import { api, UTILISER_EXEMPLES } from "@/lib/api";
import { ErreurApi, messageDe } from "@/lib/erreurs";
import { dateLongue, numeroLisible } from "@/lib/format";
import { CANAUX, LONGUEUR_MOT_DE_PASSE } from "@/lib/regles";
import { fermerSession } from "@/lib/session";
import { reinitialiserSimulateur } from "@/lib/simulateur";
import { useChargement } from "@/lib/useChargement";

const DUREES_PAUSE: { mot: string; jours: number | null }[] = [
  { mot: "Une semaine", jours: 7 },
  { mot: "Un mois", jours: 30 },
  { mot: "Trois mois", jours: 90 },
  { mot: "Sans date", jours: null },
];

export default function Profil() {
  const routeur = useRouter();
  const { donnees, setDonnees, erreur, enCours, recharger } = useChargement(
    () => Promise.all([api.profil(), api.zones()]),
  );

  function seDeconnecter() {
    fermerSession();
    routeur.replace("/bienvenue");
  }

  if (enCours && !donnees) return <main className="page"><Chargement /></main>;
  if (erreur || !donnees) return <main className="page"><ErreurChargement message={erreur} reessayer={recharger} /></main>;

  const [profil, zones] = donnees;
  const majProfil = (p: ProfilDonneur) => setDonnees([p, zones]);

  return (
    <main className="page pile-l">
      <EnTete titre="Profil" sansProfil />

      <section className="rang" style={{ gap: "var(--e4)" }}>
        <BlocGroupe groupe={profil.groupeSanguin} taille="l" />
        <div className="pile-s" style={{ gap: 2 }}>
          <span className="lead">{profil.prenom} {profil.nom}</span>
          <span className="appui chiffres">+226 {numeroLisible(profil.telephone)}</span>
          <span className="petit chiffres">{profil.numeroDonneur}</span>
        </div>
      </section>

      <SectionPause profil={profil} surMaj={majProfil} />
      <hr className="filet" />
      <SectionPreferences profil={profil} zones={zones} surMaj={majProfil} />
      <hr className="filet" />
      <SectionMotDePasse surChange={seDeconnecter} />
      <hr className="filet" />

      <section className="pile">
        <h2 className="section-titre">Mes informations</h2>
        <dl className="liste">
          {[
            ["Sexe", profil.sexe === "F" ? "Femme" : "Homme"],
            ["Date de naissance", dateLongue(profil.dateNaissance)],
            ["Groupe sanguin", profil.groupeSanguin ?? "À préciser au centre"],
            ["Inscrit depuis le", dateLongue(profil.creeLe)],
          ].map(([cle, valeur]) => (
            <div key={cle} className="ligne">
              <dt className="ligne__corps appui">{cle}</dt>
              <dd style={{ margin: 0 }} className="fort">{valeur}</dd>
            </div>
          ))}
        </dl>
        <p className="petit">
          Pour corriger votre nom, votre date de naissance ou votre groupe, adressez-vous à l’accueil du centre.
        </p>
      </section>

      <section className="pile">
        <Link href="/installation" className="lien"><Smartphone size={18} aria-hidden="true" />Installer l’application sur ce téléphone</Link>
        <Bouton variante="secondaire" large onClick={seDeconnecter} icone={<LogOut size={18} aria-hidden="true" />}>
          Me déconnecter
        </Bouton>
        {UTILISER_EXEMPLES && (
          <button type="button" className="lien lien--discret" style={{ alignSelf: "center" }}
                  onClick={() => { reinitialiserSimulateur(); seDeconnecter(); }}>
            Réinitialiser la démonstration
          </button>
        )}
      </section>
    </main>
  );
}

function SectionPause({ profil, surMaj }: { profil: ProfilDonneur; surMaj: (p: ProfilDonneur) => void }) {
  const { actualiser } = useDonneur();
  const [duree, setDuree] = useState<number | null | undefined>(undefined);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");

  async function appliquer(enPause: boolean) {
    setEnCours(true); setErreur("");
    try {
      const finPause = enPause && duree
        ? new Date(Date.now() + duree * 86400000).toISOString().slice(0, 10) : null;
      surMaj(await api.mettreEnPause({ enPause, finPause }));
      setDuree(undefined);
      actualiser();
    } catch (p) {
      setErreur(messageDe(p));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="pile">
      <h2 className="section-titre">Alertes</h2>
      {profil.enPause ? (
        <Encadre ton="ocre" icone={<CirclePause size={18} aria-hidden="true" />}>
          <span className="fort">
            Alertes en pause{profil.finPause ? ` jusqu’au ${dateLongue(profil.finPause)}` : ""}
          </span>
          <span>Les centres ne vous préviennent pas pendant ce temps.</span>
          <Bouton compact enCours={enCours} motEnCours="Reprise" onClick={() => appliquer(false)}
                  style={{ alignSelf: "flex-start", marginTop: "var(--e2)" }}>
            Reprendre les alertes
          </Bouton>
        </Encadre>
      ) : (
        <>
          <p className="appui">
            Voyage, maladie, grossesse… Mettez les alertes en pause : vous ne recevrez aucun appel pendant ce temps.
          </p>
          <div className="touches-2" role="group" aria-label="Durée de la pause">
            {DUREES_PAUSE.map((d) => (
              <button key={d.mot} type="button" className="touche" aria-pressed={duree === d.jours}
                      onClick={() => setDuree(d.jours)}>{d.mot}</button>
            ))}
          </div>
          <Bouton variante="secondaire" disabled={duree === undefined} enCours={enCours} motEnCours="Mise en pause"
                  onClick={() => appliquer(true)}>
            Mettre les alertes en pause
          </Bouton>
        </>
      )}
      <MessageErreur>{erreur}</MessageErreur>
    </section>
  );
}

function SectionPreferences({ profil, zones, surMaj }:
  { profil: ProfilDonneur; zones: Zone[]; surMaj: (p: ProfilDonneur) => void }) {
  const [zoneId, setZoneId] = useState(profil.zone.id);
  const [canaux, setCanaux] = useState<Canal[]>(profil.canaux);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [reussite, setReussite] = useState("");

  useEffect(() => { setZoneId(profil.zone.id); setCanaux(profil.canaux); }, [profil]);

  const modifie = zoneId !== profil.zone.id
    || canaux.length !== profil.canaux.length || canaux.some((c) => !profil.canaux.includes(c));

  async function enregistrer() {
    if (canaux.length === 0) return setErreur("Gardez au moins un moyen de contact.");
    setEnCours(true); setErreur(""); setReussite("");
    try {
      surMaj(await api.modifierProfil({ zoneId, canaux }));
      setReussite("Préférences enregistrées.");
    } catch (p) {
      setErreur(messageDe(p));
    } finally {
      setEnCours(false);
    }
  }

  const basculer = (c: Canal) => {
    setReussite("");
    setCanaux(canaux.includes(c) ? canaux.filter((x) => x !== c) : [...canaux, c]);
  };

  return (
    <section className="pile">
      <h2 className="section-titre">Où et comment vous prévenir</h2>
      <ChoixZone zones={zones} valeur={zoneId} surChoix={(id) => { setZoneId(id); setReussite(""); }} />
      <fieldset className="champ" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="champ__etiquette" style={{ padding: 0, marginBottom: "var(--e1)" }}>Moyens de contact</legend>
        <div className="rang-flexible">
          {CANAUX.map(({ cle, mot }) => (
            <button key={cle} type="button" className="touche" aria-pressed={canaux.includes(cle)}
                    onClick={() => basculer(cle)}>{mot}</button>
          ))}
        </div>
      </fieldset>
      <MessageErreur>{erreur}</MessageErreur>
      <MessageReussite>{reussite}</MessageReussite>
      {modifie && (
        <Bouton enCours={enCours} motEnCours="Enregistrement" onClick={enregistrer}>Enregistrer</Bouton>
      )}
    </section>
  );
}

function SectionMotDePasse({ surChange }: { surChange: () => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [ancien, setAncien] = useState("");
  const [nouveau, setNouveau] = useState("");
  const [erreurs, setErreurs] = useState<{ ancien?: string; nouveau?: string; general?: string }>({});
  const [enCours, setEnCours] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    const err: typeof erreurs = {};
    if (!ancien) err.ancien = "Écrivez votre mot de passe actuel.";
    if (nouveau.length < LONGUEUR_MOT_DE_PASSE) err.nouveau = `Au moins ${LONGUEUR_MOT_DE_PASSE} caractères.`;
    setErreurs(err);
    if (Object.keys(err).length) return;
    setEnCours(true);
    try {
      await api.changerMotDePasse({ ancienMotDePasse: ancien, nouveauMotDePasse: nouveau });
      // Le serveur ferme les autres sessions : on se reconnecte avec le nouveau mot de passe.
      surChange();
    } catch (p) {
      setErreurs(p instanceof ErreurApi && p.champ === "ancienMotDePasse" ? { ancien: messageDe(p) } : { general: messageDe(p) });
      setEnCours(false);
    }
  }

  return (
    <section className="pile">
      <h2 className="section-titre">Sécurité</h2>
      {!ouvert ? (
        <Bouton variante="secondaire" onClick={() => setOuvert(true)}>Changer mon mot de passe</Bouton>
      ) : (
        <form className="pile" noValidate onSubmit={envoyer}>
          <ChampMotDePasse etiquette="Mot de passe actuel" valeur={ancien} erreur={erreurs.ancien} surChange={setAncien} />
          <ChampMotDePasse etiquette="Nouveau mot de passe" nouveau montrerForce valeur={nouveau}
                           erreur={erreurs.nouveau} surChange={setNouveau}
                           aide="Vous devrez ensuite vous reconnecter avec ce mot de passe." />
          <MessageErreur>{erreurs.general}</MessageErreur>
          <div className="touches-2">
            <Bouton variante="secondaire" onClick={() => { setOuvert(false); setErreurs({}); }}>Annuler</Bouton>
            <Bouton type="submit" enCours={enCours} motEnCours="Envoi">Changer</Bouton>
          </div>
        </form>
      )}
    </section>
  );
}
