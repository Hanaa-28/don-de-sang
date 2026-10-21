# Application des donneurs (PWA)

Responsables : Hanaa, Johanne. Port local : **3000**.

```bash
cp .env.example .env.local
npm run dev:donneur   # depuis la racine du dépôt
```

- `src/app/` : un dossier par écran (D1 à D14), selon le routage de Next.js.
- `src/components/` : composants réutilisables (boutons, champs, cartes…).
- `src/lib/api.ts` : **le seul endroit** où l'on parle au backend. Les écrans appellent `api.xxx()`.
- `NEXT_PUBLIC_UTILISER_EXEMPLES=true` en S3-S4, `false` à partir de S5.

| Écran | Route prévue |
|---|---|
| D1 Ouverture | `/` |
| D2 Bienvenue | `/bienvenue` |
| D3 Inscription | `/inscription` |
| D4 Vérification du numéro | `/verification` |
| D5 Connexion | `/connexion` |
| D6 Mot de passe oublié | `/mot-de-passe-oublie` |
| D7 Nouveau mot de passe | `/nouveau-mot-de-passe` |
| D8 Carte de donneur | `/carte` |
| D9 Alertes | `/alertes` |
| D10 Réponse à une alerte | `/alertes/[id]` |
| D11 Historique | `/historique` |
| D12 Centres | `/centres` |
| D13 Profil | `/profil` |
| D14 Notifications | `/notifications` |
