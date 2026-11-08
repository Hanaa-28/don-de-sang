"use client";
/** Connexion d'un agent ou d'un administrateur (e-mail + mot de passe). */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, messageDe } from "@/lib/api";
import { lireAgent, lireJeton, ouvrirSession } from "@/lib/session";

export default function Connexion() {
  const routeur = useRouter();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);

  if (typeof window !== "undefined" && lireJeton()) {
    routeur.replace(lireAgent()?.roles.includes("admin") ? "/admin" : "/agent");
    return null;
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setEnCours(true);
    setErreur("");
    try {
      const session = await api.connexion(email, motDePasse);
      ouvrirSession(session.jeton, session.utilisateur);
      routeur.replace(session.utilisateur.roles.includes("admin") ? "/admin" : "/agent");
    } catch (p) {
      setErreur(messageDe(p));
      setEnCours(false);
    }
  }

  return (
    <main className="acces">
      <div className="acces__carte bloc pile">
        <div className="pile-s">
          <h1 className="titre">Plateforme CNTS</h1>
          <p className="appui">Connectez-vous avec votre e-mail professionnel.</p>
        </div>
        <form className="pile" onSubmit={envoyer}>
          <label className="champ">
            <span className="champ__etiquette">E-mail</span>
            <input
              className="champ__saisie"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErreur(""); }}
              required
            />
          </label>
          <label className="champ">
            <span className="champ__etiquette">Mot de passe</span>
            <input
              className="champ__saisie"
              type="password"
              autoComplete="current-password"
              value={motDePasse}
              onChange={(e) => { setMotDePasse(e.target.value); setErreur(""); }}
              required
            />
          </label>
          {erreur && <p className="message message--erreur">{erreur}</p>}
          <button className="bouton bouton--principal bouton--plein" type="submit" disabled={enCours}>
            {enCours ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}
