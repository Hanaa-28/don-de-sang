# Contrat d'API

C'est **la source de vérité** entre le backend et les deux interfaces (jalon J1).

- `src/index.ts` : les types TypeScript des requêtes et réponses, importés par le backend **et** par les frontends.
- `exemples/` : une réponse JSON d'exemple par route de l'application des donneurs.
  L'application les utilise en semaines 3 et 4, avant que le backend soit prêt.

## Règle d'or
Toute modification d'une route passe par une Pull Request qui modifie ce dossier,
relue par Zozerigué **et** par la personne du frontend concernée.
Après le jalon J1 (25 octobre), le contrat est figé : un changement se discute en point d'équipe.

## Format des réponses
Succès : `{ "donnees": ... }` — Échec : `{ "erreur": { "code": "...", "message": "...", "champ": "..." } }`

`champ` (facultatif) nomme le champ de la requête en cause : l'application affiche alors l'erreur sous ce champ.

## Routes de l'application des donneurs (v0.2)

| Écran | Méthode | Route | Corps | Réponse | Exemple |
|---|---|---|---|---|---|
| D3 | GET | `/zones` (public) | — | `Zone[]` | `zones.json` |
| D3 | POST | `/auth/inscription` | `InscriptionDonneurRequete` | `CodeEnvoye` | `code-envoye.json` |
| D4 | POST | `/auth/verification` | `VerificationRequete` | `ConnexionReponse` | `connexion.json` |
| D4, D7 | POST | `/auth/code/renvoi` | `RenvoiCodeRequete` | `CodeEnvoye` | `code-envoye.json` |
| D5 | POST | `/auth/connexion` | `ConnexionRequete` | `ConnexionReponse` | `connexion.json` |
| D6 | POST | `/auth/mot-de-passe-oublie` | `MotDePasseOublieRequete` | `CodeEnvoye` | `code-envoye.json` |
| D7 | POST | `/auth/nouveau-mot-de-passe` | `NouveauMotDePasseRequete` | `null` | — |
| D13 | GET | `/donneurs/moi` | — | `ProfilDonneur` | `profil.json` |
| D13 | PATCH | `/donneurs/moi` | `ModifierProfilRequete` | `ProfilDonneur` | `profil.json` |
| D13 | PUT | `/donneurs/moi/pause` | `MiseEnPauseRequete` | `ProfilDonneur` | `profil.json` |
| D13 | PUT | `/donneurs/moi/mot-de-passe` | `ChangerMotDePasseRequete` | `null` | — |
| D8 | GET | `/donneurs/moi/carte` | — | `CarteDonneur` | `carte.json` |
| D9 | GET | `/donneurs/moi/alertes` | — | `Alerte[]` | `alertes.json` |
| D10 | GET | `/donneurs/moi/alertes/:id` | — | `Alerte` | un élément de `alertes.json` |
| D9, D10 | POST | `/alertes/:id/reponse` | `RepondreAlerteRequete` | `Alerte` | — |
| D11 | GET | `/donneurs/moi/historique` | — | `DonHistorique[]` | `historique.json` |
| D12 | GET | `/centres` | — | `Centre[]` | `centres.json` |
| D14 | GET | `/donneurs/moi/notifications` | — | `Notification[]` | `notifications.json` |
| D14 | POST | `/donneurs/moi/notifications/lues` | `MarquerLuesRequete` | `null` | — |
| C1 | POST | `/campagnes/demandes` (public) | `DemandeCampagneRequete` | `DemandeCampagne` | `demande-campagne.json` |
| C2 | POST | `/campagnes/demandes/suivi` (public) | `SuiviDemandeCampagneRequete` | `DemandeCampagne` | `demande-campagne.json` |

### Campagnes de collecte — côté CNTS (espace agent)

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| GET | `/gestion/campagnes/demandes` | — | `DemandeCampagne[]` |
| PATCH | `/gestion/campagnes/demandes/:id` | `TraiterDemandeCampagneRequete` | `DemandeCampagne` |

Accepter une demande crée une séance de collecte. Fonctionnalité reprise du prototype CNTS-Registering,
ajoutée après le calendrier initial : **à valider en point d'équipe** (priorité et responsable de l'écran agent).

## Règles métier attendues côté backend

- **Vérification du numéro** : code à 6 chiffres envoyé par WhatsApp, valable `expireDans` secondes.
- **Mot de passe oublié** : même réponse que le numéro soit inscrit ou non.
- **Carte** : `eligible` et `prochainDonPossible` sont calculés par le backend avec les délais de l'Annexe E
  (en attendant le CNTS : 3 mois pour un homme, 4 mois pour une femme, valeurs confirmées pour le prototype CNTS-Registering).
- **Alertes** : un donneur en pause, non éligible ou hors zone ne reçoit pas l'alerte ; une alerte par semaine au plus.
- **Historique** : le motif d'un ajournement n'est jamais transmis (règle CNTS de confidentialité).

## Codes d'erreur
Voir le type `CodeErreur` dans `src/index.ts`.
