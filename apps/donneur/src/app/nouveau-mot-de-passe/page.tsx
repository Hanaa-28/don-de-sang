"use client";
/**
 * D7 · Nouveau mot de passe.
 * Le code reçu par WhatsApp + le nouveau mot de passe. Toutes les sessions
 * ouvertes sont fermées : le donneur se reconnecte avec le nouveau mot de passe.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleCheck } from "lucide-react";
import Bouton from "@/components/Bouton";
import { ChampCode, ChampMotDePasse } from "@/components/Champs";
import { MessageErreur } from "@/components/Messages";
import RenvoiCode from "@/components/RenvoiCode";
import { api } from "@/lib/api";
import { ErreurApi, messageDe } from "@/lib/erreurs";
import { numeroLisible } from "@/lib/format";
import { LONGUEUR_CODE, LONGUEUR_MOT_DE_PASSE } from "@/lib/regles";
import { fermerSession, lireVerification, oublierVerification, type VerificationEnCours } from "@/lib/session";

export default function NouveauMotDePasse() {
  const routeur = useRouter();
  const [verification, setVerification] = useState<VerificationEnCours | null>(null);
  const [code, setCode] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreurs, setErreurs] = useState<{ code?: string; motDePasse?: string; confirmation?: string; general?: string }>({});
  const [enCours, setEnCours] = useState(false);
  const [termine, setTermine] = useState(false);

  useEffect(() => {
    const v = lireVerification();
    if (!v || v.objet !== "mot_de_passe") routeur.replace("/mot-de-passe-oublie");
    else setVerification(v);
  }, [routeur]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!verification) return;
    const err: typeof erreurs = {};
    if (code.length !== LONGUEUR_CODE) err.code = "Saisissez les six chiffres du code.";
    if (motDePasse.length < LONGUEUR_MOT_DE_PASSE) err.motDePasse = `Au moins ${LONGUEUR_MOT_DE_PASSE} caractères.`;
    else if (motDePasse !== confirmation) err.confirmation = "Les deux mots de passe ne sont pas identiques.";
    setErreurs(err);
    if (Object.keys(err).length) return;

    setEnCours(true);
    try {
      await api.nouveauMotDePasse({ telephone: verification.telephone, code, motDePasse });
      oublierVerification();
      fermerSession();
      setTermine(true);
    } catch (p) {
      const champCode = p instanceof ErreurApi && p.champ === "code";
      setErreurs(champCode ? { code: messageDe(p) } : { general: messageDe(p) });
      if (champCode) setCode("");
      setEnCours(false);
    }
  }

  if (termine) {
    return (
      <main className="acces">
        <div className="acces__corps" style={{ alignItems: "center", textAlign: "center" }}>
          <span className="etat-vide__icone" style={{ background: "var(--seve-clair)", color: "var(--seve)" }}>
            <CircleCheck size={30} aria-hidden="true" />
          </span>
          <div className="pile-s">
            <h1 className="titre-grand">Mot de passe changé</h1>
            <p className="appui">Connectez-vous avec votre nouveau mot de passe.</p>
          </div>
          <Link href="/connexion" className="bouton bouton--principal bouton--large">Se connecter</Link>
        </div>
      </main>
    );
  }

  if (!verification) return null;

  return (
    <main className="acces">
      <Link href="/mot-de-passe-oublie" className="lien retour"><ArrowLeft size={18} aria-hidden="true" />Retour</Link>

      <div className="acces__entete">
        <h1 className="titre-grand">Nouveau mot de passe</h1>
        <p className="appui">
          Si ce numéro a un compte, un code vient de partir sur WhatsApp au{" "}
          <span className="chiffres fort" style={{ color: "var(--encre)" }}>+226 {numeroLisible(verification.telephone)}</span>.
        </p>
      </div>

      <form className="pile-l" noValidate onSubmit={envoyer}>
        <ChampCode valeur={code} erreur={erreurs.code} surChange={(v) => { setCode(v); setErreurs((a) => ({ ...a, code: undefined })); }} />
        <ChampMotDePasse etiquette="Nouveau mot de passe" nouveau montrerForce valeur={motDePasse}
                         erreur={erreurs.motDePasse} aide={`Au moins ${LONGUEUR_MOT_DE_PASSE} caractères.`}
                         surChange={(v) => { setMotDePasse(v); setErreurs((a) => ({ ...a, motDePasse: undefined })); }} />
        <ChampMotDePasse etiquette="Écrivez-le à nouveau" nouveau valeur={confirmation} erreur={erreurs.confirmation}
                         surChange={(v) => { setConfirmation(v); setErreurs((a) => ({ ...a, confirmation: undefined })); }} />
        <MessageErreur>{erreurs.general}</MessageErreur>
        <Bouton type="submit" large enCours={enCours} motEnCours="Enregistrement">Enregistrer le mot de passe</Bouton>
      </form>

      <RenvoiCode verification={verification} surRenvoi={setVerification} />
    </main>
  );
}
