-- Map tiles — stores GEE tile URLs for raster layers
CREATE TABLE IF NOT EXISTS map_tiles (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id  uuid NOT NULL REFERENCES sites(id),
  dataset  text NOT NULL,
  type     text NOT NULL,
  key      text NOT NULL,
  values   jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(site_id, dataset, type, key)
);

ALTER TABLE map_tiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "map_tiles_public_read" ON map_tiles
  FOR SELECT TO anon, authenticated
  USING (true);

REVOKE INSERT, UPDATE, DELETE ON map_tiles FROM anon, authenticated;
