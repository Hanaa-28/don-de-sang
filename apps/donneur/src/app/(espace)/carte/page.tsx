"use client";
/**
 * D8 · Carte de donneur.
 * L'écran que le donneur montre à l'agent. Il dit une chose : peut-il donner,
 * et sinon à partir de quand. La goutte bat quand il peut donner.
 * (Fusion : présentation DJIGUI, délai par sexe du prototype CNTS-Registering,
 * calculé par le backend.)
 */
import Link from "next/link";
import { CirclePause, HandHeart } from "lucide-react";
import Goutte from "@/components/Goutte";
import { Cloche, IconeProfil } from "@/components/EnTete";
import { Chargement, ErreurChargement } from "@/components/Etats";
import { Encadre } from "@/components/Messages";
import { api } from "@/lib/api";
import { dateLongue, joursAvant, pluriel } from "@/lib/format";
import { GROUPES_RARES } from "@/lib/regles";
import { useChargement } from "@/lib/useChargement";

export default function Carte() {
  const { donnees: carte, erreur, enCours, recharger } = useChargement(() => api.carte());

  if (enCours && !carte) return <main className="page"><Chargement lignes={3} /></main>;
  if (erreur || !carte) return <main className="page"><ErreurChargement message={erreur} reessayer={recharger} /></main>;

  const jours = carte.prochainDonPossible ? joursAvant(carte.prochainDonPossible) : 0;
  const totalJours = carte.dernierDon && carte.prochainDonPossible
    ? Math.max(1, joursAvant(carte.prochainDonPossible) - joursAvant(carte.dernierDon)) : 1;
  const progression = Math.min(100, Math.max(0, Math.round(((totalJours - jours) / totalJours) * 100)));
  const rare = carte.groupeSanguin && GROUPES_RARES.includes(carte.groupeSanguin);

  return (
    <main>
      <section className="carte-haut">
        <div className="carte-haut__actions"><Cloche clair /><IconeProfil clair /></div>
        <div className="carte-haut__interieur">
          <span className="carte-haut__libelle">Carte de donneur</span>
          <span className="carte-haut__numero">{carte.numeroDonneur}</span>
          <span className="carte-haut__libelle">Montrez ce numéro à l’accueil du centre.</span>
          <span className="carte-haut__nom">{carte.nomComplet}</span>
          <span className="carte-haut__zone">{carte.zone}</span>
        </div>
      </section>

      <div className="carte-corps">
        <Goutte groupe={carte.groupeSanguin} bat={carte.eligible && !carte.enPause} />

        {!carte.groupeSanguin && (
          <p className="appui centre">Votre groupe sanguin sera précisé par le centre lors de votre premier don.</p>
        )}
        {rare && (
          <p className="appui centre">Votre groupe est rare : chacun de vos dons compte particulièrement.</p>
        )}

        {carte.enPause ? (
          <span className="pilule pilule--neutre"><CirclePause size={16} aria-hidden="true" />Alertes en pause</span>
        ) : carte.eligible ? (
          <span className="pilule pilule--seve"><span className="pilule__point" />Vous pouvez donner dès aujourd’hui</span>
        ) : (
          <span className="pilule pilule--ocre"><span className="pilule__point" />Prochain don possible le {dateLongue(carte.prochainDonPossible)}</span>
        )}

        {!carte.eligible && jours > 0 && (
          <div className="compte-a-rebours">
            <div className="rang-espace">
              <span className="fort">Encore {pluriel(jours, "jour")}</span>
              <span className="petit">{progression} % du repos</span>
            </div>
            <div className="compte-a-rebours__barre" role="progressbar" aria-valuenow={progression}
                 aria-valuemin={0} aria-valuemax={100} aria-label="Temps de repos écoulé">
              <span style={{ width: `${progression}%` }} />
            </div>
            <span className="appui">
              Après un don, le corps a besoin de {carte.delaiMois} mois pour refaire ses réserves.
            </span>
          </div>
        )}

        {carte.enPause && (
          <Encadre ton="ocre">
            <span>Vous ne recevez pas d’alerte en ce moment.</span>
            <Link href="/profil" className="lien">Reprendre les alertes</Link>
          </Encadre>
        )}

        <div className="faits">
          <div>
            <span className="faits__valeur">{carte.nombreDons}</span>
            <span className="petit">{carte.nombreDons > 1 ? "dons réalisés" : "don réalisé"}</span>
          </div>
          <div>
            <span className="faits__valeur" style={{ fontSize: "var(--t-corps)" }}>
              {carte.dernierDon ? dateLongue(carte.dernierDon) : "Aucun"}
            </span>
            <span className="petit">dernier don</span>
          </div>
        </div>

        {carte.nombreDons > 0 && (
          <Link href="/historique" className="lien" style={{ alignSelf: "center" }}>
            <HandHeart size={18} aria-hidden="true" />Voir mes dons
          </Link>
        )}

        <p className="petit centre">
          Ces informations sont indicatives. La décision de prélever appartient au personnel
          médical du centre, après examen sur place.
        </p>
      </div>
    </main>
  );
}
