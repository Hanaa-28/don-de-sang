"use client";
/**
 * Réponse à une alerte, utilisée dans la liste (D9, version courte) et dans
 * le détail (D10, avec créneau et moyen de déplacement).
 *
 * Règles reprises de DJIGUI :
 *  - « Je viens » et « Je ne peux pas » ont le même poids visuel : refuser
 *    doit rester aussi simple qu'accepter, sans reproche ;
 *  - la réponse peut être changée tant que l'alerte est ouverte ;
 *  - répondre n'engage pas : le personnel médical décide sur place.
 */
import { useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Alerte, Creneau, MotifRefus, MoyenDeplacement } from "@dds/contrat-api";
import { api } from "@/lib/api";
import { messageDe } from "@/lib/erreurs";
import { CRENEAUX, MOTIFS_REFUS, MOYENS, libelle } from "@/lib/regles";
import Bouton from "./Bouton";
import Etat from "./Etat";
import { MessageErreur, MessageReussite } from "./Messages";

export function alerteOuverte(a: Alerte) {
  return a.statut === "ouverte" && new Date(a.dateLimite) > new Date();
}

export function etatAlerte(a: Alerte): { ton: "seve" | "ocre" | "neutre"; mot: string } {
  if (a.maReponse === "je_viens") return { ton: "seve", mot: "Vous avez répondu : je viens" };
  if (a.maReponse === "pas_disponible") return { ton: "neutre", mot: `Vous ne pouvez pas venir · ${libelle(MOTIFS_REFUS, a.motifRefus)}` };
  if (!alerteOuverte(a)) return { ton: "neutre", mot: "Délai de réponse passé" };
  return { ton: "ocre", mot: "Votre réponse est attendue" };
}

type Props = { alerte: Alerte; complet?: boolean; surReponse: (a: Alerte) => void };

export default function ReponseAlerte({ alerte, complet, surReponse }: Props) {
  const ouverte = alerteOuverte(alerte);
  const [modifier, setModifier] = useState(false);
  const [choisirMotif, setChoisirMotif] = useState(false);
  const [creneau, setCreneau] = useState<Creneau | null>(alerte.venue?.creneau ?? null);
  const [moyen, setMoyen] = useState<MoyenDeplacement | null>(alerte.venue?.moyen ?? null);
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState("");
  const [reussite, setReussite] = useState("");

  async function envoyer(reponse: Alerte["maReponse"], motif: MotifRefus | null = null, avecVenue = false) {
    if (!reponse) return;
    setEnCours(true); setErreur(""); setReussite("");
    try {
      const maj = await api.repondreAlerte(alerte.id, {
        reponse,
        motifRefus: motif,
        venue: avecVenue ? { creneau, moyen } : reponse === "je_viens" ? alerte.venue : null,
      });
      setModifier(false);
      setChoisirMotif(false);
      if (avecVenue) setReussite("C’est noté. Le centre saura quand vous arrivez.");
      surReponse(maj);
    } catch (p) {
      setErreur(messageDe(p));
    } finally {
      setEnCours(false);
    }
  }

  const { ton, mot } = etatAlerte(alerte);
  const montrerBoutons = ouverte && (!alerte.maReponse || modifier);

  // ---- Choix du motif de refus ----
  if (montrerBoutons && choisirMotif) {
    return (
      <div className="pile-s">
        <span className="champ__etiquette">Qu’est-ce qui vous empêche de venir ?</span>
        <div className="rang-flexible">
          {MOTIFS_REFUS.map((m) => (
            <button key={m.cle} type="button" className="touche" disabled={enCours}
                    onClick={() => envoyer("pas_disponible", m.cle)}>{m.mot}</button>
          ))}
        </div>
        <button type="button" className="lien lien--discret" style={{ alignSelf: "flex-start" }}
                onClick={() => setChoisirMotif(false)}>Annuler</button>
        <MessageErreur>{erreur}</MessageErreur>
      </div>
    );
  }

  // ---- Les deux réponses ----
  if (montrerBoutons) {
    return (
      <div className="pile-s">
        <div className="reponses">
          <Bouton enCours={enCours} motEnCours="Envoi" onClick={() => envoyer("je_viens")}>Je viens</Bouton>
          <Bouton variante="secondaire" disabled={enCours} onClick={() => setChoisirMotif(true)}>Je ne peux pas</Bouton>
        </div>
        {complet && (
          <p className="petit centre">Répondre ne vous engage pas : le personnel médical décidera sur place.</p>
        )}
        {modifier && (
          <button type="button" className="lien lien--discret" style={{ alignSelf: "flex-start" }}
                  onClick={() => setModifier(false)}>Garder ma réponse</button>
        )}
        <MessageErreur>{erreur}</MessageErreur>
      </div>
    );
  }

  // ---- Réponse déjà donnée ----
  return (
    <div className="pile">
      <Etat ton={ton}>{mot}</Etat>

      {alerte.maReponse === "je_viens" && !complet && (
        alerte.venue?.creneau ? (
          <span className="appui">Créneau : {libelle(CRENEAUX, alerte.venue.creneau)}.</span>
        ) : ouverte ? (
          <Link href={`/alertes/${alerte.id}`} className="lien" style={{ fontSize: "var(--t-appui)" }}>
            Indiquer mon heure d’arrivée <ChevronRight size={16} aria-hidden="true" />
          </Link>
        ) : null
      )}

      {alerte.maReponse === "je_viens" && complet && ouverte && (
        <div className="pile bloc">
          <div className="pile-s">
            <span className="fort">Quand pensez-vous passer ?</span>
            <span className="appui">Facultatif, mais cela aide le centre à vous accueillir.</span>
          </div>
          <div className="rang-flexible" role="group" aria-label="Créneau">
            {CRENEAUX.map((c) => (
              <button key={c.cle} type="button" className="touche chiffres" aria-pressed={creneau === c.cle}
                      onClick={() => setCreneau(creneau === c.cle ? null : c.cle)}>{c.mot}</button>
            ))}
          </div>
          <span className="champ__etiquette">Comment viendrez-vous ?</span>
          <div className="rang-flexible" role="group" aria-label="Moyen de déplacement">
            {MOYENS.map((m) => (
              <button key={m.cle} type="button" className="touche" aria-pressed={moyen === m.cle}
                      onClick={() => setMoyen(moyen === m.cle ? null : m.cle)}>{m.mot}</button>
            ))}
          </div>
          <Bouton variante="secondaire" enCours={enCours} motEnCours="Enregistrement"
                  disabled={!creneau && !moyen} onClick={() => envoyer("je_viens", null, true)}>
            Enregistrer mon passage
          </Bouton>
          <MessageReussite>{reussite}</MessageReussite>
        </div>
      )}

      {alerte.maReponse === "pas_disponible" && (
        <span className="appui">Merci de nous avoir prévenus. Ce sera pour une prochaine fois.</span>
      )}

      {ouverte && alerte.maReponse && (
        <button type="button" className="lien lien--discret" style={{ alignSelf: "flex-start" }}
                onClick={() => setModifier(true)}>Changer ma réponse</button>
      )}
      <MessageErreur>{erreur}</MessageErreur>
    </div>
  );
}
