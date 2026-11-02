/**
 * D2 · Bienvenue.
 * Dit en trois temps ce que fait l'application, puis deux portes :
 * créer un compte (D3) ou se connecter (D5).
 */
import Link from "next/link";
import { Smartphone, Tent } from "lucide-react";
import { GoutteSimple } from "@/components/Goutte";

export const metadata = { title: "Bienvenue" };

const ETAPES = [
  { titre: "Vous créez votre compte", detail: "Votre numéro WhatsApp, votre quartier et votre groupe sanguin, si vous le connaissez." },
  { titre: "Le centre vous prévient", detail: "Seulement quand votre groupe manque près de chez vous, et quand vous pouvez donner." },
  { titre: "Vous répondez en une touche", detail: "« Je viens » ou « Je ne peux pas ». Répondre ne vous engage à rien." },
];

export default function Bienvenue() {
  return (
    <main className="bienvenue">
      <section className="bienvenue__haut">
        <div className="bienvenue__haut-interieur">
          <GoutteSimple className="bienvenue__goutte" />
          <h1 className="bienvenue__titre">Votre sang peut sauver une vie cette semaine.</h1>
        </div>
      </section>

      <div className="bienvenue__bas">
        <ol className="etapes" aria-label="Comment ça marche">
          {ETAPES.map((e, i) => (
            <li key={e.titre}>
              <span className="etapes__numero" aria-hidden="true">{i + 1}</span>
              <div className="pile-s" style={{ gap: 2 }}>
                <span className="fort">{e.titre}</span>
                <span className="appui">{e.detail}</span>
              </div>
            </li>
          ))}
        </ol>

        <div className="pile">
          <Link href="/inscription" className="bouton bouton--principal bouton--large">Créer mon compte</Link>
          <Link href="/connexion" className="bouton bouton--secondaire bouton--large">J’ai déjà un compte</Link>
          <Link href="/installation" className="lien lien--discret" style={{ alignSelf: "center" }}>
            <Smartphone size={18} aria-hidden="true" />
            Installer l’application sur mon téléphone
          </Link>
          <Link href="/campagnes" className="lien lien--discret" style={{ alignSelf: "center" }}>
            <Tent size={18} aria-hidden="true" />
            Vous organisez une collecte ? Proposez-la au CNTS
          </Link>
        </div>

        <p className="petit centre">
          La décision de prélever revient toujours au personnel médical du centre.
          Vos coordonnées servent uniquement aux appels au don.
        </p>
      </div>
    </main>
  );
}
