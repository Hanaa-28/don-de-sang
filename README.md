# Plateforme numérique de don de sang et de traçabilité des poches

Institut 2iE · Programme de bourses de la Fondation Mastercard · Activité Give Back
Développement du **19 octobre au 20 décembre 2026** (9 semaines, 7 jalons).

## Structure du dépôt

```
apps/
  donneur/          Application des donneurs (Next.js, PWA)        Hanaa, Johanne
  plateforme/       Espace agent + espace administrateur (Next.js) Solange, Zozerigué
backend/            API Express + Supabase                         Zozerigué
packages/
  contrat-api/      Types et exemples JSON partagés (source de vérité)
supabase/           Migrations SQL (28 tables) et données de test
docs/               Cahier des charges, calendrier, décisions, fusion des projets existants
scripts/            Outils (configuration GitHub)
```

Un seul dépôt pour tout le projet : le contrat d'API est partagé directement entre le backend
et les frontends, et une seule Pull Request peut modifier une route et l'écran qui l'utilise.

## Démarrer

Prérequis : Node.js 22 (`nvm use`) et Git.

```bash
git clone <url-du-depot>
cd don-de-sang
npm install                      # installe tout le monorepo en une fois

cp apps/donneur/.env.example    apps/donneur/.env.local
cp apps/plateforme/.env.example apps/plateforme/.env.local
cp backend/.env.example         backend/.env

npm run dev:donneur      # http://localhost:3000
npm run dev:plateforme   # http://localhost:3001
npm run dev:backend      # http://localhost:4000/sante
```

## Jalons

| Jalon | Date | Ce qui doit être prêt |
|---|---|---|
| J1 | dim. 25 oct. | Cahier des charges validé, contrat d'API figé, exemples JSON livrés |
| J2 | dim. 1er nov. | Maquettes validées, 28 tables sur Supabase, connexion fonctionnelle |
| J3 | dim. 15 nov. | Toutes les routes de l'application des donneurs sur le vrai backend |
| J4 | dim. 29 nov. | Application des donneurs entièrement branchée |
| J5 | dim. 6 déc. | Fonctionnalités de priorité 1 (P1 à P10) disponibles |
| J6 | dim. 13 déc. | Scénario complet OK, aucun bug bloquant |
| J7 | dim. 20 déc. | Prototype en ligne, testé en centre pilote, documenté |

Détails : [docs/calendrier.md](docs/calendrier.md). Règles de travail : [CONTRIBUTING.md](CONTRIBUTING.md).
