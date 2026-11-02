/**
 * Installer l'application (PWA) — repris de DJIGUI.
 * Aucune boutique d'applications : trois touches dans le navigateur.
 */
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "Installer l’application" };

const MARCHES = [
  {
    systeme: "Sur Android (Chrome)",
    etapes: [
      "Touchez les trois points en haut à droite du navigateur.",
      "Choisissez « Ajouter à l’écran d’accueil » ou « Installer l’application ».",
      "Confirmez. L’icône rouge apparaît avec vos autres applications.",
    ],
  },
  {
    systeme: "Sur iPhone (Safari)",
    etapes: [
      "Touchez le bouton de partage, en bas au milieu de l’écran.",
      "Faites défiler et choisissez « Sur l’écran d’accueil ».",
      "Touchez « Ajouter » en haut à droite.",
    ],
  },
];

export default function Installation() {
  return (
    <main className="acces">
      <Link href="/bienvenue" className="lien retour"><ArrowLeft size={18} aria-hidden="true" />Retour</Link>
      <div className="acces__entete">
        <h1 className="titre-grand">Mettre l’application sur votre écran d’accueil</h1>
        <p className="appui">Rien à télécharger depuis une boutique. Une fois installée, elle s’ouvre comme les autres applications.</p>
      </div>
      {MARCHES.map(({ systeme, etapes }) => (
        <section key={systeme} className="pile">
          <h2 className="lead">{systeme}</h2>
          <ol className="etapes">
            {etapes.map((e, i) => (
              <li key={e}>
                <span className="etapes__numero" aria-hidden="true">{i + 1}</span>
                <span style={{ paddingTop: 4 }}>{e}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}
      <p className="petit">Les pages déjà ouvertes restent consultables quand le réseau est coupé.</p>
    </main>
  );
}
