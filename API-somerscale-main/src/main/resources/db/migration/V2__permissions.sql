-- V2__permissions.sql
-- Somerscales Hotel Management - RBAC permissions + role_permissions (task003).
-- Replaces flat RolModel-only authorization with a queryable permission system.
-- Each role-permission row maps a RolModel enum value to a permission code; the
-- application enforces them via @PreAuthorize("hasAuthority('<code>')").
--
-- This migration also seeds three dev/demo users (BCrypt strength 10) so the
-- task003 acceptance smoke test can run without manual user provisioning:
--   admin     / admin123       (ADMIN         - all 12 perms)
--   recep     / recep123       (RECEPCIONISTA - 8 perms)
--   asistente / asis123        (ASISTENTE     - 4 perms)
-- Replace these before any non-dev deployment.

CREATE TABLE permissions (
    id          BIGSERIAL    PRIMARY KEY,
    code        VARCHAR(80)  UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE role_permissions (
    role          VARCHAR(20) NOT NULL,
    permission_id BIGINT      NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role, permission_id)
);

INSERT INTO permissions (code, description) VALUES
    ('guest.read',     'Read guest records'),
    ('guest.write',    'Create or update guests'),
    ('guest.delete',   'Delete guests'),
    ('booking.read',   'Read bookings'),
    ('booking.write',  'Create or update bookings'),
    ('expense.read',   'Read additional expenses'),
    ('expense.write',  'Create or update expenses'),
    ('review.read',    'Read reviews'),
    ('user.invite',    'Invite new staff users'),
    ('user.manage',    'Create or delete users'),
    ('role.manage',    'Edit role-permission matrix'),
    ('dashboard.read', 'View dashboards');

-- ADMIN: every permission.
INSERT INTO role_permissions (role, permission_id)
    SELECT 'ADMIN', id FROM permissions;

-- RECEPCIONISTA: read/write on operational entities, dashboard read.
INSERT INTO role_permissions (role, permission_id)
    SELECT 'RECEPCIONISTA', id FROM permissions WHERE code IN (
        'guest.read', 'guest.write',
        'booking.read', 'booking.write',
        'expense.read', 'expense.write',
        'review.read',
        'dashboard.read'
    );

-- ASISTENTE: read-only across the dashboard surface.
INSERT INTO role_permissions (role, permission_id)
    SELECT 'ASISTENTE', id FROM permissions WHERE code IN (
        'guest.read',
        'booking.read',
        'review.read',
        'dashboard.read'
    );

-- Dev/demo users (task003 smoke test). BCrypt strength 10, $2a$ prefix.
INSERT INTO usuarios (username, password, rolmodel) VALUES
    ('admin',     '$2a$10$uaEVPu6ljPUNU0zatoO.hOsYsubskKfS4c9iGmFcSiPO1WnUTtz1i', 'ADMIN'),
    ('recep',     '$2a$10$g0ygmxcZVc37OsUm3JAuPO9Fkgf1MiqShw3WmSue6KJOqc5KByj6O', 'RECEPCIONISTA'),
    ('asistente', '$2a$10$I3VAgTP/rxsOywewTf985e2oZ2oisJ1s/cx9bR.QqfaL9pkf8PuD.', 'ASISTENTE')
ON CONFLICT (username) DO NOTHING;
