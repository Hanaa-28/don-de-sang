import type { NextConfig } from "next";

const config: NextConfig = {
  // Le contrat d'API est du TypeScript brut : Next doit le compiler.
  transpilePackages: ["@dds/contrat-api"],
  // L'agent de service ne doit jamais être mis en cache par le navigateur,
  // sinon une nouvelle version de l'application ne s'installerait pas.
  async headers() {
    return [
      {
        source: "/service-worker.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default config;
