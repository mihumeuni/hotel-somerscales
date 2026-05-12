-- V4__usuarios_profile.sql
-- Somerscales Hotel Management - Profile columns for usuarios (task004).
-- CLAUDE.md Frontend Features -> Profiles requires User creation with
-- (Name, Phone, Email). The signup-finish handler copies these from the
-- invitations row onto the new usuarios row.
--
-- Existing seed users (admin/recep/asistente from V2) keep NULL profile
-- fields. The partial UNIQUE index on email tolerates NULLs (since multiple
-- NULLs are considered distinct in Postgres anyway) but is explicit so
-- intent is clear.

ALTER TABLE usuarios
    ADD COLUMN nombre   VARCHAR(200),
    ADD COLUMN telefono VARCHAR(40),
    ADD COLUMN email    VARCHAR(200);

CREATE UNIQUE INDEX uq_usuarios_email ON usuarios(email) WHERE email IS NOT NULL;
