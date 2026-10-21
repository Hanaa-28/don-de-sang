import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config.js";
import { routeSante } from "./routes/sante.js";
import { gestionErreurs } from "./middlewares/erreurs.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: config.corsOrigines }));
app.use(express.json());

app.use("/sante", routeSante);
// À venir : /auth (S2), /donneurs (S3), /alertes (S4), /poches /labo (S5), /stock /distribution (S6), /tracabilite (S7)

app.use(gestionErreurs);

app.listen(config.port, () => {
  console.log(`Backend démarré sur http://localhost:${config.port}`);
});
