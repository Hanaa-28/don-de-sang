"use client";
/**
 * Connexion de l'espace agent. L'adresse e-mail est l'identifiant
 * (à la différence du donneur, qui se connecte par numéro de téléphone).
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Bouton from "@/components/Bouton";
import { ChampMotDePasse, ChampTexte } from "@/components/Champs";
import { Encadre, MessageErreur } from "@/components/Messages";
import { api, UTILISER_EXEMPLES } from "@/lib/api";
import { messageDe } from "@/lib/erreurs";
import { lireJeton, ouvrirSession } from "@/lib/session";

export default function Connexion() {
  const routeur = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  // Déjà connecté : direction le tableau de bord plutôt que de repasser par l'écran.
  useEffect(() => { if (lireJeton()) routeur.replace("/agent"); }, [routeur]);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return setErreur("Écrivez votre adresse e-mail.");
    if (!motDePasse) return setErreur("Écrivez votre mot de passe.");
    setEnCours(true); setErreur("");
    try {
      const reponse = await api.connexion(email.trim(), motDePasse);
      ouvrirSession(reponse.jeton, {
        id: reponse.utilisateur.id,
        nomComplet: reponse.utilisateur.nomComplet,
        roles: reponse.utilisateur.roles,
        siteId: reponse.utilisateur.siteId,
      });
      routeur.replace("/agent");
    } catch (p) {
      setErreur(messageDe(p));
      setEnCours(false);
    }
  }

  return (
    <main className="acces">
      <div className="acces__corps">
        <div className="acces__entete">
          <h1 className="titre-grand">Plateforme CNTS</h1>
          <p className="appui">Connectez-vous avec votre compte agent.</p>
        </div>

        <form className="pile-l" noValidate onSubmit={envoyer}>
          <ChampTexte etiquette="Adresse e-mail" type="email" autoComplete="username" value={email}
                      onChange={(e) => { setEmail(e.target.value); setErreur(""); }} />
          <ChampMotDePasse etiquette="Mot de passe" valeur={motDePasse}
                           surChange={(v) => { setMotDePasse(v); setErreur(""); }} />
          <MessageErreur>{erreur}</MessageErreur>
          <Bouton type="submit" large enCours={enCours} motEnCours="Connexion">Se connecter</Bouton>
        </form>

        {UTILISER_EXEMPLES && (
          <Encadre ton="ocre">
            <span className="fort">Mode démonstration</span>
            <span>E-mail <span className="chiffres">agent@cnts.bf</span>, mot de passe <span className="chiffres">agent2026</span>.</span>
          </Encadre>
        )}
      </div>
    </main>
  );
}
