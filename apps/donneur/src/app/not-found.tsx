import Link from "next/link";

export default function Introuvable() {
  return (
    <main className="acces">
      <div className="acces__corps" style={{ textAlign: "center", alignItems: "center" }}>
        <h1 className="titre-grand">Cette page n’existe pas</h1>
        <p className="appui">Le lien est peut-être incomplet.</p>
        <Link href="/" className="bouton bouton--principal">Revenir à l’accueil</Link>
      </div>
    </main>
  );
}
