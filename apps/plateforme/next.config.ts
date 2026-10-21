import type { NextConfig } from "next";

const config: NextConfig = {
  // Le contrat d'API est du TypeScript brut : Next doit le compiler.
  transpilePackages: ["@dds/contrat-api"],
};

export default config;
