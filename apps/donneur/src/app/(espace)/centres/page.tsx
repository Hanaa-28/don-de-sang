"use client";
/**
 * D12 · Centres.
 * Où donner : le CNTS et les sites de collecte, avec horaires, appel direct
 * et itinéraire (ouvre l'application de cartes du téléphone).
 */
import { Building2, Clock, MapPin, Navigation, Phone } from "lucide-react";
import type { Centre } from "@dds/contrat-api";
import EnTete from "@/components/EnTete";
import { Chargement, ErreurChargement, EtatVide } from "@/components/Etats";
import { api } from "@/lib/api";
import { numeroLisible } from "@/lib/format";
import { useChargement } from "@/lib/useChargement";

const TYPE: Record<Centre["type"], string> = { cnts: "Centre de transfusion", site_collecte: "Site de collecte" };

export default function Centres() {
  const { donnees: centres, erreur, enCours, recharger } = useChargement(() => api.centres());

  if (enCours && !centres) return <main className="page"><Chargement /></main>;
  if (erreur || !centres) return <main className="page"><ErreurChargement message={erreur} reessayer={recharger} /></main>;

  return (
    <main className="page pile-l">
      <EnTete titre="Où donner" />

      {centres.length === 0 ? (
        <EtatVide icone={<Building2 size={28} aria-hidden="true" />} titre="Aucun centre pour l’instant">
          <p className="appui">La liste des centres sera publiée par le CNTS.</p>
        </EtatVide>
      ) : (
        <ul className="pile">
          {centres.map((c) => (
            <li key={c.id} className="bloc pile">
              <div className="pile-s" style={{ gap: 2 }}>
                <span className="petit">{TYPE[c.type]}</span>
                <h2 className="lead">{c.nom}</h2>
              </div>
              <div className="pile-s">
                <span className="rang appui" style={{ alignItems: "flex-start", gap: "var(--e2)" }}>
                  <MapPin size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }} />
                  {c.adresse}, {c.ville}
                </span>
                <span className="rang appui" style={{ alignItems: "flex-start", gap: "var(--e2)" }}>
                  <Clock size={16} aria-hidden="true" style={{ flexShrink: 0, marginTop: 3 }} />
                  {c.horaires}
                </span>
              </div>
              <div className="touches-2">
                <a href={`tel:${c.telephone}`} className="bouton bouton--secondaire bouton--compact"
                   aria-label={`Appeler ${c.nom}, ${numeroLisible(c.telephone)}`}>
                  <Phone size={16} aria-hidden="true" />Appeler
                </a>
                <a className="bouton bouton--secondaire bouton--compact" target="_blank" rel="noopener noreferrer"
                   href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${c.nom}, ${c.adresse}, ${c.ville}`)}`}>
                  <Navigation size={16} aria-hidden="true" />Itinéraire
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
