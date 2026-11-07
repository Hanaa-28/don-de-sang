// Point d'entrée serverless (Vercel) : Vercel détecte les fichiers du dossier
// `api/` comme des fonctions et enveloppe l'application Express exportée ici.
// En local, c'est `src/index.ts` qui fait `app.listen()`.
import { app } from "../src/app.js";

export default app;
