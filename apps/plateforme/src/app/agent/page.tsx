"use client";
/** Espace agent : accueil/prélèvement (P3), laboratoire (P4/P5), traçabilité (P9). */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AgentConnecte, DonneurAgent, FicheTracabilite, Passage, Poche,
} from "@dds/contrat-api";
import { api, messageDe } from "@/lib/api";
import { fermerSession, lireAgent, lireJeton } from "@/lib/session";

const LIBELLE_ROLE: Record<string, string> = {
  agent_accueil: "Accueil",
  agent_prelevement: "Prélèvement",
  agent_labo: "Laboratoire",
  agent_stock: "Stock",
  agent_depot: "Dépôt",
  admin: "Administrateur",
};

export default function Agent() {
  const routeur = useRouter();
  const [agent, setAgent] = useState<AgentConnecte | null>(null);
  const [onglet, setOnglet] = useState("");

  useEffect(() => {
    const a = lireAgent();
    if (!a || !lireJeton()) {
      routeur.replace("/");
      return;
    }
    setAgent(a);
    setOnglet(a.roles.some((r) => r === "agent_labo" || r === "admin") ? "labo" : "accueil");
  }, [routeur]);

  if (!agent) return <main className="page"><div className="squelette" style={{ height: 200 }} /></main>;

  const peutAccueillir = agent.roles.some((r) => ["agent_accueil", "agent_prelevement", "admin"].includes(r));
  const peutLabo = agent.roles.some((r) => ["agent_labo", "admin"].includes(r));

  return (
    <main className="page">
      <header className="entete">
        <div>
          <h1 className="entete__titre">Plateforme CNTS</h1>
          <span className="appui">{agent.nomComplet} · {agent.roles.map((r) => LIBELLE_ROLE[r] ?? r).join(", ")}</span>
        </div>
        <button className="bouton bouton--secondaire" onClick={() => { fermerSession(); routeur.replace("/"); }}>
          Se déconnecter
        </button>
      </header>

      <nav className="onglets">
        {peutAccueillir && <Onglet actif={onglet === "accueil"} onClick={() => setOnglet("accueil")}>Accueil / prélèvement</Onglet>}
        {peutLabo && <Onglet actif={onglet === "labo"} onClick={() => setOnglet("labo")}>Laboratoire</Onglet>}
        <Onglet actif={onglet === "trace"} onClick={() => setOnglet("trace")}>Traçabilité</Onglet>
      </nav>

      {onglet === "accueil" && <Accueil />}
      {onglet === "labo" && <Laboratoire />}
      {onglet === "trace" && <Tracabilite />}
    </main>
  );
}

function Onglet({ actif, onClick, children }: { actif: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={`onglet${actif ? " onglet--actif" : ""}`} onClick={onClick}>{children}</button>;
}

/* =====================================================================
   P3 — Accueil et prélèvement
   ===================================================================== */
function Accueil() {
  const [telephone, setTelephone] = useState("");
  const [donneur, setDonneur] = useState<DonneurAgent | null>(null);
  const [dernierPassage, setDernierPassage] = useState<Passage | null>(null);
  const [erreur, setErreur] = useState("");
  const [reussite, setReussite] = useState("");
  const [enCours, setEnCours] = useState(false);
  const [motDePasse, setMotDePasse] = useState<string | null>(null);

  async function rechercher(e?: React.FormEvent) {
    e?.preventDefault();
    setEnCours(true); setErreur(""); setReussite(""); setDonneur(null); setDernierPassage(null); setMotDePasse(null);
    try {
      setDonneur(await api.retrouverDonneur(`+226${telephone.replace(/\D/g, "").slice(-8)}`));
    } catch (p) {
      setErreur(messageDe(p));
    } finally {
      setEnCours(false);
    }
  }

  async function passage(resultat: "apte" | "ajourne", ajourneJusquau?: string) {
    if (!donneur) return;
    setEnCours(true); setErreur(""); setReussite("");
    try {
      const p = await api.enregistrerPassage({ donneurId: donneur.id, resultat, ajourneJusquau: ajourneJusquau ?? null });
      setDernierPassage(p);
      setReussite(`Passage enregistré : ${resultat === "apte" ? "apte" : "ajourné jusqu'au " + ajourneJusquau}.`);
    } catch (p) {
      setErreur(messageDe(p));
    } finally {
      setEnCours(false);
    }
  }

  async function creerPoche() {
    if (!dernierPassage) return;
    setEnCours(true); setErreur("");
    try {
      const poche = await api.creerPoche({ passageId: dernierPassage.id, volume: null });
      setReussite(`Poche créée : ${poche.code}`);
    } catch (p) {
      setErreur(messageDe(p));
    } finally {
      setEnCours(false);
    }
  }

  async function reinitialiser() {
    if (!donneur) return;
    setEnCours(true); setErreur("");
    try {
      const r = await api.reinitialiser(donneur.id);
      setMotDePasse(r.motDePasseTemporaire);
    } catch (p) {
      setErreur(messageDe(p));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="pile">
      <form className="bloc rang" onSubmit={rechercher}>
        <label className="champ" style={{ flex: 1 }}>
          <span className="champ__etiquette">Numéro du donneur</span>
          <input className="champ__saisie chiffres" inputMode="tel" placeholder="70000000"
                 value={telephone} onChange={(e) => setTelephone(e.target.value)} />
        </label>
        <button className="bouton bouton--principal" type="submit" disabled={enCours}>Rechercher</button>
      </form>

      {erreur && <p className="message message--erreur">{erreur}</p>}
      {reussite && <p className="message message--reussite">{reussite}</p>}

      {donneur && (
        <div className="bloc pile">
          <div className="rang-espace">
            <div className="pile-s">
              <span className="titre-s">{donneur.prenom} {donneur.nom}</span>
              <span className="appui chiffres">{donneur.numeroDonneur}</span>
              <span className="petit">
                {donneur.groupeSanguin ?? "Groupe à déterminer"} · {donneur.zone?.nom ?? "sans zone"} ·{" "}
                {donneur.origine === "sur_place" ? "inscrit sur place" : "inscrit via l'application"}
              </span>
            </div>
            <span className={`pilule ${donneur.actif ? "pilule--seve" : "pilule--sang"}`}>{donneur.actif ? "Actif" : "Désactivé"}</span>
          </div>

          <div className="rang" style={{ flexWrap: "wrap" }}>
            <button className="bouton bouton--principal" disabled={enCours} onClick={() => passage("apte")}>Apte</button>
            <Ajourne onConfirmer={(date) => passage("ajourne", date)} />
            {dernierPassage?.resultat === "apte" && (
              <button className="bouton bouton--secondaire" disabled={enCours} onClick={creerPoche}>Créer la poche</button>
            )}
            <button className="bouton bouton--secondaire" disabled={enCours} onClick={reinitialiser}>Réinitialiser le mot de passe</button>
          </div>

          {motDePasse && (
            <p className="message message--reussite">Mot de passe temporaire : <span className="chiffres fort">{motDePasse}</span> — à remettre au donneur.</p>
          )}
        </div>
      )}
    </section>
  );
}

function Ajourne({ onConfirmer }: { onConfirmer: (date: string) => void }) {
  const [ouvert, setOuvert] = useState(false);
  const [date, setDate] = useState("");
  if (!ouvert) return <button className="bouton bouton--secondaire" onClick={() => setOuvert(true)}>Ajourné</button>;
  return (
    <span className="rang">
      <input className="champ__saisie" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <button className="bouton bouton--principal" disabled={!date} onClick={() => onConfirmer(date)}>Valider</button>
      <button className="bouton bouton--secondaire" onClick={() => setOuvert(false)}>Annuler</button>
    </span>
  );
}

/* =====================================================================
   P4 / P5 — Laboratoire
   ===================================================================== */
function Laboratoire() {
  const [poches, setPoches] = useState<Poche[]>([]);
  const [analyse, setAnalyse] = useState<{ code: string; groupe: string; resultat: string }>({ code: "", groupe: "O+", resultat: "conforme" });
  const [produits, setProduits] = useState<Record<string, boolean>>({ GR: true, PL: true, PQ: false });
  const [erreur, setErreur] = useState("");
  const [reussite, setReussite] = useState("");

  useEffect(() => { charger(); }, []);
  async function charger() {
    try { setPoches(await api.pochesAanalyser()); } catch (p) { setErreur(messageDe(p)); }
  }

  async function analyser(code: string) {
    setErreur(""); setReussite("");
    try {
      const r = await api.analyser(code, { groupeSanguin: analyse.groupe as never, resultat: analyse.resultat as never });
      setReussite(`Analyse enregistrée : ${r.code} → ${r.resultat}.`);
      charger();
    } catch (p) { setErreur(messageDe(p)); }
  }

  async function preparer(code: string) {
    setErreur(""); setReussite("");
    const liste = Object.entries(produits).filter(([, oui]) => oui).map(([k]) => k as "GR" | "PL" | "PQ");
    try {
      const r = await api.preparer(code, { produits: liste });
      setReussite(`Produits créés : ${r.map((x) => x.code).join(", ")}.`);
      charger();
    } catch (p) { setErreur(messageDe(p)); }
  }

  return (
    <section className="pile">
      <h2 className="section-titre">Poches en attente d'analyse</h2>
      {erreur && <p className="message message--erreur">{erreur}</p>}
      {reussite && <p className="message message--reussite">{reussite}</p>}
      {poches.length === 0 ? (
        <div className="bloc"><p className="appui">Aucune poche en attente d'analyse.</p></div>
      ) : (
        poches.map((p) => (
          <div key={p.id} className="bloc pile-s">
            <div className="rang-espace">
              <span className="titre-s chiffres">{p.code}</span>
              <span className="pilule pilule--primaire">prélevée</span>
            </div>
            <div className="rang" style={{ flexWrap: "wrap" }}>
              <select className="champ__saisie" style={{ width: "auto" }} value={analyse.groupe}
                      onChange={(e) => setAnalyse({ ...analyse, groupe: e.target.value })}>
                {["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"].map((g) => <option key={g}>{g}</option>)}
              </select>
              <select className="champ__saisie" style={{ width: "auto" }} value={analyse.resultat}
                      onChange={(e) => setAnalyse({ ...analyse, resultat: e.target.value })}>
                <option value="conforme">Conforme</option>
                <option value="non_conforme">Non conforme</option>
              </select>
              <button className="bouton bouton--principal" onClick={() => analyser(p.code)}>Enregistrer l'analyse</button>
            </div>
          </div>
        ))
      )}
    </section>
  );
}

/* =====================================================================
   P9 — Traçabilité (scan ou saisie d'un code)
   ===================================================================== */
function Tracabilite() {
  const [code, setCode] = useState("");
  const [fiche, setFiche] = useState<FicheTracabilite | null>(null);
  const [erreur, setErreur] = useState("");

  async function rechercher(e: React.FormEvent) {
    e.preventDefault();
    setErreur(""); setFiche(null);
    try { setFiche(await api.fiche(code)); } catch (p) { setErreur(messageDe(p)); }
  }

  return (
    <section className="pile">
      <form className="bloc rang" onSubmit={rechercher}>
        <label className="champ" style={{ flex: 1 }}>
          <span className="champ__etiquette">Scanner ou saisir le code</span>
          <input className="champ__saisie chiffres" placeholder="OUA-26-04812-K"
                 value={code} onChange={(e) => setCode(e.target.value)} />
        </label>
        <button className="bouton bouton--principal" type="submit">Consulter</button>
      </form>

      {erreur && <p className="message message--erreur">{erreur}</p>}

      {fiche && (
        <div className="bloc pile">
          <div className="rang-espace">
            <span className="titre-s chiffres">{fiche.code}</span>
            <span className="pilule pilule--neutre">{fiche.type === "poche" ? "Poche" : "Produit"} · {fiche.statut}</span>
          </div>
          <div className="grille-2">
            <span className="appui">Groupe : <span className="fort">{fiche.groupeSanguin ?? "—"}</span></span>
            <span className="appui">Donneur : <span className="fort chiffres">{fiche.donneur?.numeroDonneur ?? "—"}</span></span>
            <span className="appui">Site : <span className="fort">{fiche.site}</span></span>
            <span className="appui">Date : <span className="fort">{fiche.date}</span></span>
          </div>
          <h3 className="section-titre">Historique</h3>
          {fiche.evenements.map((e, i) => (
            <div key={i} className="ligne">
              <span className="pilule pilule--primaire">{e.type}</span>
              <div className="ligne__corps">
                <span className="appui">{new Date(e.date).toLocaleString("fr-FR")}</span>
                <span className="petit">{e.agent ?? "—"} · {e.site ?? "—"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
