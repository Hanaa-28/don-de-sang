-- Réconcilie le contrat d'API v0.2 avec la table `alerte_reponses`.
--
-- Le contrat expose `venue: { creneau, moyen }` (moyen = a_pied / deux_roues /
-- transport_commun), alors que l'Annexe B ne stockait qu'un booléen
-- `besoin_transport`. On ajoute la colonne qui porte l'information complète,
-- sans rien supprimer : `besoin_transport` reste et se dérive du moyen.
--
-- `moment_passage` continue de porter le créneau (08h-10h…).

alter table alerte_reponses
  add column moyen_deplacement text
  check (moyen_deplacement in ('a_pied', 'deux_roues', 'transport_commun'));
