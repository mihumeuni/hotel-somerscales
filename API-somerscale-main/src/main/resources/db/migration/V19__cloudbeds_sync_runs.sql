-- V19__cloudbeds_sync_runs.sql
-- task030: per-run audit log for the weekly Cloudbeds API sync (mock for MVP,
-- live post-MVP). Read by the admin /settings/global → Sincronización tab and
-- by the dashboard "Datos al {date}" footer.

CREATE TABLE cloudbeds_sync_runs (
    id                    BIGSERIAL    PRIMARY KEY,
    started_at            TIMESTAMP    NOT NULL,
    finished_at           TIMESTAMP,
    mode                  VARCHAR(16)  NOT NULL,   -- FULL | INCREMENTAL
    status                VARCHAR(16)  NOT NULL,   -- RUNNING | SUCCESS | FAILED
    trigger_source        VARCHAR(16)  NOT NULL,   -- MANUAL | SCHEDULED | STARTUP
    guests_upserted       INT          NOT NULL DEFAULT 0,
    reservations_upserted INT          NOT NULL DEFAULT 0,
    expenses_upserted     INT          NOT NULL DEFAULT 0,
    error                 TEXT
);

CREATE INDEX idx_cloudbeds_sync_runs_started ON cloudbeds_sync_runs (started_at DESC);
