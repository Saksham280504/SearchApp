-- ============================================================
-- SearchApp Database Schema
-- Run once on a fresh database (all statements are idempotent)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- USERS  (Phase 2 — Auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'viewer'
                  CHECK (role IN ('viewer', 'researcher', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DATASETS
-- ============================================================
CREATE TABLE IF NOT EXISTS datasets (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  location    TEXT,
  river       TEXT,
  uploaded_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STATIONS  (Phase 4 — GIS)
-- ============================================================
CREATE TABLE IF NOT EXISTS stations (
  id          BIGSERIAL PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,  -- e.g. SBW1, SD3, SW7
  name        TEXT,
  source      TEXT,                  -- GW, SW, WW, STP
  sample_file TEXT,                  -- e.g. SBW1_ALL_COMPOUNDS
  river       TEXT,
  district    TEXT,
  state       TEXT,
  latitude    NUMERIC(10, 6),
  longitude   NUMERIC(10, 6),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE stations ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE stations ADD COLUMN IF NOT EXISTS sample_file TEXT;

CREATE INDEX IF NOT EXISTS stations_code_idx ON stations (code);

-- ============================================================
-- SAMPLE FILES
-- ============================================================
CREATE TABLE IF NOT EXISTS sample_files (
  id            BIGSERIAL PRIMARY KEY,
  dataset_id    BIGINT REFERENCES datasets(id) ON DELETE SET NULL,
  file_name     TEXT NOT NULL UNIQUE,
  station_id    BIGINT REFERENCES stations(id) ON DELETE SET NULL,
  station_code  TEXT,
  sampling_date DATE,
  uploaded_by   BIGINT REFERENCES users(id) ON DELETE SET NULL,
  source_type   TEXT NOT NULL DEFAULT 'seed',
  status        TEXT NOT NULL DEFAULT 'active',
  checksum      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sample_files_dataset_idx      ON sample_files (dataset_id);
CREATE INDEX IF NOT EXISTS sample_files_station_idx      ON sample_files (station_code);
CREATE INDEX IF NOT EXISTS sample_files_station_id_idx   ON sample_files (station_id);
CREATE INDEX IF NOT EXISTS sample_files_sampling_date_idx ON sample_files (sampling_date);

-- ============================================================
-- COMPOUNDS
-- ============================================================
CREATE TABLE IF NOT EXISTS compounds (
  id              BIGSERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  formula         TEXT,
  category        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS compounds_normalized_name_trgm_idx
  ON compounds USING GIN (normalized_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS compounds_name_tsv_idx
  ON compounds USING GIN (to_tsvector('simple', name));

CREATE INDEX IF NOT EXISTS compounds_category_trgm_idx
  ON compounds USING GIN (category gin_trgm_ops);

CREATE UNIQUE INDEX IF NOT EXISTS compounds_identity_idx
  ON compounds (normalized_name, COALESCE(formula, ''), COALESCE(category, ''));

-- ============================================================
-- COMPOUND OBSERVATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS compound_observations (
  id             BIGSERIAL PRIMARY KEY,
  sample_file_id BIGINT NOT NULL REFERENCES sample_files(id) ON DELETE CASCADE,
  compound_id    BIGINT NOT NULL REFERENCES compounds(id)    ON DELETE CASCADE,
  mz             NUMERIC,
  rt_min         NUMERIC,
  area_max       NUMERIC,
  calc_mw        NUMERIC,
  ms2            TEXT,
  reference_ion  TEXT,
  raw_record     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sample_file_id, compound_id, mz, rt_min, area_max)
);

CREATE INDEX IF NOT EXISTS observations_compound_idx
  ON compound_observations (compound_id);

CREATE INDEX IF NOT EXISTS observations_sample_file_idx
  ON compound_observations (sample_file_id);

CREATE INDEX IF NOT EXISTS observations_area_desc_idx
  ON compound_observations (area_max DESC NULLS LAST);

-- ============================================================
-- THRESHOLDS  (Phase 5 — Alerting)
-- ============================================================
CREATE TABLE IF NOT EXISTS thresholds (
  id            BIGSERIAL PRIMARY KEY,
  compound_id   BIGINT NOT NULL REFERENCES compounds(id) ON DELETE CASCADE,
  standard_name TEXT NOT NULL,          -- e.g. "WHO 2017", "EU WFD", "BIS"
  limit_value   NUMERIC NOT NULL,
  unit          TEXT NOT NULL DEFAULT 'ng/L',
  severity      TEXT NOT NULL DEFAULT 'warning'
                  CHECK (severity IN ('warning', 'exceedance')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (compound_id, standard_name)
);

CREATE INDEX IF NOT EXISTS thresholds_compound_idx ON thresholds (compound_id);

-- ============================================================
-- REPORTS  (Phase 5 — PDF Generation)
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
  query_json  JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_path   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reports_user_idx ON reports (user_id);

-- ============================================================
-- AUDIT LOGS  (Phase 2+)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGSERIAL PRIMARY KEY,
  user_id     BIGINT REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,          -- e.g. 'upload', 'delete', 'login'
  entity_type TEXT,                   -- e.g. 'sample_file', 'threshold'
  entity_id   BIGINT,
  metadata    JSONB DEFAULT '{}'::jsonb,
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_user_idx ON audit_logs (user_id);
CREATE INDEX IF NOT EXISTS audit_logs_ts_idx   ON audit_logs (timestamp DESC);

