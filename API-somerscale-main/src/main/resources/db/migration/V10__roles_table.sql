-- V10__roles_table.sql
-- Somerscales Hotel Management - Convert the fixed RolModel enum into a
-- DB-managed roles table so admins can create/edit roles from the new
-- Roles & Permisos screen (task023).
--
-- ADMIN is flagged is_system_admin=true and is treated as immutable: the
-- application layer refuses to rename, delete, or alter its permission
-- grants. Every other role row is fully editable.

CREATE TABLE roles (
    id              BIGSERIAL    PRIMARY KEY,
    name            VARCHAR(40)  UNIQUE NOT NULL,
    description     VARCHAR(255),
    is_system_admin BOOLEAN      NOT NULL DEFAULT false
);

-- Seed the three existing enum values so backfill below can FK them.
INSERT INTO roles (name, description, is_system_admin) VALUES
    ('ADMIN',         'Acceso completo · todos los permisos',        true),
    ('RECEPCIONISTA', 'Operación diaria · check-in / out / fichas',  false),
    ('ASISTENTE',     'Lectura · sin escritura',                     false);

-- role_permissions: add role_id, backfill, drop the VARCHAR role PK column.
ALTER TABLE role_permissions ADD COLUMN role_id BIGINT;

UPDATE role_permissions rp
   SET role_id = r.id
  FROM roles r
 WHERE r.name = rp.role;

ALTER TABLE role_permissions
    ALTER COLUMN role_id SET NOT NULL,
    DROP CONSTRAINT role_permissions_pkey,
    DROP COLUMN role,
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id),
    ADD CONSTRAINT role_permissions_role_fk FOREIGN KEY (role_id)
        REFERENCES roles(id) ON DELETE CASCADE;

-- usuarios: add role_id, backfill from rolmodel VARCHAR, drop old column.
ALTER TABLE usuarios ADD COLUMN role_id BIGINT;

UPDATE usuarios u
   SET role_id = r.id
  FROM roles r
 WHERE r.name = u.rolmodel;

ALTER TABLE usuarios
    ALTER COLUMN role_id SET NOT NULL,
    DROP COLUMN rolmodel,
    ADD CONSTRAINT usuarios_role_fk FOREIGN KEY (role_id) REFERENCES roles(id);

-- invitations.role: same pattern. Invitations were stored as enum names too.
ALTER TABLE invitations ADD COLUMN role_id BIGINT;

UPDATE invitations i
   SET role_id = r.id
  FROM roles r
 WHERE r.name = i.role;

ALTER TABLE invitations
    ALTER COLUMN role_id SET NOT NULL,
    DROP COLUMN role,
    ADD CONSTRAINT invitations_role_fk FOREIGN KEY (role_id) REFERENCES roles(id);
