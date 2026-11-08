"use client";
/**
 * C2 · Suivre une demande de collecte (page publique).
 * Référence + numéro du responsable : le CNTS a-t-il accepté, pour quand,
 * avec quel objectif de poches, et qui contacter.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import type { DemandeCampagne } from "@dds/contrat-api";
import Bouton from "@/components/Bouton";
import { ChampTelephone, ChampTexte } from "@/components/Champs";
import Etat from "@/components/Etat";
import { Encadre, MessageErreur } from "@/components/Messages";
import RetourPrecedent from "@/components/RetourPrecedent";
import { api, UTILISER_EXEMPLES } from "@/lib/api";
import { messageDe } from "@/lib/erreurs";
import { dateLongue, numeroInternational, numeroLisible } from "@/lib/format";
import { MOMENTS, STATUTS_DEMANDE, libelle, numeroValide } from "@/lib/regles";
import { CLE_DERNIERE_DEMANDE } from "@/lib/session";

export default function SuiviDemande() {
  const [reference, setReference] = useState("");
  const [telephone, setTelephone] = useState("");
  const [erreur, setErreur] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [demande, setDemande] = useState<DemandeCampagne | null>(null);

  // Si la demande vient d'être envoyée depuis ce téléphone, on pré-remplit.
  useEffect(() => {
    const brut = window.sessionStorage.getItem(CLE_DERNIERE_DEMANDE);
    if (!brut) return;
    const d = JSON.parse(brut) as { reference: string; telephone: string };
    setReference(d.reference);
    setTelephone(numeroLisible(d.telephone));
  }, []);

  async function chercher(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) return setErreur("Écrivez la référence reçue à l’envoi de la demande.");
    if (!numeroValide(telephone)) return setErreur("Le numéro doit compter 8 chiffres.");
    setEnCours(true); setErreur("");
    try {
      setDemande(await api.suivreDemandeCampagne({ reference: reference.trim(), telephone: numeroInternational(telephone) }));
    } catch (p) {
      setErreur(messageDe(p));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <main className="page page--sans-barre pile-l">
      <RetourPrecedent secours="/campagnes" />
      <div className="pile-s">
        <h1 className="titre-grand">Suivre ma demande</h1>
        <p className="appui">La référence figure sur l’écran de confirmation, sous la forme CAMP-2026-0000.</p>
      </div>

      {!demande ? (
        <form className="pile-l" noValidate onSubmit={chercher}>
          <ChampTexte etiquette="Référence" value={reference} placeholder="CAMP-2026-0000" autoCapitalize="characters"
                      className="champ__saisie chiffres" onChange={(e) => { setReference(e.target.value.toUpperCase()); setErreur(""); }} />
          <ChampTelephone etiquette="Numéro du responsable" valeur={telephone} valide={numeroValide(telephone)}
                          surChange={(v) => { setTelephone(v); setErreur(""); }} />
          <MessageErreur>{erreur}</MessageErreur>
          <Bouton type="submit" large enCours={enCours} motEnCours="Recherche">Voir où en est ma demande</Bouton>
          {UTILISER_EXEMPLES && (
            <Encadre ton="ocre">
              <span className="fort">Mode démonstration</span>
              <span>Exemple de demande acceptée : <span className="chiffres">CAMP-2026-0007</span> et <span className="chiffres">70 11 22 33</span>.</span>
            </Encadre>
          )}
        </form>
      ) : (
        <Resultat demande={demande} surAutre={() => setDemande(null)} />
      )}
    </main>
  );
}

function Resultat({ demande, surAutre }: { demande: DemandeCampagne; surAutre: () => void }) {
  const statut = STATUTS_DEMANDE[demande.statut];
  const r = demande.reponseCnts;
  return (
    <div className="pile-l">
      <div className="bloc pile">
        <div className="pile-s" style={{ gap: 2 }}>
          <span className="petit chiffres">{demande.reference}</span>
          <h2 className="lead">{demande.structure}</h2>
          <span className="appui">{demande.lieu}, {demande.zone.nom}</span>
          <span className="appui">
            Souhaitée le {dateLongue(demande.dateSouhaitee)}, {libelle(MOMENTS, demande.moment).toLowerCase()} · {demande.participantsAttendus} donneurs attendus
          </span>
        </div>
        <Etat ton={statut.ton}>{statut.mot}</Etat>
      </div>

      {demande.statut === "en_attente" && (
        <p className="appui">
          Le CNTS étudie votre demande, envoyée le {dateLongue(demande.creeLe)}. Il rappellera {demande.responsable} au{" "}
          <span className="chiffres">+226 {numeroLisible(demande.telephone)}</span>.
        </p>
      )}

      {demande.statut === "acceptee" && r && (
        <Encadre ton="seve" icone={<CalendarCheck size={18} aria-hidden="true" />}>
          <span className="fort">
            Collecte le {dateLongue(r.dateRetenue)}{r.heureDebut ? ` à partir de ${r.heureDebut.replace(":", "h")}` : ""}
          </span>
          {r.objectifPoches && <span>Objectif : {r.objectifPoches} poches.</span>}
          <span>{r.message}</span>
          <span>Contact : {r.contact}</span>
        </Encadre>
      )}

      {demande.statut === "refusee" && r && (
        <Encadre>
          <span>{r.message}</span>
          <span>Contact : {r.contact}</span>
        </Encadre>
      )}

      {demande.statut === "acceptee" && (
        <p className="appui">
          Parlez-en autour de vous : les donneurs inscrits dans l’application et proches de votre zone pourront être prévenus par le CNTS.
        </p>
      )}

      <div className="pile">
        <Bouton variante="secondaire" large onClick={surAutre}>Suivre une autre demande</Bouton>
        <Link href="/campagnes/proposer" className="lien" style={{ alignSelf: "center" }}>Proposer une nouvelle collecte</Link>
      </div>
    </div>
  );
}
