-- Field Shift — Schema v1
-- All tables for scientific data + chat sessions

-- ============================================================
-- Reference tables (scientific data — Cruz Alta)
-- ============================================================

CREATE TABLE IF NOT EXISTS sites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  state       text NOT NULL,
  lat         double precision NOT NULL,
  lon         double precision NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crops (
  id              text PRIMARY KEY,
  name            text NOT NULL,
  name_en         text,
  season          text,
  plant_months    int[],
  harvest_months  int[],
  cycle_days      int[],
  temp_min        double precision,
  temp_opt        double precision[],
  temp_max        double precision,
  water_need_mm   double precision[],
  drought_tolerance text,
  n_fixing        boolean NOT NULL DEFAULT false,
  root_depth_cm   int[],
  tags            text[],
  metadata        jsonb
);

CREATE TABLE IF NOT EXISTS cover_crops (
  id              text PRIMARY KEY,
  name            text NOT NULL,
  name_en         text,
  scientific      text,
  family          text,
  group_type      text,
  functions       text[],
  sowing_months   int[],
  dry_matter_t_ha double precision[],
  cn_ratio        text,
  notes           text[],
  metadata        jsonb
);

CREATE TABLE IF NOT EXISTS rotation_strategies (
  id          text PRIMARY KEY,
  site_id     uuid NOT NULL REFERENCES sites(id),
  name        text NOT NULL,
  subtitle    text,
  sequence    jsonb NOT NULL,
  scores      jsonb NOT NULL,
  total_score double precision NOT NULL,
  evidence    jsonb,
  risks       text[],
  benefits    text[]
);

CREATE TABLE IF NOT EXISTS soil_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id         uuid NOT NULL REFERENCES sites(id),
  source          text,
  texture_class   text,
  interpretation  jsonb,
  layers          jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS climate_monthly (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id  uuid NOT NULL REFERENCES sites(id),
  source   text,
  dataset  text NOT NULL,
  month    int NOT NULL CHECK (month >= 1 AND month <= 12),
  name     text,
  values   jsonb NOT NULL,
  UNIQUE(site_id, dataset, month)
);

CREATE TABLE IF NOT EXISTS climate_yearly (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id  uuid NOT NULL REFERENCES sites(id),
  source   text,
  dataset  text NOT NULL,
  year     int NOT NULL,
  values   jsonb NOT NULL,
  UNIQUE(site_id, dataset, year)
);

CREATE TABLE IF NOT EXISTS climate_timeseries (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id  uuid NOT NULL REFERENCES sites(id),
  dataset  text NOT NULL,
  date     date NOT NULL,
  year     int NOT NULL,
  month    int NOT NULL,
  values   jsonb NOT NULL,
  UNIQUE(site_id, dataset, date)
);

CREATE TABLE IF NOT EXISTS topography_points (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id     uuid NOT NULL REFERENCES sites(id),
  latitude    double precision NOT NULL,
  longitude   double precision NOT NULL,
  elevation_m double precision NOT NULL
);

CREATE TABLE IF NOT EXISTS ndvi_data (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id  uuid NOT NULL REFERENCES sites(id),
  type     text NOT NULL,
  month    int,
  year     int,
  values   jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS mapbiomas_data (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id       uuid NOT NULL REFERENCES sites(id),
  land_use_key  text NOT NULL,
  type          text NOT NULL,
  year          int,
  values        jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS risk_engine (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id  uuid NOT NULL REFERENCES sites(id),
  data     jsonb NOT NULL
);

-- ============================================================
-- Chat tables (producer sessions)
-- ============================================================

CREATE TABLE IF NOT EXISTS chat_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anonymous_id     text NOT NULL,
  site_id          uuid REFERENCES sites(id),
  title            text,
  producer_context jsonb DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content     text NOT NULL,
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- Indices
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_climate_monthly_site_dataset
  ON climate_monthly(site_id, dataset);

CREATE INDEX IF NOT EXISTS idx_climate_yearly_site_dataset
  ON climate_yearly(site_id, dataset);

CREATE INDEX IF NOT EXISTS idx_climate_timeseries_site_dataset_date
  ON climate_timeseries(site_id, dataset, date);

CREATE INDEX IF NOT EXISTS idx_topography_site
  ON topography_points(site_id);

CREATE INDEX IF NOT EXISTS idx_ndvi_site_type
  ON ndvi_data(site_id, type);

CREATE INDEX IF NOT EXISTS idx_mapbiomas_site_key
  ON mapbiomas_data(site_id, land_use_key);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_anon
  ON chat_sessions(anonymous_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_created
  ON chat_messages(session_id, created_at);
