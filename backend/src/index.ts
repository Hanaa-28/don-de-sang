import { config } from "./config.js";
import { app } from "./app.js";

// Point d'entrée du développement local (et d'un éventuel hébergement
// « serveur long ») : on écoute un port. En serverless (Vercel), c'est
// `api/index.ts` qui exporte l'application, sans `app.listen`.
app.listen(config.port, () => {
  console.log(`Backend démarré sur http://localhost:${config.port}`);
});
