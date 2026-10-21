# Backend (Express + Supabase)

Responsable : Zozerigué. Port local : **4000**.

```bash
cp .env.example .env
npm run dev:backend   # depuis la racine du dépôt
curl http://localhost:4000/sante
```

```
src/
  index.ts         point d'entrée
  config.ts        lecture des variables d'environnement
  lib/             clients (Supabase, WhatsApp…)
  middlewares/     erreurs, authentification, rôles
  routes/          un fichier par domaine : auth, donneurs, alertes, poches, labo, stock…
```

Chaque action sur une poche est écrite dans le journal des événements (traçabilité).
