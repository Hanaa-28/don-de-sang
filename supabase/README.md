# Base de données (Supabase / PostgreSQL)

- `migrations/` : fichiers SQL numérotés (`0001_…`, `0002_…`), appliqués dans l'ordre.
- `seed/` : données de test.

Règle : on ne modifie jamais une migration déjà fusionnée dans `develop` ; on en ajoute une nouvelle.
