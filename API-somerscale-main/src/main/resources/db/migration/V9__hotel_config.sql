-- V9__hotel_config.sql
-- task022: hotel-wide tunables. Currently a single row holding `total_rooms`,
-- consumed by the Disponibilidad KPI tile to render "X / total" availability.
-- Seeded to 10 from the Cloudbeds export. Modeled as a table (not a property
-- file) so the operator can edit it without a redeploy when expansion happens.

CREATE TABLE hotel_config (
    id          BIGSERIAL  PRIMARY KEY,
    total_rooms INTEGER    NOT NULL DEFAULT 10,
    updated_at  TIMESTAMP  NOT NULL DEFAULT NOW()
);

INSERT INTO hotel_config (total_rooms) VALUES (10);
