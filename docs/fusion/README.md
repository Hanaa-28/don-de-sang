# Fusion des deux projets existants

Deux applications traitant déjà le sujet existent. On ne les fusionne **pas** en copiant leur code
tel quel : on les analyse, on garde le meilleur, et on le réécrit dans la structure de ce dépôt.

## Où mettre les anciens projets

Pas dans ce dépôt. Chaque ancien projet reste dans son propre dépôt (ou une archive),
et on le cite ici par son lien. Cela évite de mélanger deux historiques et deux jeux de dépendances.

- Projet A : <lien>
- Projet B : <lien>

## Grille d'analyse (une copie par projet : `projet-a.md`, `projet-b.md`)

| Élément | Projet A | Projet B | Décision |
|---|---|---|---|
| Technologies (front, back, base) | | | |
| Écrans existants (correspondance D1-D14, P1-P10) | | | |
| Tables de la base (correspondance avec les 28 tables) | | | |
| Routes d'API existantes | | | |
| Ce qui marche bien | | | |
| Ce qui est à jeter | | | |
| Composants ou logique réutilisables | | | |

## Décision

Pour chaque écran et chaque route du cahier des charges, noter :
**reprendre de A**, **reprendre de B**, ou **écrire de zéro**.
Chaque décision importante est consignée dans `docs/decisions/`.
