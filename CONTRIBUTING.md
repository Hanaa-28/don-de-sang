# Comment on travaille

## Branches

```
main       version livrable, protégée. Mise à jour à chaque jalon.
develop    branche d'intégration, protégée. Toutes les PR arrivent ici.
feature/…  une branche par tâche, partie de develop.
fix/…      une correction de bug.
```

Nom des branches : `<type>/<zone>-<sujet>`, par exemple
`feature/donneur-d3-inscription`, `feature/backend-routes-alertes`,
`feature/agent-p3-prelevement`, `fix/backend-code-controle`.

## Cycle d'une tâche

1. Créer (ou prendre) l'issue GitHub de la tâche.
2. `git checkout develop && git pull` puis `git checkout -b feature/zone-sujet`.
3. Commits petits et fréquents.
4. **Chaque fin de semaine, pousser son travail**, même non terminé (`git push`), et ouvrir une PR en brouillon.
5. PR vers `develop`, relue par au moins une autre personne (voir `.github/CODEOWNERS`).
6. Fusion en « Squash and merge », puis suppression de la branche.

## Messages de commit

Format : `type(zone): description à l'infinitif`

| type | usage |
|---|---|
| `feat` | nouvelle fonctionnalité |
| `fix` | correction |
| `docs` | documentation |
| `style` | mise en forme, sans changement de logique |
| `refactor` | réorganisation du code |
| `chore` | configuration, dépendances |

Zones : `donneur`, `agent`, `admin`, `backend`, `bdd`, `contrat`, `ci`.
Exemple : `feat(donneur): ajouter l'écran D5 de connexion`.

## Contrat d'API

Toute route nouvelle ou modifiée passe d'abord par `packages/contrat-api`
(type TypeScript + exemple JSON), dans la même PR ou avant. Après J1, le changement est annoncé en point d'équipe.

## Secrets

Jamais de `.env`, de clé Supabase ou de jeton WhatsApp dans Git. Seuls les `.env.example` sont commités.

## Bugs (semaine 8)

Chaque bug est une issue avec le modèle « Bug » et sa gravité : bloquant, majeur ou mineur.
