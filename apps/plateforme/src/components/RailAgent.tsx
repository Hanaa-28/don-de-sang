"use client";
/**
 * Rail de navigation de l'espace agent (desktop, à la différence de la
 * barre du bas de l'application des donneurs). Les sections à venir
 * restent visibles, grisées : elles donnent à l'équipe une vue du
 * chemin complet jusqu'à P10, sans faire croire qu'elles marchent déjà.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Megaphone, HeartHandshake, FlaskConical, TestTube,
  Package, Truck, Search, ClipboardCheck, LogOut,
} from "lucide-react";
import { fermerSession, type AgentSession } from "@/lib/session";

const SECTIONS = [
  { adresse: "/agent", mot: "Tableau de bord", Icone: LayoutDashboard, pret: true },
  { adresse: "/agent/alertes", mot: "Alertes (P7)", Icone: Megaphone, pret: false },
  { adresse: "/agent/prelevement", mot: "Prélèvement (P3)", Icone: HeartHandshake, pret: false },
  { adresse: "/agent/laboratoire", mot: "Laboratoire (P4)", Icone: FlaskConical, pret: false },
  { adresse: "/agent/preparation", mot: "Préparation (P5)", Icone: TestTube, pret: false },
  { adresse: "/agent/stock", mot: "Stock (P6)", Icone: Package, pret: false },
  { adresse: "/agent/distribution", mot: "Distribution (P8)", Icone: Truck, pret: false },
  { adresse: "/agent/tracabilite", mot: "Traçabilité (P9)", Icone: Search, pret: false },
  { adresse: "/agent/delivrance", mot: "Délivrance (P10)", Icone: ClipboardCheck, pret: false },
];

export default function RailAgent({ agent }: { agent: AgentSession }) {
  const chemin = usePathname();
  return (
    <nav className="rail" aria-label="Navigation">
      <div className="rail__entete">
        <span className="mot-ecrit">DJIGUI</span>
        <span className="petit">Plateforme CNTS</span>
      </div>

      <div className="rail__sections">
        {SECTIONS.map(({ adresse, mot, Icone, pret }) => {
          const actif = pret && (chemin === adresse || chemin.startsWith(`${adresse}/`));
          if (!pret) {
            return (
              <span key={adresse} className="rail__lien rail__lien--a-venir" aria-disabled="true">
                <Icone size={18} strokeWidth={1.75} aria-hidden="true" />
                <span>{mot}</span>
                <span className="rail__etiquette-venir">à venir</span>
              </span>
            );
          }
          return (
            <Link key={adresse} href={adresse} className="rail__lien" aria-current={actif ? "page" : undefined}>
              <Icone size={18} strokeWidth={actif ? 2.2 : 1.75} aria-hidden="true" />
              <span>{mot}</span>
            </Link>
          );
        })}
      </div>

      <div className="rail__pied">
        <div className="pile-s">
          <span className="fort">{agent.nomComplet}</span>
          <span className="petit">{agent.roles.join(", ")}</span>
        </div>
        <button type="button" className="rail__lien" onClick={() => { fermerSession(); window.location.assign("/"); }}>
          <LogOut size={18} strokeWidth={1.75} aria-hidden="true" />
          <span>Se déconnecter</span>
        </button>
      </div>
    </nav>
  );
}
