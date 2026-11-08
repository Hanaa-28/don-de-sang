import "dotenv/config";

const DATABASE_URL = process.env.DATABASE_URL ?? "";
const JWT_SECRET = process.env.JWT_SECRET ?? "";

// Le backend ne démarre pas sans ces deux variables : mieux vaut échouer
// immédiatement que de tourner avec une base ou des jetons cassés.
if (!DATABASE_URL) {
  console.error("Variable d'environnement DATABASE_URL manquante (voir backend/.env.example).");
  process.exit(1);
}
if (!JWT_SECRET) {
  console.error("Variable d'environnement JWT_SECRET manquante (voir backend/.env.example).");
  process.exit(1);
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  /** Préfixe des routes. Vide en local ; "/api" sur Vercel (fonctions serverless). */
  apiBasePath: process.env.API_BASE_PATH ?? "",
  corsOrigines: (process.env.CORS_ORIGINES ?? "http://localhost:3000,http://localhost:3001").split(","),
  databaseUrl: DATABASE_URL,
  jwtSecret: JWT_SECRET,
  jwtExpireDans: process.env.JWT_EXPIRES ?? "7d",
  whatsappToken: process.env.WHATSAPP_TOKEN ?? "",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
};
