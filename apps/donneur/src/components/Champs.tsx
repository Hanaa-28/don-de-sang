"use client";
/**
 * Champs de formulaire. Chaque champ a une étiquette visible, une aide
 * facultative et une erreur affichée juste en dessous.
 */
import { useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Check, Eye, EyeOff } from "lucide-react";
import type { GroupeSanguin, Zone } from "@dds/contrat-api";
import { GROUPES, LONGUEUR_CODE, LONGUEUR_MOT_DE_PASSE } from "@/lib/regles";

type Commun = { etiquette: string; aide?: ReactNode; erreur?: string; valide?: boolean };

function Cadre({ id, etiquette, aide, erreur, children }: Commun & { id: string; children: ReactNode }) {
  return (
    <div className={`champ${erreur ? " champ--erreur" : ""}`}>
      <label className="champ__etiquette" htmlFor={id}>{etiquette}</label>
      {children}
      {erreur ? (
        <span className="champ__aide-erreur" id={`${id}-erreur`}>{erreur}</span>
      ) : aide ? (
        <span className="champ__aide" id={`${id}-aide`}>{aide}</span>
      ) : null}
    </div>
  );
}

const decrit = (id: string, erreur?: string, aide?: ReactNode) =>
  erreur ? `${id}-erreur` : aide ? `${id}-aide` : undefined;

function Coche({ visible }: { visible?: boolean }) {
  return visible ? <span className="champ__coche"><Check size={20} aria-label="Valide" /></span> : null;
}

export function ChampTexte({ etiquette, aide, erreur, valide, ...entree }:
  Commun & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Cadre id={id} etiquette={etiquette} aide={aide} erreur={erreur}>
      <span className="champ__groupe">
        <input id={id} className="champ__saisie" aria-invalid={!!erreur}
               aria-describedby={decrit(id, erreur, aide)} {...entree} />
        <Coche visible={valide} />
      </span>
    </Cadre>
  );
}

/** Numéro burkinabè : l'indicatif +226 est affiché, on ne saisit que 8 chiffres. */
export function ChampTelephone({ etiquette, aide, erreur, valide, valeur, surChange, autoComplete = "tel-national", empecherCollage }:
  Commun & { valeur: string; surChange: (v: string) => void; autoComplete?: string; empecherCollage?: boolean }) {
  const id = useId();
  return (
    <Cadre id={id} etiquette={etiquette} aide={aide} erreur={erreur}>
      <span className="champ__groupe">
        <span className="champ__prefixe" aria-hidden="true">+226</span>
        <input
          id={id} className="champ__saisie chiffres" inputMode="numeric" autoComplete={autoComplete}
          placeholder="70 00 00 00" maxLength={11} value={valeur}
          aria-invalid={!!erreur} aria-describedby={decrit(id, erreur, aide)}
          onChange={(e) => surChange(e.target.value.replace(/[^\d ]/g, ""))}
          onPaste={empecherCollage ? (e) => e.preventDefault() : undefined}
        />
        <Coche visible={valide} />
      </span>
    </Cadre>
  );
}

export function ChampMotDePasse({ etiquette, aide, erreur, valeur, surChange, nouveau, montrerForce }:
  Commun & { valeur: string; surChange: (v: string) => void; nouveau?: boolean; montrerForce?: boolean }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const force = valeur.length === 0 ? 0
    : valeur.length < LONGUEUR_MOT_DE_PASSE ? 1
    : /\d/.test(valeur) && /[^\d]/.test(valeur) && valeur.length >= 10 ? 3 : 2;
  return (
    <Cadre id={id} etiquette={etiquette} aide={aide} erreur={erreur}>
      <span className="champ__groupe">
        <input
          id={id} className="champ__saisie" type={visible ? "text" : "password"}
          autoComplete={nouveau ? "new-password" : "current-password"}
          value={valeur} onChange={(e) => surChange(e.target.value)}
          aria-invalid={!!erreur} aria-describedby={decrit(id, erreur, aide)}
        />
        <button type="button" className="champ__interne" onClick={() => setVisible(!visible)}
                aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
          {visible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          {visible ? "Masquer" : "Afficher"}
        </button>
      </span>
      {montrerForce && valeur && (
        <div className={`force${force < 2 ? " force--faible" : ""}`} aria-hidden="true">
          {[1, 2, 3].map((n) => <span key={n} className={force >= n ? "rempli" : ""} />)}
        </div>
      )}
    </Cadre>
  );
}

/** Code à six chiffres reçu par WhatsApp. Le collage d'un code complet est accepté. */
export function ChampCode({ valeur, surChange, erreur, desactive }:
  { valeur: string; surChange: (v: string) => void; erreur?: string; desactive?: boolean }) {
  const id = useId();
  const cases = useRef<(HTMLInputElement | null)[]>([]);
  const chiffres = valeur.padEnd(LONGUEUR_CODE, " ").slice(0, LONGUEUR_CODE).split("");

  function ecrire(index: number, saisie: string) {
    const propres = saisie.replace(/\D/g, "");
    if (!propres) return;
    const suite = (valeur.slice(0, index) + propres).slice(0, LONGUEUR_CODE);
    surChange(suite);
    cases.current[Math.min(suite.length, LONGUEUR_CODE - 1)]?.focus();
  }

  function touche(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      const cible = chiffres[index].trim() ? index : Math.max(0, index - 1);
      surChange(valeur.slice(0, cible));
      cases.current[cible]?.focus();
    }
  }

  return (
    <div className={`champ${erreur ? " champ--erreur" : ""}`}>
      <span className="champ__etiquette" id={id}>Code à {LONGUEUR_CODE} chiffres</span>
      <div className="code-cases" role="group" aria-labelledby={id}>
        {chiffres.map((c, i) => (
          <input
            key={i}
            ref={(el) => { cases.current[i] = el; }}
            className="code-case"
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Chiffre ${i + 1}`}
            maxLength={LONGUEUR_CODE}
            value={c.trim()}
            disabled={desactive}
            onFocus={(e) => e.target.select()}
            onChange={(e) => ecrire(Math.min(i, valeur.length), e.target.value)}
            onKeyDown={(e) => touche(i, e)}
          />
        ))}
      </div>
      {erreur && <span className="champ__aide-erreur">{erreur}</span>}
    </div>
  );
}

/** Date de naissance en trois cases : plus simple qu'un calendrier sur un petit téléphone. */
export function ChampDate({ etiquette, aide, erreur, jour, mois, annee, surChange }:
  Commun & { jour: string; mois: string; annee: string; surChange: (cle: "jour" | "mois" | "annee", v: string) => void }) {
  const id = useId();
  const cases: { cle: "jour" | "mois" | "annee"; mot: string; taille: number; exemple: string; valeur: string }[] = [
    { cle: "jour", mot: "Jour", taille: 2, exemple: "14", valeur: jour },
    { cle: "mois", mot: "Mois", taille: 2, exemple: "03", valeur: mois },
    { cle: "annee", mot: "Année", taille: 4, exemple: "1998", valeur: annee },
  ];
  return (
    <fieldset className={`champ${erreur ? " champ--erreur" : ""}`} style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="champ__etiquette" style={{ padding: 0, marginBottom: "var(--e1)" }}>{etiquette}</legend>
      <div className="date-cases">
        {cases.map((c) => (
          <label key={c.cle} className="pile-s" style={{ gap: 2 }}>
            <span className="champ__groupe">
              <input
                id={`${id}-${c.cle}`} className="champ__saisie chiffres" inputMode="numeric"
                maxLength={c.taille} placeholder={c.exemple} value={c.valeur}
                aria-invalid={!!erreur}
                onChange={(e) => surChange(c.cle, e.target.value.replace(/\D/g, ""))}
              />
            </span>
            <span className="petit">{c.mot}</span>
          </label>
        ))}
      </div>
      {erreur ? <span className="champ__aide-erreur">{erreur}</span> : aide ? <span className="champ__aide">{aide}</span> : null}
    </fieldset>
  );
}

/** Choix du groupe sanguin, avec « Je ne sais pas » (le centre le précisera). */
export function ChoixGroupe({ valeur, inconnu, surChoix, surInconnu, erreur }: {
  valeur: GroupeSanguin | null; inconnu: boolean; erreur?: string;
  surChoix: (g: GroupeSanguin) => void; surInconnu: (v: boolean) => void;
}) {
  return (
    <fieldset className={`champ${erreur ? " champ--erreur" : ""}`} style={{ border: 0, padding: 0, margin: 0 }}>
      <legend className="champ__etiquette" style={{ padding: 0, marginBottom: "var(--e2)" }}>Groupe sanguin</legend>
      <div className="grille-groupes">
        {GROUPES.map((g) => (
          <button key={g} type="button" className="touche-groupe" aria-pressed={valeur === g}
                  disabled={inconnu} onClick={() => surChoix(g)}>{g}</button>
        ))}
      </div>
      <label className="case" style={{ marginTop: "var(--e3)" }}>
        <input type="checkbox" checked={inconnu} onChange={(e) => surInconnu(e.target.checked)} />
        <span>Je ne connais pas mon groupe. Le centre le vérifiera lors de mon premier don.</span>
      </label>
      {erreur && <span className="champ__aide-erreur">{erreur}</span>}
    </fieldset>
  );
}

export function ChoixZone({ zones, valeur, surChoix, erreur }:
  { zones: Zone[]; valeur: string; surChoix: (id: string) => void; erreur?: string }) {
  const id = useId();
  return (
    <Cadre id={id} etiquette="Votre zone" erreur={erreur}
           aide="Le centre prévient en priorité les donneurs proches.">
      <span className="champ__groupe">
        <select id={id} className="champ__saisie" value={valeur} onChange={(e) => surChoix(e.target.value)}
                aria-invalid={!!erreur}>
          <option value="">Choisir un quartier</option>
          {zones.map((z) => <option key={z.id} value={z.id}>{z.nom}, {z.ville}</option>)}
        </select>
      </span>
    </Cadre>
  );
}
