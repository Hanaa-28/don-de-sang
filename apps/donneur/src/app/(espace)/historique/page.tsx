"use client";
/**
 * D11 · Historique des dons.
 * Le nombre de dons tient lieu de titre : c'est la récompense.
 * Règle CNTS : un ajournement s'affiche sans son motif (confidentialité
 * médicale) ; le motif est expliqué au donneur sur place.
 */
import { HandHeart } from "lucide-react";
import EnTete from "@/components/EnTete";
import Etat from "@/components/Etat";
import { Chargement, ErreurChargement, EtatVide } from "@/components/Etats";
import { api } from "@/lib/api";
import { dateLongue } from "@/lib/format";
import { useChargement } from "@/lib/useChargement";

export default function Historique() {
  const { donnees: passages, erreur, enCours, recharger } = useChargement(() => api.historique());

  if (enCours && !passages) return <main className="page"><Chargement /></main>;
  if (erreur || !passages) return <main className="page"><ErreurChargement message={erreur} reessayer={recharger} /></main>;

  const dons = passages.filter((p) => p.resultat === "apte");
  const premier = dons[dons.length - 1];

  return (
    <main className="page pile-l">
      <EnTete titre="Mes dons" />

      {passages.length === 0 ? (
        <EtatVide icone={<HandHeart size={28} aria-hidden="true" />} titre="Votre premier don apparaîtra ici">
          <p className="appui">
            Chaque passage enregistré par un centre s’ajoute à cette liste. Si vous avez déjà donné
            avant de créer votre compte, ces dons n’y figurent pas.
          </p>
        </EtatVide>
      ) : (
        <>
          <div className="pile-s" style={{ gap: 2 }}>
            <span style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, color: "var(--sang)" }}>{dons.length}</span>
            <span className="lead">{dons.length > 1 ? "dons réalisés" : "don réalisé"}</span>
            {premier && <span className="appui">depuis le {dateLongue(premier.date)}</span>}
          </div>

          <ul className="liste" aria-label="Passages au centre">
            {passages.map((p) => (
              <li key={p.id} className="ligne">
                <div className="ligne__corps">
                  <span className="fort">{dateLongue(p.date)}</span>
                  <span className="petit">{p.centre}</span>
                </div>
                {p.resultat === "apte"
                  ? <Etat ton="seve">Don réalisé</Etat>
                  : <Etat ton="neutre">Ajourné</Etat>}
              </li>
            ))}
          </ul>

          <p className="petit">
            « Ajourné » signifie que le don n’a pas eu lieu ce jour-là. La raison vous a été
            expliquée au centre et n’est pas conservée dans l’application.
            Un passage manque ? Signalez-le à l’accueil du centre concerné.
          </p>
        </>
      )}
    </main>
  );
}
