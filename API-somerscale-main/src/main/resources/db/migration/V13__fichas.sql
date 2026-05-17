-- V13__fichas.sql
-- Somerscales Hotel Management - Sheets (fichas) feature (task027).
-- Digital replacement for the printed shift-handover template.
-- One ficha per (fecha, shift); locked on handoff.

CREATE TABLE fichas (
    id              BIGSERIAL    PRIMARY KEY,
    fecha           DATE         NOT NULL,
    shift           VARCHAR(8)   NOT NULL,
    owner_user_id   BIGINT       NOT NULL REFERENCES usuarios(id),
    claimed_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    locked_at       TIMESTAMP    NULL,
    notes           TEXT         NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT fichas_shift_chk CHECK (shift IN ('MANANA', 'NOCHE')),
    CONSTRAINT fichas_unique_per_shift UNIQUE (fecha, shift)
);

CREATE INDEX idx_fichas_owner ON fichas(owner_user_id);
CREATE INDEX idx_fichas_fecha ON fichas(fecha DESC);

CREATE TABLE ficha_reportes (
    id          BIGSERIAL    PRIMARY KEY,
    ficha_id    BIGINT       NOT NULL REFERENCES fichas(id) ON DELETE CASCADE,
    row_label   VARCHAR(64)  NOT NULL,
    value       TEXT         NULL,
    ordinal     SMALLINT     NOT NULL,
    CONSTRAINT ficha_reportes_unique UNIQUE (ficha_id, ordinal)
);

CREATE INDEX idx_ficha_reportes_ficha ON ficha_reportes(ficha_id);
