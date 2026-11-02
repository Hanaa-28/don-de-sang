/**
 * C0 · Organiser une collecte (page publique, sans compte).
 * Une école, une association, un groupe de jeunes… propose une séance de
 * collecte au CNTS, qui l'accepte ou non et envoie son équipe mobile
 * récolter les poches. Repris de la page « Demandes » de CNTS-Registering.
 */
import Link from "next/link";
import { Search, Tent } from "lucide-react";
import RetourPrecedent from "@/components/RetourPrecedent";
import { DELAI_MIN_CAMPAGNE_JOURS, PARTICIPANTS_MINIMUM } from "@/lib/regles";

export const metadata = { title: "Organiser une collecte" };

const ETAPES = [
  { titre: "Vous proposez une date et un lieu", detail: "Quelques minutes suffisent. Vous recevez une référence pour suivre votre demande." },
  { titre: "Le CNTS étudie et vous rappelle", detail: "Il confirme la date, l’heure et le nombre de poches visé, ou vous propose une autre date." },
  { titre: "L’équipe mobile vient prélever", detail: "Elle apporte tout le matériel médical. Vous accueillez les donneurs." },
];

export default function Campagnes() {
  return (
    <main className="page page--sans-barre pile-l">
      <RetourPrecedent masquerSiConnecte />

      <div className="pile-s">
        <span className="etat-vide__icone" style={{ width: 56, height: 56 }}><Tent size={28} aria-hidden="true" /></span>
        <h1 className="titre-grand">Organiser une collecte de sang</h1>
        <p className="appui">
          École, université, association, entreprise, groupe de jeunes ou communauté :
          proposez une collecte dans vos locaux, le CNTS se déplace.
        </p>
      </div>

      <ol className="etapes" aria-label="Comment ça se passe">
        {ETAPES.map((e, i) => (
          <li key={e.titre}>
            <span className="etapes__numero" aria-hidden="true">{i + 1}</span>
            <div className="pile-s" style={{ gap: 2 }}>
              <span className="fort">{e.titre}</span>
              <span className="appui">{e.detail}</span>
            </div>
          </li>
        ))}
      </ol>

      <div className="encadre">
        <div className="pile-s">
          <span className="fort">Avant de proposer</span>
          <span>Faites la demande au moins {DELAI_MIN_CAMPAGNE_JOURS} jours à l’avance.</span>
          <span>Prévoyez au moins {PARTICIPANTS_MINIMUM} donneurs volontaires, âgés de 18 ans ou plus.</span>
          <span>Prévoyez un endroit à l’ombre, avec un coin calme pour l’entretien médical.</span>
        </div>
      </div>

      <div className="pile">
        <Link href="/campagnes/proposer" className="bouton bouton--principal bouton--large">Proposer une collecte</Link>
        <Link href="/campagnes/suivi" className="bouton bouton--secondaire bouton--large">
          <Search size={18} aria-hidden="true" />Suivre ma demande
        </Link>
      </div>

      <p className="petit centre">Le CNTS reste seul à décider des collectes qu’il programme.</p>
    </main>
  );
}
