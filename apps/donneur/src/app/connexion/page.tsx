"use client";
/**
 * D5 · Connexion. Le numéro de téléphone est l'identifiant.
 */
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Bouton from "@/components/Bouton";
import { ChampMotDePasse, ChampTelephone } from "@/components/Champs";
import { Encadre, MessageErreur } from "@/components/Messages";
import { api, UTILISER_EXEMPLES } from "@/lib/api";
import { messageDe } from "@/lib/erreurs";
import { numeroInternational } from "@/lib/format";
import { numeroValide } from "@/lib/regles";
import { ouvrirSession } from "@/lib/session";

export default function Connexion() {
  const routeur = useRouter();
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  const telValide = numeroValide(telephone);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!telValide) return setErreur("Le numéro doit compter 8 chiffres.");
    if (!motDePasse) return setErreur("Écrivez votre mot de passe.");
    setEnCours(true); setErreur("");
    try {
      const session = await api.connexion(numeroInternational(telephone), motDePasse);
      ouvrirSession(session.jeton, session.utilisateur.nomComplet);
      routeur.replace("/carte");
    } catch (p) {
      setErreur(messageDe(p));
      setEnCours(false);
    }
  }

  return (
    <main className="acces">
      <Link href="/bienvenue" className="lien retour"><ArrowLeft size={18} aria-hidden="true" />Retour</Link>

      <div className="acces__corps">
        <div className="acces__entete">
          <h1 className="titre-grand">Heureux de vous revoir</h1>
          <p className="appui">Connectez-vous avec le numéro donné à l’inscription.</p>
        </div>

        <form className="pile-l" noValidate onSubmit={envoyer}>
          <ChampTelephone etiquette="Numéro de téléphone" autoComplete="username" valeur={telephone}
                          valide={telValide} surChange={(v) => { setTelephone(v); setErreur(""); }} />
          <div className="pile-s">
            <ChampMotDePasse etiquette="Mot de passe" valeur={motDePasse}
                             surChange={(v) => { setMotDePasse(v); setErreur(""); }} />
            <Link href="/mot-de-passe-oublie" className="lien" style={{ alignSelf: "flex-end", fontSize: "var(--t-appui)" }}>
              Mot de passe oublié ?
            </Link>
          </div>
          <MessageErreur>{erreur}</MessageErreur>
          <Bouton type="submit" large enCours={enCours} motEnCours="Connexion">Se connecter</Bouton>
        </form>

        {UTILISER_EXEMPLES && (
          <Encadre ton="ocre">
            <span className="fort">Mode démonstration</span>
            <span>Numéro <span className="chiffres">70 00 00 01</span>, mot de passe <span className="chiffres">donneur2026</span>.</span>
          </Encadre>
        )}

        <p className="appui centre">
          Pas encore inscrit ? <Link href="/inscription" className="lien">Créer un compte</Link>
        </p>
      </div>
    </main>
  );
}
