"use client";
/**
 * D6 · Mot de passe oublié.
 * Le donneur donne son numéro ; un code part par WhatsApp (suite en D7).
 * La réponse est la même que le numéro soit inscrit ou non : on ne révèle
 * pas qui a un compte.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import Bouton from "@/components/Bouton";
import { ChampTelephone } from "@/components/Champs";
import { Encadre } from "@/components/Messages";
import { api } from "@/lib/api";
import { messageDe } from "@/lib/erreurs";
import { numeroInternational } from "@/lib/format";
import { numeroValide } from "@/lib/regles";
import { memoriserVerification } from "@/lib/session";

export default function MotDePasseOublie() {
  const routeur = useRouter();
  const [telephone, setTelephone] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!numeroValide(telephone)) return setErreur("Le numéro doit compter 8 chiffres.");
    setEnCours(true); setErreur("");
    const numero = numeroInternational(telephone);
    try {
      const envoi = await api.motDePasseOublie(numero);
      memoriserVerification({
        telephone: numero, objet: "mot_de_passe",
        renvoiPossibleLe: Date.now() + envoi.renvoiPossibleDans * 1000,
        expireLe: Date.now() + envoi.expireDans * 1000,
      });
      routeur.push("/nouveau-mot-de-passe");
    } catch (p) {
      setErreur(messageDe(p));
      setEnCours(false);
    }
  }

  return (
    <main className="acces">
      <Link href="/connexion" className="lien retour"><ArrowLeft size={18} aria-hidden="true" />Retour à la connexion</Link>

      <div className="acces__corps">
        <div className="acces__entete">
          <h1 className="titre-grand">Mot de passe oublié</h1>
          <p className="appui">
            Écrivez le numéro de votre compte. Nous vous enverrons un code sur WhatsApp
            pour choisir un nouveau mot de passe.
          </p>
        </div>

        <form className="pile-l" noValidate onSubmit={envoyer}>
          <ChampTelephone etiquette="Numéro de téléphone" valeur={telephone} autoComplete="username"
                          valide={numeroValide(telephone)} erreur={erreur}
                          surChange={(v) => { setTelephone(v); setErreur(""); }} />
          <Bouton type="submit" large enCours={enCours} motEnCours="Envoi du code">Recevoir un code</Bouton>
        </form>

        <Encadre icone={<Building2 size={18} aria-hidden="true" />}>
          <span className="fort">Plus d’accès à ce numéro WhatsApp ?</span>
          <span>
            Passez à l’accueil de votre centre avec une pièce d’identité : un agent peut
            réinitialiser votre mot de passe.
          </span>
        </Encadre>
      </div>
    </main>
  );
}
