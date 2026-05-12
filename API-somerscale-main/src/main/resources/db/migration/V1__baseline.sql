-- V1__baseline.sql
-- Somerscales Hotel Management - baseline schema (task002).
-- Tables here mirror the JPA entity model as of this migration.
-- Future tasks add VN__*.sql migrations (RBAC, encryption, expenses, reviews, ...).

CREATE TABLE huespedes (
    id               BIGSERIAL     PRIMARY KEY,
    tipo_documento   VARCHAR(20)   NOT NULL,
    numero_documento VARCHAR(64)   NOT NULL UNIQUE,
    nombre_completo  VARCHAR(200)  NOT NULL,
    email            VARCHAR(200),
    telefono         VARCHAR(40),
    dato_extra       TEXT
);

CREATE TABLE reservas (
    id              BIGSERIAL    PRIMARY KEY,
    fecha_entrada   TIMESTAMP,
    fecha_salida    TIMESTAMP,
    origen_reserva  VARCHAR(20)
);

CREATE TABLE reserva_huespedes (
    reserva_id  BIGINT  NOT NULL REFERENCES reservas(id),
    huesped_id  BIGINT  NOT NULL REFERENCES huespedes(id),
    PRIMARY KEY (reserva_id, huesped_id)
);

CREATE TABLE usuarios (
    id        BIGSERIAL     PRIMARY KEY,
    username  VARCHAR(120)  NOT NULL UNIQUE,
    password  VARCHAR(255)  NOT NULL,
    rolmodel  VARCHAR(20)   NOT NULL
);
