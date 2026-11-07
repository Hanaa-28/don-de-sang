-- =====================================================================
-- Schéma initial : les 28 tables du cahier des charges (Annexe B).
-- Jalon J2 (1er novembre) — écrit par Zozerigué.
--
-- Deux règles d'or (cahier des charges, Annexe B) :
--   1. On ne supprime JAMAIS une ligne : on change son statut (actif, statut…).
--   2. Chaque action est inscrite dans la table `evenements`, immuable.
--
-- Conventions :
--   - Identifiants : uuid (gen_random_uuid()), clés primaires auto.
--   - Horodatage : timestamptz, en UTC.
--   - Énumérations : colonnes text + CHECK (jamais de type ENUM, pour rester
--     simple à étendre dans le SQL Editor de Supabase).
--   - Les valeurs « à définir » (Annexe E) sont stockées dans `regles` ou
--     laissées ajustables ; rien n'est codé en dur dans le schéma.
-- =====================================================================

create extension if not exists pgcrypto;

-- =====================================================================
-- Bloc 1. Organisation
-- =====================================================================

create table zones (
  id       uuid primary key default gen_random_uuid(),
  nom      text not null,           -- quartier ou secteur
  ville    text not null,
  cree_le  timestamptz not null default now(),
  unique (nom, ville)
);

create table sites (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique
             check (code ~ '^[A-Z]{3}$'),      -- code centre à 3 lettres
  nom        text not null,
  type       text not null check (type in ('centre', 'depot', 'hopital')),
  adresse    text not null default '',
  zone_id    uuid references zones(id),
  telephone  text not null default '',
  horaires   text not null default '',
  actif      boolean not null default true,     -- jamais supprimé : désactivé
  cree_le    timestamptz not null default now()
);

create table utilisateurs (
  id          uuid primary key default gen_random_uuid(),
  nom         text not null,
  prenom      text not null,
  email       text not null unique,
  telephone   text not null default '',
  mot_de_passe text not null,                   -- hash bcrypt, jamais en clair
  site_id     uuid not null references sites(id),
  actif       boolean not null default true,    -- jamais supprimé : désactivé
  cree_le     timestamptz not null default now()
);

-- Un agent peut porter plusieurs rôles (cahier des charges, Partie II).
create table utilisateur_roles (
  utilisateur_id uuid not null references utilisateurs(id) on delete cascade,
  role text not null check (role in (
    'agent_accueil', 'agent_prelevement', 'agent_labo',
    'agent_stock', 'agent_depot', 'admin'
  )),
  primary key (utilisateur_id, role)
);

-- =====================================================================
-- Bloc 2. Donneurs
-- =====================================================================

create table donneurs (
  id                        uuid primary key default gen_random_uuid(),
  numero_donneur            text not null unique,          -- ex. DDS-2026-000123
  nom                       text not null,
  prenom                    text not null,
  sexe                      text not null check (sexe in ('F', 'M')),
  date_naissance            date not null,
  telephone                 text not null unique,          -- E.164 : +226XXXXXXXX
  telephone_verifie         boolean not null default false,
  mot_de_passe              text,                          -- hash bcrypt (null tant que l'app ne l'a pas créé)
  doit_changer_mot_de_passe boolean not null default false, -- après réinitialisation par un agent
  zone_id                   uuid references zones(id),
  groupe_sanguin            text check (groupe_sanguin in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  -- canaux : moyens par lesquels le donneur accepte d'être contacté (contrat v0.2)
  canaux                    text[] not null default '{}'
                            check (canaux <@ array['whatsapp','sms','appel']::text[]),
  prochaine_eligibilite     date,                          -- calculée après chaque don
  pause_jusquau             date,                          -- null si pas en pause
  origine                   text not null check (origine in ('application', 'sur_place')),
  actif                     boolean not null default true,
  cree_le                   timestamptz not null default now()
);

-- Code de vérification (numéro ou mot de passe), chiffré, jamais en clair.
create table codes_verification (
  id            uuid primary key default gen_random_uuid(),
  donneur_id    uuid not null references donneurs(id) on delete cascade,
  code          text not null,                            -- hash (bcrypt), pas le code en clair
  canal         text not null check (canal in ('whatsapp', 'sms')),
  usage         text not null check (usage in ('verification_numero', 'mot_de_passe')),
  expiration    timestamptz not null,
  nombre_essais integer not null default 0,
  utilise       boolean not null default false,
  cree_le       timestamptz not null default now()
);

-- Abonnements Web Push (PWA) : un appareil = une ligne.
create table abonnements_notifications (
  id          uuid primary key default gen_random_uuid(),
  donneur_id  uuid not null references donneurs(id) on delete cascade,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  cree_le     timestamptz not null default now()
);

-- Messages reçus par le donneur (rappel d'éligibilité, « votre don a aidé un patient »…).
create table messages_donneurs (
  id         uuid primary key default gen_random_uuid(),
  donneur_id uuid not null references donneurs(id) on delete cascade,
  type       text not null check (type in ('alerte', 'eligibilite', 'compte', 'info')),
  titre      text not null,
  message    text not null,
  lue        boolean not null default false,
  lien       text,                                        -- écran à ouvrir au toucher, ou null
  cree_le    timestamptz not null default now()
);

-- =====================================================================
-- Bloc 3. Alertes
-- =====================================================================

create table alertes (
  id                 uuid primary key default gen_random_uuid(),
  site_id            uuid not null references sites(id),        -- centre qui lance l'alerte
  groupe_sanguin     text not null check (groupe_sanguin in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  urgence            text not null default 'normale'
                     check (urgence in ('normale', 'urgente', 'critique')), -- niveau choisi par le gestionnaire
  objectif_donneurs  integer not null check (objectif_donneurs > 0),
  date_limite        timestamptz not null,
  statut             text not null default 'ouverte' check (statut in ('ouverte', 'cloturee')),
  agent_id           uuid not null references utilisateurs(id),
  message            text not null default '',
  cree_le            timestamptz not null default now(),
  cloture_le         timestamptz
);

create table alerte_zones (
  alerte_id uuid not null references alertes(id) on delete cascade,
  zone_id   uuid not null references zones(id),
  primary key (alerte_id, zone_id)
);

-- Sert à la règle « une alerte par donneur et par semaine ».
create table alerte_envois (
  id         uuid primary key default gen_random_uuid(),
  alerte_id  uuid not null references alertes(id) on delete cascade,
  donneur_id uuid not null references donneurs(id),
  envoye_le  timestamptz not null default now(),
  unique (alerte_id, donneur_id)
);

create table alerte_reponses (
  id             uuid primary key default gen_random_uuid(),
  alerte_id      uuid not null references alertes(id) on delete cascade,
  donneur_id     uuid not null references donneurs(id),
  reponse        text not null check (reponse in ('je_viens', 'pas_disponible')),
  moment_passage text,                              -- créneau (08h-10h…) ou jour ; « à définir » finement
  besoin_transport boolean not null default false,
  motif_refus    text check (motif_refus in ('don_recent', 'absent', 'sante', 'autre')),
  repondu_le     timestamptz not null default now(),
  unique (alerte_id, donneur_id)
);

-- =====================================================================
-- Bloc 4. Collecte et laboratoire
-- =====================================================================

create table passages (
  id                uuid primary key default gen_random_uuid(),
  donneur_id        uuid not null references donneurs(id),
  site_id           uuid not null references sites(id),     -- centre de la venue
  date              date not null default current_date,
  resultat          text not null check (resultat in ('apte', 'ajourne')),
  ajourne_jusquau   date,                                   -- si ajourné : date de reprise
  alerte_id         uuid references alertes(id),            -- alerte d'origine, si venue suite à une alerte
  agent_id          uuid not null references utilisateurs(id),
  cree_le           timestamptz not null default now()
);

create table poches (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,              -- ex. OUA-26-04812-K
  donneur_id  uuid not null references donneurs(id),
  passage_id  uuid not null references passages(id),
  site_id     uuid not null references sites(id),
  date        date not null default current_date,
  volume      integer,                           -- millilitres
  statut      text not null default 'prelevee'
              check (statut in ('prelevee','en_analyse','conforme','non_conforme','preparee','detruite')),
  cree_le     timestamptz not null default now()
);

-- Dernier numéro de poche utilisé par centre et par année (code OUA-26-04812-K).
create table compteurs_codes (
  site_id        uuid not null references sites(id),
  annee          integer not null,
  dernier_numero integer not null default 0,
  primary key (site_id, annee)
);

create table analyses (
  id             uuid primary key default gen_random_uuid(),
  poche_id       uuid not null references poches(id),
  groupe_sanguin text not null check (groupe_sanguin in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  resultat       text not null check (resultat in ('conforme', 'non_conforme')),
  technicien_id  uuid not null references utilisateurs(id),
  date           date not null default current_date,
  cree_le        timestamptz not null default now()
);

-- Donneurs à recontacter par un médecin. Accès restreint (personnel médical).
create table suivis_medicaux (
  id          uuid primary key default gen_random_uuid(),
  donneur_id  uuid not null references donneurs(id),
  motif       text not null,
  cree_par    uuid not null references utilisateurs(id),
  cree_le     timestamptz not null default now(),
  traite_le   timestamptz
);

-- =====================================================================
-- Bloc 5. Produits et stock
-- =====================================================================

create table types_produits (
  id                      uuid primary key default gen_random_uuid(),
  code                    text not null unique check (code in ('GR','PL','PQ')),
  nom                     text not null,
  duree_conservation_jours integer            -- Annexe E #3 : « à définir » par le CNTS
);

-- Valeurs réglables sans toucher au code (Annexe E).
create table regles (
  cle         text primary key,               -- ex. 'delai_homme_mois'
  valeur      text not null,
  description text not null default ''
);

create table produits (
  id               uuid primary key default gen_random_uuid(),
  code             text not null unique,       -- ex. OUA-26-04812-K-GR
  poche_id         uuid not null references poches(id),
  type_produit_id  uuid not null references types_produits(id),
  groupe_sanguin   text not null check (groupe_sanguin in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  date_peremption  date,
  statut           text not null default 'disponible'
                   check (statut in ('disponible','reserve','expedie','recu','delivre','perime','detruit')),
  site_actuel_id   uuid not null references sites(id),  -- le site qui détient le produit
  cree_le          timestamptz not null default now()
);

create table seuils_stock (
  id               uuid primary key default gen_random_uuid(),
  site_id          uuid not null references sites(id),
  type_produit_id  uuid not null references types_produits(id),
  groupe_sanguin   text not null check (groupe_sanguin in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  seuil_bas        integer not null check (seuil_bas >= 0),
  seuil_critique   integer not null check (seuil_critique >= 0),
  unique (site_id, type_produit_id, groupe_sanguin)
);

-- =====================================================================
-- Bloc 6. Distribution et patient
-- =====================================================================

create table demandes (
  id                 uuid primary key default gen_random_uuid(),
  site_demandeur_id  uuid not null references sites(id),   -- dépôt/hôpital qui demande
  site_fournisseur_id uuid not null references sites(id),  -- centre qui fournit
  urgence            text not null default 'normale' check (urgence in ('normale','urgente','critique')),
  statut             text not null default 'en_attente'
                     check (statut in ('en_attente','preparee','expediee','receptionnee','annulee')),
  agent_id           uuid not null references utilisateurs(id),
  date               date not null default current_date,
  cree_le            timestamptz not null default now()
);

create table demande_lignes (
  id               uuid primary key default gen_random_uuid(),
  demande_id       uuid not null references demandes(id) on delete cascade,
  type_produit_id  uuid not null references types_produits(id),
  groupe_sanguin   text not null check (groupe_sanguin in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  quantite         integer not null check (quantite > 0)
);

create table expeditions (
  id                   uuid primary key default gen_random_uuid(),
  demande_id           uuid references demandes(id),
  site_depart_id       uuid not null references sites(id),
  site_arrivee_id      uuid not null references sites(id),
  date_envoi           timestamptz,
  date_reception       timestamptz,
  agent_envoi_id       uuid references utilisateurs(id),
  agent_reception_id   uuid references utilisateurs(id),
  cree_le              timestamptz not null default now()
);

create table expedition_produits (
  expedition_id uuid not null references expeditions(id) on delete cascade,
  produit_id    uuid not null references produits(id),
  recu          boolean not null default false,
  primary key (expedition_id, produit_id)
);

create table delivrances (
  id         uuid primary key default gen_random_uuid(),
  produit_id uuid not null references produits(id),
  service    text not null,                   -- urgences, maternité, chirurgie… (jamais de patient)
  date       date not null default current_date,
  agent_id   uuid not null references utilisateurs(id),
  cree_le    timestamptz not null default now()
);

-- Priorité 2 : réactions après transfusion, rappel de lot.
create table incidents (
  id            uuid primary key default gen_random_uuid(),
  delivrance_id uuid references delivrances(id),
  description   text not null,
  gravite       text not null check (gravite in ('faible','moyenne','grave')),
  date          date not null default current_date,
  agent_id      uuid not null references utilisateurs(id),
  cree_le       timestamptz not null default now()
);

-- =====================================================================
-- Bloc 7. Journal (traçabilité)
-- =====================================================================

create table evenements (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in (
    'prelevement', 'analyse', 'preparation', 'expedition', 'reception',
    'delivrance', 'destruction', 'reinitialisation', 'inscription',
    'connexion', 'alerte', 'cloture_alerte', 'pause', 'modification'
  )),
  poche_id    uuid references poches(id),
  produit_id  uuid references produits(id),
  donneur_id  uuid references donneurs(id),
  site_id     uuid references sites(id),
  agent_id    uuid references utilisateurs(id),
  date        timestamptz not null default now(),
  details     jsonb not null default '{}'::jsonb
);

-- Le journal ne peut être ni modifié ni effacé, même par un administrateur.
create or replace function interdire_modification_evenements()
returns trigger language plpgsql as $$
begin
  raise exception 'La table evenements est immuable : elle ne peut être ni modifiée ni effacée.';
end $$;

create trigger evenements_immuable
  before update or delete on evenements
  for each row execute function interdire_modification_evenements();

-- =====================================================================
-- Index (jointures fréquentes et recherches par code / téléphone)
-- =====================================================================

create index idx_sites_zone         on sites(zone_id);
create index idx_utilisateurs_site  on utilisateurs(site_id);
create index idx_donneurs_zone      on donneurs(zone_id);
create index idx_codes_donneur      on codes_verification(donneur_id);
create index idx_messages_donneur   on messages_donneurs(donneur_id);
create index idx_abonnements_donneur on abonnements_notifications(donneur_id);

create index idx_alertes_site       on alertes(site_id);
create index idx_alertes_agent      on alertes(agent_id);
create index idx_alerte_envois_donneur on alerte_envois(donneur_id);
create index idx_alerte_reponses_donneur on alerte_reponses(donneur_id);

create index idx_passages_donneur   on passages(donneur_id);
create index idx_passages_site      on passages(site_id);
create index idx_poches_donneur     on poches(donneur_id);
create index idx_poches_passage     on poches(passage_id);
create index idx_poches_site        on poches(site_id);
create index idx_analyses_poche     on analyses(poche_id);

create index idx_produits_poche     on produits(poche_id);
create index idx_produits_type      on produits(type_produit_id);
create index idx_produits_site      on produits(site_actuel_id);
create index idx_produits_statut    on produits(statut);

create index idx_demande_lignes_demande on demande_lignes(demande_id);
create index idx_expeditions_demande on expeditions(demande_id);
create index idx_delivrances_produit on delivrances(produit_id);

create index idx_evenements_poche   on evenements(poche_id);
create index idx_evenements_produit on evenements(produit_id);
create index idx_evenements_donneur on evenements(donneur_id);

-- =====================================================================
-- Sécurité : seul le backend (clé service_role) accède à la base.
-- RLS activée sans policy = fermeture totale pour les clés anon/authenticated.
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'zones','sites','utilisateurs','utilisateur_roles',
    'donneurs','codes_verification','abonnements_notifications','messages_donneurs',
    'alertes','alerte_zones','alerte_envois','alerte_reponses',
    'passages','poches','compteurs_codes','analyses','suivis_medicaux',
    'types_produits','regles','produits','seuils_stock',
    'demandes','demande_lignes','expeditions','expedition_produits',
    'delivrances','incidents','evenements'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;
