import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { routeSante } from "./routes/sante.js";
import { routeAuth } from "./routes/auth.js";
import { routeReferentiels } from "./routes/referentiels.js";
import { routeDonneurs } from "./routes/donneurs.js";
import { routeAlertes } from "./routes/alertes.js";
import { routeGestion } from "./routes/gestion.js";
import { authentifier } from "./middlewares/authentification.js";
import { exigerDonneur } from "./middlewares/donneur.js";
import { exigerRole } from "./middlewares/roles.js";
import { gestionErreurs } from "./middlewares/erreurs.js";

/**
 * L'application Express, séparée de l'écoute réseau :
 *   - `src/index.ts` fait `app.listen()` pour le développement local ;
 *   - `api/index.ts` exporte `app` pour un déploiement serverless (Vercel).
 */
export const app = express();
app.use(helmet());
app.use(cors({ origin: config.corsOrigines }));
app.use(express.json());

// Les routes sont montées sous un préfixe (vide en local, "/api" sur Vercel).
const base = config.apiBasePath;

app.use(`${base}/sante`, routeSante);
app.use(`${base}/auth`, routeAuth);

// Référentiels publics (zones, centres).
app.use(`${base}/`, routeReferentiels);

// Application des donneurs (D8 à D14) — accès donneur connecté uniquement.
app.use(`${base}/donneurs/moi`, authentifier, exigerDonneur, routeDonneurs);
app.use(`${base}/alertes`, authentifier, exigerDonneur, routeAlertes);

// Plateforme — agent d'accueil (P3).
app.use(`${base}/donneurs`, authentifier, exigerRole("agent_accueil", "admin"), routeGestion);

// À venir : /poches /labo (S5), /stock /distribution (S6), /tracabilite (S7)

app.use(gestionErreurs);
