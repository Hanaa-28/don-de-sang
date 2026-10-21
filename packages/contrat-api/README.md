# Contrat d'API

C'est **la source de vérité** entre le backend et les deux interfaces (jalon J1).

- `src/` : les types TypeScript des requêtes et réponses, importés par le backend **et** par les frontends.
- `exemples/` : une réponse JSON d'exemple par route de l'application des donneurs.
  L'application les utilise en semaines 3 et 4, avant que le backend soit prêt.

## Règle d'or
Toute modification d'une route passe par une Pull Request qui modifie ce dossier,
relue par Zozerigué **et** par la personne du frontend concernée.
Après le jalon J1 (25 octobre), le contrat est figé : un changement se discute en point d'équipe.

## Format des réponses
Succès : `{ "donnees": ... }` — Échec : `{ "erreur": { "code": "...", "message": "..." } }`

## Routes prévues (application des donneurs)

| Méthode | Route | Exemple |
|---|---|---|
| POST | `/auth/connexion` | `connexion.json` |
| GET | `/donneurs/moi` | `profil.json` |
| GET | `/donneurs/moi/carte` | `carte.json` |
| GET | `/donneurs/moi/alertes` | `alertes.json` |
| POST | `/alertes/:id/reponse` | — |
| GET | `/donneurs/moi/historique` | `historique.json` |
| GET | `/centres` | `centres.json` |
| GET | `/donneurs/moi/notifications` | `notifications.json` |

À compléter en semaine 1 (inscription, vérification du numéro, mot de passe, mise en pause…).
