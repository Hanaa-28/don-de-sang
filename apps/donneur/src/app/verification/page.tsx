"use client";
/**
 * D4 · Vérification du numéro.
 * Le code à six chiffres arrive par WhatsApp. Dès que les six chiffres
 * sont saisis, il est envoyé : le donneur n'a rien d'autre à toucher.
 * Code bon → compte vérifié, session ouverte, carte de donneur (D8).
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Bouton from "@/components/Bouton";
import { ChampCode } from "@/components/Champs";
import RenvoiCode from "@/components/RenvoiCode";
import { api } from "@/lib/api";
import { messageDe } from "@/lib/erreurs";
import { numeroLisible } from "@/lib/format";
import { LONGUEUR_CODE } from "@/lib/regles";
import { lireVerification, ouvrirSession, oublierVerification, type VerificationEnCours } from "@/lib/session";

export default function Verification() {
  const routeur = useRouter();
  const [verification, setVerification] = useState<VerificationEnCours | null>(null);
  const [code, setCode] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  useEffect(() => {
    const v = lireVerification();
    if (!v || v.objet !== "inscription") routeur.replace("/inscription");
    else setVerification(v);
  }, [routeur]);

  async function valider(saisie = code) {
    if (!verification || saisie.length !== LONGUEUR_CODE || enCours) return;
    setEnCours(true); setErreur("");
    try {
      const session = await api.verification(verification.telephone, saisie);
      ouvrirSession(session.jeton, session.utilisateur.nomComplet);
      oublierVerification();
      routeur.replace("/carte");
    } catch (p) {
      setErreur(messageDe(p));
      setCode("");
      setEnCours(false);
    }
  }

  if (!verification) return null;

  return (
    <main className="acces">
      <Link href="/inscription" className="lien retour"><ArrowLeft size={18} aria-hidden="true" />Modifier mon numéro</Link>

      <div className="acces__corps">
        <div className="acces__entete">
          <span className="etat-vide__icone" style={{ width: 52, height: 52 }}>
            <MessageCircle size={26} aria-hidden="true" />
          </span>
          <h1 className="titre-grand">Vérifiez votre numéro</h1>
          <p className="appui">
            Nous avons envoyé un code sur WhatsApp au{" "}
            <span className="chiffres fort" style={{ color: "var(--encre)" }}>+226 {numeroLisible(verification.telephone)}</span>.
          </p>
        </div>

        <form className="pile-l" onSubmit={(e) => { e.preventDefault(); valider(); }}>
          <ChampCode valeur={code} erreur={erreur} desactive={enCours}
                     surChange={(v) => { setCode(v); setErreur(""); if (v.length === LONGUEUR_CODE) valider(v); }} />
          <Bouton type="submit" large enCours={enCours} motEnCours="Vérification" disabled={code.length !== LONGUEUR_CODE}>
            Vérifier
          </Bouton>
        </form>

        <RenvoiCode verification={verification} surRenvoi={setVerification} />
      </div>
    </main>
  );
}
