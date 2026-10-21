import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigines: (process.env.CORS_ORIGINES ?? "http://localhost:3000,http://localhost:3001").split(","),
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseCle: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
};
