-- docs/10 §2: initial schema.

CREATE TABLE meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE setting (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL
);

-- docs/10 §2.1 reference data; replaced as a whole when meta.reference_version changes.

CREATE TABLE ref_source (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT
);

-- One row per leaf of a configuration group; id is the dotted path of the leaf.
CREATE TABLE ref_param (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL CHECK (kind IN ('number', 'text', 'boolean', 'null', 'empty_array', 'empty_object')),
  num REAL,
  txt TEXT,
  basis TEXT CHECK (basis IN ('measured', 'derived', 'estimated')),
  source_id TEXT REFERENCES ref_source (id),
  derivation TEXT,
  note TEXT
);

-- Substance pools (state) and boundary accounts (per substep); masses in mg of `unit`.
CREATE TABLE ref_substance (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  medium TEXT NOT NULL CHECK (medium IN ('water', 'sediment', 'land', 'boundary')),
  form TEXT CHECK (form IN ('dissolved', 'particulate')),
  unit TEXT NOT NULL,
  element TEXT CHECK (element IN ('N', 'P')),
  position INTEGER NOT NULL,
  CHECK ((medium = 'boundary') = (form IS NULL))
);

CREATE TABLE ref_archetype (
  id TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  layer TEXT NOT NULL,
  zone TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('biomass', 'cohort')),
  category TEXT NOT NULL,
  metabolic_class TEXT NOT NULL,
  latin_stem TEXT NOT NULL,
  noun_zh TEXT NOT NULL,
  position INTEGER NOT NULL
);

-- One row per leaf of an archetype's data; param_id is the dotted path.
CREATE TABLE ref_archetype_param (
  archetype_id TEXT NOT NULL REFERENCES ref_archetype (id),
  param_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('number', 'text', 'boolean', 'null', 'empty_array', 'empty_object')),
  num REAL,
  txt TEXT,
  basis TEXT CHECK (basis IN ('measured', 'derived', 'estimated')),
  source_id TEXT REFERENCES ref_source (id),
  derivation TEXT,
  note TEXT,
  PRIMARY KEY (archetype_id, param_id)
);

-- Lists attached to an archetype: tag is the list name, position the alternative or order.
CREATE TABLE ref_archetype_tag (
  archetype_id TEXT NOT NULL REFERENCES ref_archetype (id),
  tag TEXT NOT NULL,
  position INTEGER NOT NULL,
  item INTEGER NOT NULL,
  value TEXT NOT NULL,
  weight REAL,
  PRIMARY KEY (archetype_id, tag, position, item)
);

CREATE INDEX ref_archetype_param_by_archetype ON ref_archetype_param (archetype_id);
CREATE INDEX ref_archetype_tag_by_archetype ON ref_archetype_tag (archetype_id);

-- docs/10 §2.2 codex

CREATE TABLE codex_species (
  species_id TEXT PRIMARY KEY,
  archetype_id TEXT NOT NULL,
  parent_id TEXT,
  origin TEXT NOT NULL,
  mutation TEXT NOT NULL,
  rarity_score REAL NOT NULL,
  rarity_tier TEXT NOT NULL,
  scientific_name TEXT NOT NULL,
  common_name TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  first_tank_id INTEGER,
  first_tick INTEGER NOT NULL,
  max_population REAL NOT NULL,
  seen_count INTEGER NOT NULL
);

CREATE TABLE codex_allele (
  species_id TEXT NOT NULL REFERENCES codex_species (species_id),
  locus TEXT NOT NULL,
  allele_index INTEGER NOT NULL,
  PRIMARY KEY (species_id, locus)
);

CREATE INDEX codex_species_by_archetype ON codex_species (archetype_id);
CREATE INDEX codex_species_by_rarity ON codex_species (rarity_tier);
CREATE INDEX codex_species_by_parent ON codex_species (parent_id);
CREATE INDEX codex_allele_by_value ON codex_allele (locus, allele_index);

-- docs/10 §2.3 tanks

CREATE TABLE tank (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  world_seed TEXT NOT NULL,
  config_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  current_tick INTEGER NOT NULL,
  last_saved_at TEXT NOT NULL,
  active INTEGER NOT NULL,
  state_schema INTEGER NOT NULL
);

CREATE TABLE tank_state (
  tank_id INTEGER PRIMARY KEY REFERENCES tank (id),
  tick INTEGER NOT NULL,
  state_json TEXT NOT NULL
);

CREATE TABLE tank_population (
  tank_id INTEGER NOT NULL REFERENCES tank (id),
  population_id TEXT NOT NULL,
  species_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  established_tick INTEGER,
  extinct_tick INTEGER,
  PRIMARY KEY (tank_id, population_id)
);

CREATE TABLE tank_population_daily (
  tank_id INTEGER NOT NULL REFERENCES tank (id),
  day INTEGER NOT NULL,
  species_id TEXT NOT NULL,
  count REAL NOT NULL,
  biomass REAL NOT NULL,
  juveniles REAL NOT NULL,
  adults REAL NOT NULL,
  senescent REAL NOT NULL,
  trophic_level REAL NOT NULL,
  PRIMARY KEY (tank_id, day, species_id)
);

-- Daily mean of each substance pool (ref_substance) and environment variable.
CREATE TABLE tank_chemistry_daily (
  tank_id INTEGER NOT NULL REFERENCES tank (id),
  day INTEGER NOT NULL,
  variable TEXT NOT NULL,
  value REAL NOT NULL,
  PRIMARY KEY (tank_id, day, variable)
);

-- docs/10 §2.4 logs

CREATE TABLE log_event (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tank_id INTEGER NOT NULL REFERENCES tank (id),
  tick INTEGER NOT NULL,
  level TEXT NOT NULL,
  type TEXT NOT NULL,
  species_id TEXT,
  payload_json TEXT
);

CREATE INDEX log_event_by_tick ON log_event (tank_id, tick);
CREATE INDEX log_event_by_species ON log_event (species_id);

CREATE TABLE log_feeding_daily (
  tank_id INTEGER NOT NULL REFERENCES tank (id),
  day INTEGER NOT NULL,
  prey_node TEXT NOT NULL,
  predator_id TEXT NOT NULL,
  flux REAL NOT NULL,
  PRIMARY KEY (tank_id, day, prey_node, predator_id)
);

CREATE TABLE log_chem_flux_daily (
  tank_id INTEGER NOT NULL REFERENCES tank (id),
  day INTEGER NOT NULL,
  species_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  amount REAL NOT NULL,
  PRIMARY KEY (tank_id, day, species_id, kind)
);
