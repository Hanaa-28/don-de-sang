# Décision 0001 : un seul dépôt (monorepo)

Date : 19 octobre 2026 · Statut : acceptée

## Contexte
Trois parties (application des donneurs, plateforme, backend) partagent le même contrat d'API,
et deux binômes doivent avancer en parallèle sans s'attendre.

## Décision
Un seul dépôt GitHub avec des espaces de travail npm : `apps/donneur`, `apps/plateforme`,
`backend`, `packages/contrat-api`.

## Conséquences
- Les types du contrat sont importés directement par le backend et les frontends :
  un changement de route casse la compilation là où il faut.
- Un seul `npm install`, une seule CI.
- `CODEOWNERS` désigne le relecteur de chaque zone.
