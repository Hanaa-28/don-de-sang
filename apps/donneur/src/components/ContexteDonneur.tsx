"use client";
/**
 * Compteurs partagés par les écrans connectés : notifications non lues
 * (cloche de l'en-tête) et alertes qui attendent une réponse (point sur
 * l'onglet Alertes). Un écran qui change l'un des deux appelle actualiser().
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

type Compteurs = { nonLues: number; alertesEnAttente: number; actualiser: () => void };

const Contexte = createContext<Compteurs>({ nonLues: 0, alertesEnAttente: 0, actualiser: () => {} });

export function FournisseurDonneur({ children }: { children: ReactNode }) {
  const [nonLues, setNonLues] = useState(0);
  const [alertesEnAttente, setAlertesEnAttente] = useState(0);

  const actualiser = useCallback(() => {
    api.notifications().then((l) => setNonLues(l.filter((n) => !n.lue).length)).catch(() => {});
    api.alertes()
      .then((l) => setAlertesEnAttente(
        l.filter((a) => a.statut === "ouverte" && !a.maReponse && new Date(a.dateLimite) > new Date()).length))
      .catch(() => {});
  }, []);

  useEffect(() => { actualiser(); }, [actualiser]);

  return <Contexte.Provider value={{ nonLues, alertesEnAttente, actualiser }}>{children}</Contexte.Provider>;
}

export const useDonneur = () => useContext(Contexte);
