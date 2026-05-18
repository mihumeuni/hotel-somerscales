-- V20__reservas_hora_estimada_widen.sql
-- task030 fix-up: the Cloudbeds export emits "Desconocido" (11 chars) in the
-- "Hora estimada" column when ETA is missing; the existing VARCHAR(10) clipped
-- it and crashed the sync. Widen to 40 chars to also accommodate free-form
-- values like "15:00 - 17:00" or "Late evening".

ALTER TABLE reservas ALTER COLUMN hora_estimada_llegada TYPE VARCHAR(40);
