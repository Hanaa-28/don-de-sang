-- Séquence pour les numéros de donneur (DDS-2026-000123).
-- Indépendante de la table pour rester atomique et sans trou sous concurrence.
create sequence if not exists numero_donneur_seq start 1;
