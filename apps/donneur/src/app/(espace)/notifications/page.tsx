"use client";
/**
 * D14 · Notifications.
 * Les messages reçus, du plus récent au plus ancien. Toucher un message le
 * marque comme lu et ouvre l'écran concerné (une alerte, la carte…).
 */
import { useRouter } from "next/navigation";
import { Bell, BellRing, CheckCheck, HeartPulse, Info, UserRound } from "lucide-react";
import type { Notification } from "@dds/contrat-api";
import { useDonneur } from "@/components/ContexteDonneur";
import EnTete from "@/components/EnTete";
import { Chargement, ErreurChargement, EtatVide } from "@/components/Etats";
import { api } from "@/lib/api";
import { depuis } from "@/lib/format";
import { useChargement } from "@/lib/useChargement";

const ICONES: Record<Notification["type"], typeof Bell> = {
  alerte: BellRing, eligibilite: HeartPulse, compte: UserRound, info: Info,
};

export default function Notifications() {
  const routeur = useRouter();
  const { actualiser } = useDonneur();
  const { donnees: liste, setDonnees, erreur, enCours, recharger } = useChargement(() => api.notifications());

  if (enCours && !liste) return <main className="page"><Chargement /></main>;
  if (erreur || !liste) return <main className="page"><ErreurChargement message={erreur} reessayer={recharger} /></main>;

  const nonLues = liste.filter((n) => !n.lue).length;

  function marquer(ids?: string[]) {
    setDonnees(liste!.map((n) => (!ids || ids.includes(n.id) ? { ...n, lue: true } : n)));
    api.marquerLues({ ids }).then(actualiser).catch(() => {});
  }

  function ouvrir(n: Notification) {
    if (!n.lue) marquer([n.id]);
    if (n.lien) routeur.push(n.lien);
  }

  return (
    <main className="page pile-l">
      <EnTete titre="Notifications" sansCloche />

      {liste.length === 0 ? (
        <EtatVide icone={<Bell size={28} aria-hidden="true" />} titre="Aucune notification">
          <p className="appui">Les appels des centres et les rappels de don apparaîtront ici.</p>
        </EtatVide>
      ) : (
        <>
          {nonLues > 0 && (
            <button type="button" className="lien" style={{ alignSelf: "flex-end", marginTop: "calc(-1 * var(--e4))" }}
                    onClick={() => marquer()}>
              <CheckCheck size={18} aria-hidden="true" />Tout marquer comme lu
            </button>
          )}
          <ul className="liste">
            {liste.map((n) => {
              const Icone = ICONES[n.type];
              return (
                <li key={n.id}>
                  <button type="button" onClick={() => ouvrir(n)}
                          className={`ligne ligne--bouton${n.lue ? "" : " ligne--non-lue"}`}>
                    <Icone size={22} aria-hidden="true" style={{ color: n.type === "alerte" ? "var(--sang)" : "var(--encre-2)", flexShrink: 0, marginTop: 2 }} />
                    <span className="ligne__corps">
                      <span className="ligne__titre">{n.titre}</span>
                      <span className="appui">{n.message}</span>
                      <span className="petit">{depuis(n.creeLe)}</span>
                    </span>
                    {!n.lue && <span className="ligne__point" aria-label="Non lue" style={{ marginTop: 8 }} />}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
