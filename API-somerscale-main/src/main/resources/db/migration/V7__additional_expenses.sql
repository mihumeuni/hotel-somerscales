-- V7__additional_expenses.sql
-- task008: per-booking itemized expenses (CLAUDE.md "Holistic View").
-- One row per charge attached to a reserva; cascade-delete with the booking
-- so guest-history queries never surface orphaned charges. creado_por_id is
-- nullable so legacy/imported rows without a known operator stay valid.

CREATE TABLE additional_expenses (
    id              BIGSERIAL     PRIMARY KEY,
    reserva_id      BIGINT        NOT NULL REFERENCES reservas(id) ON DELETE CASCADE,
    concepto        VARCHAR(200)  NOT NULL,
    monto           NUMERIC(12,2) NOT NULL,
    moneda          VARCHAR(8)    NOT NULL DEFAULT 'CLP',
    fecha           TIMESTAMP     NOT NULL DEFAULT NOW(),
    creado_por_id   BIGINT        REFERENCES usuarios(id),
    notas           TEXT
);

CREATE INDEX expenses_reserva_idx ON additional_expenses(reserva_id);
