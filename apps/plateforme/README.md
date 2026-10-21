# Plateforme (espace agent + espace administrateur)

Responsables : Solange (espace agent), Zozerigué (espace administrateur). Port local : **3001**.

```bash
cp .env.example .env.local
npm run dev:plateforme   # depuis la racine du dépôt
```

| Fonction | Route prévue | Semaine |
|---|---|---|
| Connexion, tableau de bord | `/`, `/agent` | S3 |
| Alertes (P7) | `/agent/alertes` | S4 |
| Accueil et prélèvement, étiquettes (P3) | `/agent/prelevement` | S5 |
| Laboratoire (P4), préparation (P5) | `/agent/laboratoire`, `/agent/preparation` | S6 |
| Stock (P6) | `/agent/stock` | S6 |
| Distribution (P8) | `/agent/distribution` | S7 |
| Fiche de traçabilité (P9) | `/agent/tracabilite/[code]` | S7 |
| Délivrance aux services (P10) | `/agent/delivrance` | S7 |
| Comptes et rôles (P1), centres et dépôts (P2) | `/admin/comptes`, `/admin/sites` | S6 |
| Seuils, conservation, règles, journal | `/admin/parametres`, `/admin/journal` | S7 |
