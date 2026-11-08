"use client";
/**
 * Espace CNTS (administration) — réservé au rôle « admin ».
 *  · Tableau de bord temps réel (GET /statistiques)
 *  · P1 — comptes et rôles (GET/POST /agents)
 *  · P2 — réseau : zones et sites (GET /sites, POST /zones, POST /centres)
 *  · Annexe E — règles de don réglables (GET /regles, PUT /regles/:cle)
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  AgentCompte, AgentConnecte, Regle, Role, SiteAdmin, Statistiques, Zone,
} from "@dds/contrat-api";
import { api, messageDe } from "@/lib/api";
import { fermerSession, lireAgent, lireJeton } from "@/lib/session";

/** Rôles attribuables à un compte de la plateforme (« donneur » n'en est pas un). */
const ROLES_PLATEFORME: { role: Role; libelle: string }[] = [
  { role: "agent_accueil", libelle: "Accueil" },
  { role: "agent_prelevement", libelle: "Prélèvement" },
  { role: "agent_labo", libelle: "Laboratoire" },
  { role: "agent_stock", libelle: "Stock" },
  { role: "agent_depot", libelle: "Dépôt" },
  { role: "admin", libelle: "Administrateur" },
];

const LIBELLE_ROLE: Record<string, string> = Object.fromEntries(
  ROLES_PLATEFORME.map((r) => [r.role, r.libelle]),
);

const LIBELLE_TYPE_SITE: Record<SiteAdmin["type"], string> = {
  centre: "Centre de collecte",
  depot: "Dépôt",
  hopital: "Hôpital",
};

type Onglet = "bord" | "comptes" | "reseau" | "regles";

const ONGLETS: { cle: Onglet; libelle: string }[] = [
  { cle: "bord", libelle: "Tableau de bord" },
  { cle: "comptes", libelle: "Comptes et rôles" },
  { cle: "reseau", libelle: "Zones et sites" },
  { cle: "regles", libelle: "Règles de don" },
];

export default function Administration() {
  const routeur = useRouter();
  const [admin, setAdmin] = useState<AgentConnecte | null>(null);
  const [onglet, setOnglet] = useState<Onglet>("bord");

  useEffect(() => {
    const a = lireAgent();
    if (!a || !lireJeton()) {
      routeur.replace("/");
      return;
    }
    // L'espace CNTS n'est pas pour les agents : on les renvoie à leur espace.
    if (!a.roles.includes("admin")) {
      routeur.replace("/agent");
      return;
    }
    setAdmin(a);
  }, [routeur]);

  if (!admin) {
    return <main className="page"><div className="squelette" style={{ height: 220 }} /></main>;
  }

  return (
    <main className="page">
      <header className="entete">
        <div>
          <h1 className="entete__titre">Espace CNTS</h1>
          <span className="appui">{admin.nomComplet} · Administrateur</span>
        </div>
        <div className="rang">
          <button className="bouton bouton--secondaire" onClick={() => routeur.push("/agent")}>
            Espace agent
          </button>
          <button
            className="bouton bouton--secondaire"
            onClick={() => { fermerSession(); routeur.replace("/"); }}
          >
            Se déconnecter
          </button>
        </div>
      </header>

      <nav className="onglets" aria-label="Sections de l'administration">
        {ONGLETS.map((o) => (
          <button
            key={o.cle}
            className={`onglet${onglet === o.cle ? " onglet--actif" : ""}`}
            aria-current={onglet === o.cle ? "page" : undefined}
            onClick={() => setOnglet(o.cle)}
          >
            {o.libelle}
          </button>
        ))}
      </nav>

      {onglet === "bord" && <TableauDeBord />}
      {onglet === "comptes" && <Comptes />}
      {onglet === "reseau" && <Reseau />}
      {onglet === "regles" && <Regles />}
    </main>
  );
}

/* =====================================================================
   Petites briques partagées
   ===================================================================== */

function Erreur({ texte }: { texte: string }) {
  if (!texte) return null;
  return <p className="message message--erreur" role="alert">{texte}</p>;
}

function Reussite({ texte }: { texte: string }) {
  if (!texte) return null;
  return <p className="message message--reussite" role="status">{texte}</p>;
}

function Squelette({ hauteur = 160 }: { hauteur?: number }) {
  return <div className="squelette" style={{ height: hauteur }} />;
}

/** Charge une ressource au montage, avec rechargement à la demande. */
function useRessource<T>(charger: () => Promise<T>) {
  const [donnees, setDonnees] = useState<T | null>(null);
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(true);

  const recharger = useCallback(async () => {
    setChargement(true);
    setErreur("");
    try {
      setDonnees(await charger());
    } catch (p) {
      setErreur(messageDe(p));
    } finally {
      setChargement(false);
    }
    // `charger` est recréé à chaque rendu par l'appelant : on ne le suit pas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { void recharger(); }, [recharger]);

  return { donnees, erreur, chargement, recharger, setDonnees };
}

/* =====================================================================
   Tableau de bord temps réel
   ===================================================================== */

function TableauDeBord() {
  const { donnees: stats, erreur, chargement, recharger } = useRessource<Statistiques>(
    () => api.statistiques(),
  );

  if (chargement) return <Squelette hauteur={240} />;
  if (erreur) return <section className="bloc pile-s"><Erreur texte={erreur} /><button className="bouton bouton--secondaire" onClick={() => void recharger()}>Réessayer</button></section>;
  if (!stats) return null;

  // Les tons d'alerte (ocre, sang) ne s'appliquent que si le compteur est
  // non nul : un « 0 » alerte en rouge se lit comme un problème alors que
  // c'est la bonne nouvelle.
  const cartes: { libelle: string; valeur: number; detail?: string; ton?: string }[] = [
    { libelle: "Donneurs inscrits", valeur: stats.donneurs.total, detail: `${stats.donneurs.actifs} actifs · ${stats.donneurs.enPause} en pause` },
    { libelle: "Dons aujourd'hui", valeur: stats.donsAujourdhui, detail: "passages déclarés aptes" },
    { libelle: "Poches en analyse", valeur: stats.pochesEnAnalyse, detail: "prélevées ou au laboratoire", ton: "ocre" },
    { libelle: "Produits disponibles", valeur: stats.produitsDisponibles, detail: "en stock ou réservés", ton: "seve" },
    { libelle: "Alertes en cours", valeur: stats.alertesEnCours, detail: "appels aux donneurs ouverts", ton: "sang" },
    { libelle: "Demandes en attente", valeur: stats.demandesEnAttente, detail: "à traiter par la distribution", ton: "ocre" },
  ].map((c) => (c.valeur === 0 && c.ton !== "seve" ? { ...c, ton: undefined } : c));

  return (
    <section className="pile">
      <div className="rang-espace">
        <h2 className="section-titre">État du réseau en temps réel</h2>
        <button className="bouton bouton--secondaire" onClick={() => void recharger()}>Actualiser</button>
      </div>

      <div className="grille-indicateurs">
        {cartes.map((c) => (
          <article key={c.libelle} className="bloc indicateur">
            <span className="appui">{c.libelle}</span>
            <strong className={`indicateur__valeur chiffres${c.ton ? " indicateur__valeur--" + c.ton : ""}`}>
              {c.valeur}
            </strong>
            {c.detail && <span className="petit">{c.detail}</span>}
          </article>
        ))}
      </div>

      <div className="bloc pile-s">
        <h3 className="section-titre">Réseau</h3>
        <div className="rang" style={{ flexWrap: "wrap", gap: "var(--e3)" }}>
          <span className="pilule pilule--primaire">{stats.zones} zones</span>
          <span className="pilule pilule--primaire">{stats.sites} sites actifs</span>
          <span className="pilule pilule--primaire">{stats.agents} comptes actifs</span>
        </div>
      </div>
    </section>
  );
}

/* =====================================================================
   P1 — Comptes et rôles
   ===================================================================== */

function Comptes() {
  const { donnees: agents, erreur, chargement, recharger } = useRessource<AgentCompte[]>(
    () => api.agents(),
  );
  const { donnees: sites } = useRessource<SiteAdmin[]>(() => api.sites());
  const [ouvert, setOuvert] = useState(false);

  return (
    <section className="pile">
      <div className="rang-espace">
        <h2 className="section-titre">Comptes de la plateforme</h2>
        <button className="bouton bouton--principal" onClick={() => setOuvert((v) => !v)}>
          {ouvert ? "Fermer" : "Créer un compte"}
        </button>
      </div>

      {ouvert && (
        <FormulaireAgent
          sites={sites ?? []}
          surCreation={() => { setOuvert(false); void recharger(); }}
        />
      )}

      {chargement && <Squelette />}
      <Erreur texte={erreur} />

      {agents && agents.length === 0 && (
        <p className="bloc appui">Aucun compte pour l'instant.</p>
      )}

      {agents && agents.length > 0 && (
        <div className="bloc">
          {agents.map((a) => (
            <div className="ligne" key={a.id}>
              <div className="ligne__corps">
                <span className="fort">{a.prenom} {a.nom}</span>
                <span className="appui">{a.email}{a.telephone ? ` · ${a.telephone}` : ""}</span>
                <span className="petit">{a.siteNom}</span>
                <div className="rang" style={{ flexWrap: "wrap", gap: "var(--e1)", marginTop: 4 }}>
                  {a.roles.map((r) => (
                    <span
                      key={r}
                      className={`pilule ${r === "admin" ? "pilule--sang" : "pilule--neutre"}`}
                    >
                      {LIBELLE_ROLE[r] ?? r}
                    </span>
                  ))}
                </div>
              </div>
              <span className={`pilule ${a.actif ? "pilule--seve" : "pilule--neutre"}`}>
                {a.actif ? "Actif" : "Désactivé"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FormulaireAgent({ sites, surCreation }: { sites: SiteAdmin[]; surCreation: () => void }) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [siteId, setSiteId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [erreur, setErreur] = useState("");
  const [reussite, setReussite] = useState("");
  const [enCours, setEnCours] = useState(false);

  function basculerRole(role: Role) {
    setRoles((liste) => liste.includes(role) ? liste.filter((r) => r !== role) : [...liste, role]);
  }

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(""); setReussite("");

    // Garde-fous côté écran, pour éviter un aller-retour inutile au serveur.
    if (roles.length === 0) { setErreur("Choisissez au moins un rôle."); return; }
    if (!siteId) { setErreur("Choisissez un site de rattachement."); return; }
    if (motDePasse.length < 8) { setErreur("Mot de passe : 8 caractères au moins."); return; }

    setEnCours(true);
    try {
      const cree = await api.creerAgent({ nom, prenom, email, telephone, motDePasse, siteId, roles });
      setReussite(`Compte créé pour ${cree.prenom} ${cree.nom}.`);
      setNom(""); setPrenom(""); setEmail(""); setTelephone(""); setMotDePasse(""); setRoles([]);
      surCreation();
    } catch (p) {
      setErreur(messageDe(p));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form className="bloc pile" onSubmit={envoyer}>
      <h3 className="titre-s">Nouveau compte</h3>

      <div className="grille-2">
        <label className="champ">
          <span className="champ__etiquette">Prénom</span>
          <input className="champ__saisie" value={prenom} required
                 onChange={(e) => setPrenom(e.target.value)} />
        </label>
        <label className="champ">
          <span className="champ__etiquette">Nom</span>
          <input className="champ__saisie" value={nom} required
                 onChange={(e) => setNom(e.target.value)} />
        </label>
        <label className="champ">
          <span className="champ__etiquette">Adresse e-mail</span>
          <input className="champ__saisie" type="email" value={email} required
                 autoComplete="off" onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="champ">
          <span className="champ__etiquette">Téléphone</span>
          <input className="champ__saisie chiffres" inputMode="tel" value={telephone}
                 placeholder="+226 70 00 00 00" onChange={(e) => setTelephone(e.target.value)} />
        </label>
        <label className="champ">
          <span className="champ__etiquette">Mot de passe provisoire</span>
          <input className="champ__saisie" type="password" value={motDePasse} required
                 minLength={8} autoComplete="new-password"
                 onChange={(e) => setMotDePasse(e.target.value)} />
          <span className="petit">8 caractères au moins. L'agent le changera lui-même.</span>
        </label>
        <label className="champ">
          <span className="champ__etiquette">Site de rattachement</span>
          <select className="champ__saisie" value={siteId} required
                  onChange={(e) => setSiteId(e.target.value)}>
            <option value="">Choisir…</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.nom} ({s.code})</option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="champ" style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="champ__etiquette">Rôles</legend>
        <div className="rang" style={{ flexWrap: "wrap", gap: "var(--e3)", marginTop: "var(--e2)" }}>
          {ROLES_PLATEFORME.map((r) => (
            <label key={r.role} className="case">
              <input type="checkbox" checked={roles.includes(r.role)}
                     onChange={() => basculerRole(r.role)} />
              <span>{r.libelle}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <Erreur texte={erreur} />
      <Reussite texte={reussite} />

      <button className="bouton bouton--principal" type="submit" disabled={enCours}>
        {enCours ? "Création…" : "Créer le compte"}
      </button>
    </form>
  );
}

/* =====================================================================
   P2 — Zones et sites
   ===================================================================== */

function Reseau() {
  const sitesRes = useRessource<SiteAdmin[]>(() => api.sites());
  const zonesRes = useRessource<Zone[]>(() => api.zones());

  return (
    <section className="pile">
      <div className="grille-2">
        <FormulaireZone surCreation={() => void zonesRes.recharger()} />
        <FormulaireSite
          zones={zonesRes.donnees ?? []}
          surCreation={() => void sitesRes.recharger()}
        />
      </div>

      <h2 className="section-titre">Sites du réseau</h2>
      {sitesRes.chargement && <Squelette />}
      <Erreur texte={sitesRes.erreur} />
      {sitesRes.donnees && (
        <div className="bloc">
          {sitesRes.donnees.map((s) => (
            <div className="ligne" key={s.id}>
              <div className="ligne__corps">
                <span className="fort">{s.nom} <span className="chiffres appui">({s.code})</span></span>
                <span className="appui">{LIBELLE_TYPE_SITE[s.type]}{s.zoneNom ? ` · ${s.zoneNom}, ${s.ville}` : ""}</span>
                {s.adresse && <span className="petit">{s.adresse}</span>}
                {s.horaires && <span className="petit">{s.horaires}</span>}
              </div>
              <div className="pile-s" style={{ alignItems: "flex-end" }}>
                <span className={`pilule ${s.actif ? "pilule--seve" : "pilule--neutre"}`}>
                  {s.actif ? "Actif" : "Fermé"}
                </span>
                <span className="petit chiffres">{s.agents} agent{s.agents > 1 ? "s" : ""}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="section-titre">Zones</h2>
      {zonesRes.chargement && <Squelette hauteur={100} />}
      <Erreur texte={zonesRes.erreur} />
      {zonesRes.donnees && (
        <div className="bloc rang" style={{ flexWrap: "wrap", gap: "var(--e2)" }}>
          {zonesRes.donnees.map((z) => (
            <span className="pilule pilule--primaire" key={z.id}>{z.nom} · {z.ville}</span>
          ))}
        </div>
      )}
    </section>
  );
}

function FormulaireZone({ surCreation }: { surCreation: () => void }) {
  const [nom, setNom] = useState("");
  const [ville, setVille] = useState("Ouagadougou");
  const [erreur, setErreur] = useState("");
  const [reussite, setReussite] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(""); setReussite(""); setEnCours(true);
    try {
      const z = await api.ajouterZone({ nom, ville });
      setReussite(`Zone « ${z.nom} » ajoutée.`);
      setNom("");
      surCreation();
    } catch (p) {
      setErreur(messageDe(p));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form className="bloc pile" onSubmit={envoyer}>
      <h3 className="titre-s">Ajouter une zone</h3>
      <label className="champ">
        <span className="champ__etiquette">Nom de la zone</span>
        <input className="champ__saisie" value={nom} required placeholder="Tanghin"
               onChange={(e) => setNom(e.target.value)} />
      </label>
      <label className="champ">
        <span className="champ__etiquette">Ville</span>
        <input className="champ__saisie" value={ville} required
               onChange={(e) => setVille(e.target.value)} />
      </label>
      <Erreur texte={erreur} />
      <Reussite texte={reussite} />
      <button className="bouton bouton--principal" type="submit" disabled={enCours}>
        {enCours ? "Ajout…" : "Ajouter la zone"}
      </button>
    </form>
  );
}

function FormulaireSite({ zones, surCreation }: { zones: Zone[]; surCreation: () => void }) {
  const [code, setCode] = useState("");
  const [nom, setNom] = useState("");
  const [type, setType] = useState<SiteAdmin["type"]>("centre");
  const [adresse, setAdresse] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [telephone, setTelephone] = useState("");
  const [horaires, setHoraires] = useState("");
  const [erreur, setErreur] = useState("");
  const [reussite, setReussite] = useState("");
  const [enCours, setEnCours] = useState(false);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    setErreur(""); setReussite("");
    if (!/^[A-Z]{3}$/.test(code)) { setErreur("Code sur 3 lettres majuscules."); return; }
    setEnCours(true);
    try {
      const s = await api.ajouterCentre({
        code, nom, type, adresse, telephone, horaires,
        zoneId: zoneId || null,
      });
      setReussite(`Site « ${s.nom} » ajouté.`);
      setCode(""); setNom(""); setAdresse(""); setTelephone(""); setHoraires("");
      surCreation();
    } catch (p) {
      setErreur(messageDe(p));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form className="bloc pile" onSubmit={envoyer}>
      <h3 className="titre-s">Ajouter un site</h3>
      <div className="grille-2">
        <label className="champ">
          <span className="champ__etiquette">Code</span>
          <input className="champ__saisie chiffres" value={code} required maxLength={3}
                 placeholder="BOB" style={{ textTransform: "uppercase" }}
                 onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <span className="petit">3 lettres majuscules, unique.</span>
        </label>
        <label className="champ">
          <span className="champ__etiquette">Type</span>
          <select className="champ__saisie" value={type}
                  onChange={(e) => setType(e.target.value as SiteAdmin["type"])}>
            <option value="centre">Centre de collecte</option>
            <option value="depot">Dépôt</option>
            <option value="hopital">Hôpital</option>
          </select>
        </label>
      </div>
      <label className="champ">
        <span className="champ__etiquette">Nom</span>
        <input className="champ__saisie" value={nom} required placeholder="CNTS Bobo-Dioulasso"
               onChange={(e) => setNom(e.target.value)} />
      </label>
      <label className="champ">
        <span className="champ__etiquette">Zone</span>
        <select className="champ__saisie" value={zoneId} onChange={(e) => setZoneId(e.target.value)}>
          <option value="">Aucune</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.nom} · {z.ville}</option>)}
        </select>
      </label>
      <label className="champ">
        <span className="champ__etiquette">Adresse</span>
        <input className="champ__saisie" value={adresse}
               onChange={(e) => setAdresse(e.target.value)} />
      </label>
      <div className="grille-2">
        <label className="champ">
          <span className="champ__etiquette">Téléphone</span>
          <input className="champ__saisie chiffres" inputMode="tel" value={telephone}
                 onChange={(e) => setTelephone(e.target.value)} />
        </label>
        <label className="champ">
          <span className="champ__etiquette">Horaires</span>
          <input className="champ__saisie" value={horaires}
                 placeholder="Lundi au vendredi, 7h30 à 15h30"
                 onChange={(e) => setHoraires(e.target.value)} />
        </label>
      </div>
      <Erreur texte={erreur} />
      <Reussite texte={reussite} />
      <button className="bouton bouton--principal" type="submit" disabled={enCours}>
        {enCours ? "Ajout…" : "Ajouter le site"}
      </button>
    </form>
  );
}

/* =====================================================================
   Annexe E — règles de don
   ===================================================================== */

function Regles() {
  const { donnees: regles, erreur, chargement, setDonnees } = useRessource<Regle[]>(
    () => api.regles(),
  );

  if (chargement) return <Squelette hauteur={280} />;
  if (erreur) return <div className="bloc"><Erreur texte={erreur} /></div>;
  if (!regles) return null;

  return (
    <section className="pile">
      <div className="pile-s">
        <h2 className="section-titre">Règles réglables (Annexe E)</h2>
        <p className="appui">
          Ces valeurs pilotent directement l'éligibilité au don et l'envoi des alertes.
          Une modification s'applique immédiatement, pour tout le réseau.
        </p>
      </div>

      <div className="bloc">
        {regles.map((r) => (
          <LigneRegle
            key={r.cle}
            regle={r}
            surChangement={(maj) => setDonnees(
              (liste) => (liste ?? []).map((x) => (x.cle === maj.cle ? maj : x)),
            )}
          />
        ))}
      </div>
    </section>
  );
}

function LigneRegle({ regle, surChangement }: { regle: Regle; surChangement: (r: Regle) => void }) {
  const [valeur, setValeur] = useState(regle.valeur);
  const [erreur, setErreur] = useState("");
  const [reussite, setReussite] = useState("");
  const [enCours, setEnCours] = useState(false);

  const modifie = valeur.trim() !== regle.valeur;

  async function enregistrer() {
    setErreur(""); setReussite(""); setEnCours(true);
    try {
      const maj = await api.modifierRegle(regle.cle, { valeur: valeur.trim() });
      surChangement(maj);
      setValeur(maj.valeur);
      setReussite("Enregistré.");
    } catch (p) {
      setErreur(messageDe(p));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="ligne">
      <div className="ligne__corps">
        <span className="fort">{regle.description || regle.cle}</span>
        <span className="petit chiffres">{regle.cle}</span>
        <Erreur texte={erreur} />
        <Reussite texte={reussite} />
      </div>
      <div className="rang">
        <label className="champ">
          <span className="champ__etiquette sr-only">Valeur de {regle.cle}</span>
          <input
            className="champ__saisie chiffres"
            style={{ width: 110 }}
            value={valeur}
            aria-label={`Valeur de ${regle.description || regle.cle}`}
            onChange={(e) => { setValeur(e.target.value); setReussite(""); }}
          />
        </label>
        <button
          className="bouton bouton--principal"
          disabled={!modifie || enCours || !valeur.trim()}
          onClick={() => void enregistrer()}
        >
          {enCours ? "…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
