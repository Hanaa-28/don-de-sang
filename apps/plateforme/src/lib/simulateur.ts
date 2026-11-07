/**
 * Simulateur du backend pour l'espace agent (NEXT_PUBLIC_UTILISER_EXEMPLES=true).
 *
 * Même principe que apps/donneur/src/lib/simulateur.ts : il part des
 * exemples JSON du contrat d'API et se comporte comme le vrai backend.
 *
 * Compte de démonstration
 *   E-mail agent@cnts.bf, mot de passe « agent2026 »
 *   (rôle agent_stock, site CNTS Ouagadougou — cf. exemples/tableau-de-bord-agent.json)
 */
import type { AgentConnexionReponse, Reponse, TableauDeBordAgent } from "@dds/contrat-api";
import type { ApiPlateforme } from "./api";
import { ErreurApi } from "./erreurs";

import exTableauDeBord from "@dds/contrat-api/exemples/tableau-de-bord-agent.json";

const EMAIL_DEMO = "agent@cnts.bf";
const MOT_DE_PASSE_DEMO = "agent2026";
const LATENCE_MS = 450;

const donnees = <T,>(json: unknown) => structuredClone((json as Reponse<T>).donnees);

const attendre = <T,>(valeur: T): Promise<T> =>
  new Promise((r) => setTimeout(() => r(structuredClone(valeur)), LATENCE_MS));

const echec = (message: string, code: ErreurApi["code"], champ?: string): Promise<never> =>
  new Promise((_, rejeter) => setTimeout(() => rejeter(new ErreurApi(message, code, champ)), LATENCE_MS));

export const simulateur: ApiPlateforme = {
  connexion(email, motDePasse) {
    if (email.trim().toLowerCase() !== EMAIL_DEMO || motDePasse !== MOT_DE_PASSE_DEMO) {
      return echec("Adresse e-mail ou mot de passe incorrect.", "IDENTIFIANTS_INVALIDES");
    }
    const reponse: AgentConnexionReponse = {
      jeton: "simulateur.agent_demo",
      utilisateur: {
        id: "a_demo",
        nomComplet: "Agent de démonstration",
        email: EMAIL_DEMO,
        roles: ["agent_stock"],
        siteId: "s_ouaga_cnts",
      },
    };
    return attendre(reponse);
  },

  tableauDeBord: () => attendre(donnees<TableauDeBordAgent>(exTableauDeBord)),
};
