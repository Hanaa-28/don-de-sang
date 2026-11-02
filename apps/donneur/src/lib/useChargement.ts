"use client";
/**
 * Charge une donnée de l'API et expose les trois états qu'un écran doit gérer :
 * chargement, erreur, données. `recharger` relance l'appel (bouton « Réessayer »).
 */
import { useCallback, useEffect, useState } from "react";
import { messageDe } from "./erreurs";

export function useChargement<T>(charger: () => Promise<T>, dependances: unknown[] = []) {
  const [donnees, setDonnees] = useState<T | null>(null);
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const lancer = useCallback(charger, dependances);

  const recharger = useCallback(() => {
    setEnCours(true);
    setErreur("");
    lancer()
      .then(setDonnees)
      .catch((p) => setErreur(messageDe(p)))
      .finally(() => setEnCours(false));
  }, [lancer]);

  useEffect(() => { recharger(); }, [recharger]);

  return { donnees, setDonnees, erreur, enCours, recharger };
}
