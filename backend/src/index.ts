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

const app = express();
app.use(helmet());
app.use(cors({ origin: config.corsOrigines }));
app.use(express.json());

app.use("/sante", routeSante);
app.use("/auth", routeAuth);

// Référentiels publics (zones, centres).
app.use("/", routeReferentiels);

// Application des donneurs (D8 à D14) — accès donneur connecté uniquement.
app.use("/donneurs/moi", authentifier, exigerDonneur, routeDonneurs);
app.use("/alertes", authentifier, exigerDonneur, routeAlertes);

// Plateforme — agent d'accueil (P3).
app.use("/donneurs", authentifier, exigerRole("agent_accueil", "admin"), routeGestion);

// À venir : /poches /labo (S5), /stock /distribution (S6), /tracabilite (S7)

app.use(gestionErreurs);

app.listen(config.port, () => {
  console.log(`Backend démarré sur http://localhost:${config.port}`);
});
