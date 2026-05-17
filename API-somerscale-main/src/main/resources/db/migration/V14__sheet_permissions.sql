-- V14__sheet_permissions.sql
-- Somerscales Hotel Management - Permissions for the Sheets feature (task027).
-- sheet.read: any authenticated staffer can read past sheets + their summary.
-- sheet.write: only ADMIN and RECEPCIONISTA can claim/edit/handoff a shift.

INSERT INTO permissions (code, description) VALUES
    ('sheet.read',  'Read shift sheets (fichas) and their summary'),
    ('sheet.write', 'Claim, edit, and hand off shift sheets');

-- sheet.read → every existing role (system + custom).
INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
     WHERE p.code = 'sheet.read';

-- sheet.write → ADMIN + RECEPCIONISTA only.
INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
     WHERE p.code = 'sheet.write'
       AND r.name IN ('ADMIN', 'RECEPCIONISTA');
