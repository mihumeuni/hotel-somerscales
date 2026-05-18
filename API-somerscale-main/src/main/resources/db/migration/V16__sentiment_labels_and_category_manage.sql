-- V16__sentiment_labels_and_category_manage.sql
-- Somerscales Hotel Management - Global Settings backbone (task028).
--
-- sentiment_labels: 5-bucket taxonomy editor. `code` is the immutable
-- machine identifier (referenced by the classifier in task031); `label_es`
-- and `emoji` are operator-editable display values.
-- category.manage: gates the /settings/global page and all three settings
-- tabs (Categorías, Taxonomía, Quick-picks de fichas). ADMIN only by default.

CREATE TABLE sentiment_labels (
    id        BIGSERIAL    PRIMARY KEY,
    code      VARCHAR(16)  UNIQUE NOT NULL,
    label_es  VARCHAR(40)  NOT NULL,
    emoji     VARCHAR(8)   NOT NULL,
    ordinal   SMALLINT     NOT NULL
);

INSERT INTO sentiment_labels (code, label_es, emoji, ordinal) VALUES
    ('positive',    'Positivo',    '😊', 0),
    ('negative',    'Negativo',    '😞', 1),
    ('neutral',     'Neutral',     '😐', 2),
    ('improvement', 'Mejora',      '💡', 3),
    ('complaint',   'Reclamo',     '⚠️', 4);

INSERT INTO permissions (code, description) VALUES
    ('category.manage', 'Edit categories, sentiment labels, and ficha quick-picks');

INSERT INTO role_permissions (role_id, permission_id)
    SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
     WHERE p.code = 'category.manage'
       AND r.name = 'ADMIN';
