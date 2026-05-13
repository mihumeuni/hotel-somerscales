-- V6: Cloudbeds export alignment.
-- Relax guest identity for OTA bookings without document IDs and expand
-- reservas with the metadata Cloudbeds emits per booking.

ALTER TABLE huespedes ALTER COLUMN tipo_documento DROP NOT NULL;
ALTER TABLE huespedes ALTER COLUMN numero_documento DROP NOT NULL;
ALTER TABLE huespedes ALTER COLUMN numero_documento_hmac DROP NOT NULL;

ALTER TABLE reservas ALTER COLUMN origen_reserva TYPE VARCHAR(120);

ALTER TABLE reservas
    ADD COLUMN numero_reserva_cloudbeds       VARCHAR(40)   UNIQUE,
    ADD COLUMN numero_confirmacion_terceros   VARCHAR(60),
    ADD COLUMN numero_habitacion              VARCHAR(20),
    ADD COLUMN categoria_habitacion           VARCHAR(120),
    ADD COLUMN adultos                        INT,
    ADD COLUMN ninos                          INT,
    ADD COLUMN noches                         INT,
    ADD COLUMN estado_reserva                 VARCHAR(40),
    ADD COLUMN estado_huesped                 VARCHAR(40),
    ADD COLUMN pais                           VARCHAR(80),
    ADD COLUMN fecha_reserva                  DATE,
    ADD COLUMN fecha_cancelacion              DATE,
    ADD COLUMN hora_estimada_llegada          VARCHAR(10),
    ADD COLUMN plan_comidas                   VARCHAR(80),
    ADD COLUMN procedencia                    VARCHAR(120),
    ADD COLUMN monto_total                    NUMERIC(12,2),
    ADD COLUMN monto_pagado                   NUMERIC(12,2),
    ADD COLUMN saldo_pendiente                NUMERIC(12,2),
    ADD COLUMN deposito                       NUMERIC(12,2),
    ADD COLUMN productos_monto                NUMERIC(12,2),
    ADD COLUMN tarifa_cancelacion             NUMERIC(12,2),
    ADD COLUMN tipo_tarjeta_credito           VARCHAR(40);

CREATE INDEX idx_reservas_fecha_entrada ON reservas(fecha_entrada);
CREATE INDEX idx_reservas_fecha_salida  ON reservas(fecha_salida);
