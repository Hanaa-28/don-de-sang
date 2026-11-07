"use client";
/**
 * Gabarit de l'espace agent. Sans session, retour à la connexion. Le
 * vrai contrôle des droits reste fait par le backend à chaque appel.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RailAgent from "@/components/RailAgent";
import { lireAgent, lireJeton, type AgentSession } from "@/lib/session";

export default function GabaritAgent({ children }: { children: React.ReactNode }) {
  const routeur = useRouter();
  const [agent, setAgent] = useState<AgentSession | null>(null);

  useEffect(() => {
    const session = lireAgent();
    if (!lireJeton() || !session) { routeur.replace("/"); return; }
    setAgent(session);
  }, [routeur]);

  if (!agent) return null;

  return (
    <div className="cadre-pro">
      <RailAgent agent={agent} />
      <main className="contenu-pro">{children}</main>
    </div>
  );
}
