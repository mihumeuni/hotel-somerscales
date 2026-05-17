-- task025: add created_at to usuarios so the user-settings UI can show
-- "Miembro desde {fecha}". Existing rows are backfilled to now() so the
-- column can be NOT NULL.
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT now();
