"use client";
import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";
import { api, UTILISER_EXEMPLES } from "@/lib/api";
import { messageDe } from "@/lib/erreurs";
import { minuterie } from "@/lib/format";
import { CODE_SIMULE } from "@/lib/simulateur";
import { memoriserVerification, type VerificationEnCours } from "@/lib/session";
import { MessageErreur, MessageReussite } from "./Messages";

/** Lien « Renvoyer le code », actif après le délai fixé par le serveur. */
export default function RenvoiCode({ verification, surRenvoi }:
  { verification: VerificationEnCours; surRenvoi: (v: VerificationEnCours) => void }) {
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [enCours, setEnCours] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    const t = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const attente = Math.max(0, Math.ceil((verification.renvoiPossibleLe - maintenant) / 1000));

  async function renvoyer() {
    setEnCours(true); setErreur(""); setMessage("");
    try {
      const envoi = await api.renvoyerCode({ telephone: verification.telephone, objet: verification.objet });
      const suite = {
        ...verification,
        renvoiPossibleLe: Date.now() + envoi.renvoiPossibleDans * 1000,
        expireLe: Date.now() + envoi.expireDans * 1000,
      };
      memoriserVerification(suite);
      surRenvoi(suite);
      setMessage("Un nouveau code vient de partir sur WhatsApp.");
    } catch (p) {
      setErreur(messageDe(p));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="pile-s" style={{ alignItems: "center" }}>
      {attente > 0 ? (
        <span className="appui">Vous pourrez demander un nouveau code dans {minuterie(attente)}.</span>
      ) : (
        <button type="button" className="lien" onClick={renvoyer} disabled={enCours}>
          <RotateCw size={16} aria-hidden="true" className={enCours ? "tourne" : undefined} />
          Je n’ai rien reçu : renvoyer le code
        </button>
      )}
      <MessageReussite>{message}</MessageReussite>
      <MessageErreur>{erreur}</MessageErreur>
      {UTILISER_EXEMPLES && (
        <span className="petit">Mode démonstration : le code est {CODE_SIMULE}.</span>
      )}
    </div>
  );
}
