// Point d'entrée serverless (Vercel). Un handler explicite délègue à
// l'application Express : cela fait fonctionner le catch-all `[...path]` sur
// toutes les profondeurs (Vercel ne route qu'un segment vers un export
// Express direct). En local, c'est `src/index.ts` qui fait `app.listen()`.
import type { IncomingMessage, ServerResponse } from "node:http";
import { app } from "../src/app.js";

export default function handler(req: IncomingMessage, res: ServerResponse) {
  return app(req, res);
}
