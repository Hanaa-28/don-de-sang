#!/usr/bin/env bash
# Crée les étiquettes et les jalons J1 à J7 sur le dépôt GitHub.
# Prérequis : GitHub CLI (https://cli.github.com) et `gh auth login`.
# Usage : ./scripts/configurer-github.sh proprietaire/don-de-sang
set -euo pipefail
REPO="${1:?Usage : $0 proprietaire/depot}"

etiquette() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force; }
etiquette "gravité: bloquant" "b60205" "Empêche le scénario complet"
etiquette "gravité: majeur"   "d93f0b" "Fonctionnalité dégradée"
etiquette "gravité: mineur"   "fbca04" "Gêne visuelle ou confort"
etiquette "zone: donneur"     "1d76db" "Application des donneurs"
etiquette "zone: agent"       "5319e7" "Espace agent"
etiquette "zone: admin"       "0e8a16" "Espace administrateur"
etiquette "zone: backend"     "006b75" "Backend / API"
etiquette "zone: bdd"         "c5def5" "Base de données"
etiquette "contrat-api"       "e99695" "Modifie le contrat d'API"
etiquette "tâche"             "ededed" "Tâche du calendrier"

jalon() {
  gh api "repos/$REPO/milestones" -f title="$1" -f due_on="$2T23:59:59Z" -f description="$3" >/dev/null \
    && echo "Jalon créé : $1"
}
jalon "J1" "2026-10-25" "Cahier des charges validé, contrat d'API figé, exemples JSON livrés"
jalon "J2" "2026-11-01" "Maquettes validées, 28 tables sur Supabase, connexion fonctionnelle"
jalon "J3" "2026-11-15" "Routes de l'application des donneurs sur le vrai backend"
jalon "J4" "2026-11-29" "Application des donneurs entièrement branchée"
jalon "J5" "2026-12-06" "Fonctionnalités de priorité 1 (P1 à P10) disponibles"
jalon "J6" "2026-12-13" "Scénario complet OK, aucun bug bloquant"
jalon "J7" "2026-12-20" "Prototype en ligne, testé en centre pilote, documenté"

echo "Terminé. Pensez à protéger les branches main et develop (Settings > Branches)."
