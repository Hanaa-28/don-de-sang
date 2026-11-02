import type { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import Bouton from "./Bouton";
import { MessageErreur } from "./Messages";

/** Lignes grises pendant le chargement : la page garde sa forme. */
export function Chargement({ lignes = 4 }: { lignes?: number }) {
  return (
    <div className="pile" aria-busy="true" aria-label="Chargement">
      <div className="squelette" style={{ height: 28, width: "55%" }} />
      {Array.from({ length: lignes }, (_, i) => (
        <div key={i} className="squelette" style={{ height: 72 }} />
      ))}
    </div>
  );
}

/** Erreur de chargement : dire quoi faire, proposer de réessayer. */
export function ErreurChargement({ message, reessayer }: { message: string; reessayer: () => void }) {
  return (
    <div className="pile" style={{ paddingTop: "var(--e6)" }}>
      <MessageErreur>{message}</MessageErreur>
      <Bouton variante="secondaire" onClick={reessayer} icone={<RefreshCw size={16} aria-hidden="true" />}>
        Réessayer
      </Bouton>
    </div>
  );
}

/** Écran vide : une invitation à agir, pas un constat. */
export function EtatVide({ icone, titre, children }: { icone: ReactNode; titre: string; children?: ReactNode }) {
  return (
    <div className="etat-vide">
      <span className="etat-vide__icone">{icone}</span>
      <h2 className="lead">{titre}</h2>
      {children}
    </div>
  );
}
