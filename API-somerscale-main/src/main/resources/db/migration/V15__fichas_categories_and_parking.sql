-- V15__fichas_categories_and_parking.sql
-- Sheets v2 (task032): group reportes by category and capture structured
-- parking pairs (room + lot) for future analytics.
--
-- Existing sample fichas are wiped: the v1 template (task027) used 22 rows
-- with labels that did not match the printed paper sheet. Operator will
-- claim a fresh ficha post-deploy to exercise the v2 template.

DELETE FROM fichas;

ALTER TABLE ficha_reportes
    ADD COLUMN category VARCHAR(32);

CREATE TABLE ficha_parking (
    id          BIGSERIAL    PRIMARY KEY,
    ficha_id    BIGINT       NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
    room        VARCHAR(8)   NOT NULL,
    lot         VARCHAR(16)  NOT NULL,
    position    SMALLINT     NOT NULL DEFAULT 0,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT ficha_parking_unique UNIQUE (ficha_id, position)
);

CREATE INDEX idx_ficha_parking_ficha ON ficha_parking(ficha_id);
