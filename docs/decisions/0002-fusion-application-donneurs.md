# Décision 0002 : fusion des deux prototypes pour l'application des donneurs

Date : 22 octobre 2026 · Statut : proposée (à valider en point d'équipe)

## Contexte
Deux prototypes existent : DJIGUI (Next.js, PWA donneur + espaces pro, backend Express/MariaDB)
et CNTS-Registering (Vite/React, registre des collectes côté centre, règles validées par le CNTS).

## Décision
- L'application des donneurs (`apps/donneur`) repart de zéro en TypeScript dans le monorepo,
  en reprenant de DJIGUI l'identité visuelle et les parcours, et de CNTS-Registering les règles métier.
- La vérification du numéro et la récupération du mot de passe passent par un code WhatsApp
  (cahier des charges), et non par la question de sécurité de DJIGUI.
- Les règles médicales (délai entre deux dons, éligibilité) sont calculées par le backend ;
  l'application affiche ce qu'il renvoie. Le simulateur applique 3 mois (homme) / 4 mois (femme)
  en attendant l'Annexe E.
- Le motif d'un ajournement n'est jamais transmis à l'application (règle CNTS).

## Conséquences
- Le contrat d'API passe en v0.2 (19 routes donneur) : relecture de Zozerigué nécessaire.
- Le code de DJIGUI n'est pas copié tel quel : ses écrans pro (gestion, administration)
  serviront de référence à Solange et Zozerigué pour `apps/plateforme`.

## Ajout du 2 novembre 2026 : campagnes de collecte
- Trois pages publiques (C0 à C2) permettent à une structure de proposer une collecte au CNTS et d'en suivre la réponse,
  reprises de la page « Demandes » de CNTS-Registering.
- Contrat : `POST /campagnes/demandes`, `POST /campagnes/demandes/suivi` (public) ; côté CNTS
  `GET` et `PATCH /gestion/campagnes/demandes`.
- À décider en point d'équipe : priorité (P1 ou P2), responsable de l'écran agent, valeurs minimales avec le CNTS.
