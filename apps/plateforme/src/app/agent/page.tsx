"use client";
/**
 * Tableau de bord de l'espace agent (P6, provisoire — voir le
 * commentaire sur TableauDeBordAgent dans packages/contrat-api).
 */
import { useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import type { NiveauStock, TableauDeBordAgent } from "@dds/contrat-api";
import BlocGroupe from "@/components/BlocGroupe";
import { Encadre, MessageErreur } from "@/components/Messages";
import { api } from "@/lib/api";
import { messageDe } from "@/lib/erreurs";
import { depuis, pluriel } from "@/lib/format";

const MOT_NIVEAU: Record<NiveauStock, string> = {
  normal: "Normal", bas: "Bas", critique: "Critique", en_attente: "En attente de premier don",
};
const TON_NIVEAU: Record<NiveauStock, "seve" | "ocre" | "sang" | "neutre"> = {
  normal: "seve", bas: "ocre", critique: "sang", en_attente: "neutre",
};

export default function TableauDeBordAgentEcran() {
  const [tableau, setTableau] = useState<TableauDeBordAgent | null>(null);
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    api.tableauDeBord().then(setTableau).catch((p) => setErreur(messageDe(p)));
  }, []);

  return (
    <div className="pile-l">
      <div className="entete">
        <h1 className="entete__titre">Tableau de bord</h1>
        {tableau && <span className="appui">{tableau.site.nom}</span>}
      </div>

      <MessageErreur>{erreur}</MessageErreur>

      {!tableau ? (
        !erreur && <p className="appui">Chargement…</p>
      ) : (
        <>
          {tableau.nbCritiques > 0 && (
            <Encadre ton="sang" icone={<TriangleAlert size={18} aria-hidden="true" />}>
              <span className="fort">
                {pluriel(tableau.nbCritiques, "groupe")} au niveau critique.
              </span>
              <span>Une alerte aux donneurs peut être lancée dès que cet écran sera disponible (P7).</span>
            </Encadre>
          )}

          <div className="grille-stock">
            {tableau.stock.map((ligne) => (
              <div key={ligne.groupeSanguin} className="carte-stock">
                <BlocGroupe groupe={ligne.groupeSanguin} taille="m" />
                <div className="pile-s" style={{ flex: 1 }}>
                  <span className="lead">{pluriel(ligne.pochesDisponibles, "poche")}</span>
                  <span className={`pilule pilule--${TON_NIVEAU[ligne.niveau]}`}>
                    <span className="pilule__point" aria-hidden="true" />
                    {MOT_NIVEAU[ligne.niveau]}
                  </span>
                  <span className="petit">
                    {ligne.dernierMouvement ? `Dernier mouvement ${depuis(ligne.dernierMouvement)}` : "Aucun mouvement"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
