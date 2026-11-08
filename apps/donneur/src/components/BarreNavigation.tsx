"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Building2, HandHeart, IdCard, Tent } from "lucide-react";
import { useDonneur } from "./ContexteDonneur";

const SECTIONS = [
  { adresse: "/carte", mot: "Ma carte", Icone: IdCard },
  { adresse: "/alertes", mot: "Alertes", Icone: Bell },
  { adresse: "/historique", mot: "Mes dons", Icone: HandHeart },
  { adresse: "/centres", mot: "Centres", Icone: Building2 },
  { adresse: "/campagnes", mot: "Collectes", Icone: Tent },
];

/**
 * Barre du bas : les cinq sections, toujours à portée du pouce.
 * Le profil se rejoint par l'icône en haut de chaque écran (comme dans DJIGUI).
 */
export default function BarreNavigation() {
  const chemin = usePathname();
  const { alertesEnAttente } = useDonneur();
  return (
    <nav className="barre-nav" aria-label="Sections">
      <div className="barre-nav__interieur">
        {SECTIONS.map(({ adresse, mot, Icone }) => {
          const actif = chemin === adresse || chemin.startsWith(`${adresse}/`);
          return (
            <Link key={adresse} href={adresse} aria-current={actif ? "page" : undefined}>
              <Icone size={22} strokeWidth={actif ? 2.2 : 1.7} aria-hidden="true" />
              <span>{mot}</span>
              {adresse === "/alertes" && alertesEnAttente > 0 && (
                <span className="barre-nav__point" aria-label={`${alertesEnAttente} en attente de réponse`} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
