-- V17__ficha_quickpicks.sql
-- Somerscales Hotel Management - Operator-editable ficha quick-pick chips
-- (task028 follow-up to task032). Replaces the hardcoded
-- FichaService.QUICKPICKS map so admins can add/edit/delete chips per
-- ficha row label from /settings/global → Quick-picks tab.

CREATE TABLE ficha_quickpicks (
    id        BIGSERIAL    PRIMARY KEY,
    row_label VARCHAR(64)  NOT NULL,
    value     VARCHAR(64)  NOT NULL,
    ordinal   SMALLINT     NOT NULL,
    UNIQUE (row_label, ordinal)
);

CREATE INDEX idx_ficha_quickpicks_row ON ficha_quickpicks (row_label, ordinal);

-- Seed the existing FichaService.QUICKPICKS map verbatim so behavior is
-- unchanged on first deploy. Operator can edit from the UI thereafter.
INSERT INTO ficha_quickpicks (row_label, value, ordinal) VALUES
    ('Check in',         'Sin novedad',              0),
    ('Check in',         'Pendiente documentación',  1),
    ('Check in',         'Pago al ingreso',          2),
    ('Check out',        'Sin novedad',              0),
    ('Check out',        'Llave devuelta',           1),
    ('Check out',        'Cobro extra pendiente',    2),
    ('Late check out',   'Sin solicitudes',          0),
    ('Late check out',   'Hasta 14:00',              1),
    ('Late check out',   'Hasta 16:00',              2),
    ('Early check in',   'Sin solicitudes',          0),
    ('Early check in',   'Pasajero esperó',          1),
    ('Early check in',   'Habitación lista temprano',2),
    ('Desayunos',        'Sin novedad',              0),
    ('Desayunos',        'Stock OK',                 1),
    ('Desayunos',        'Reponer pan',              2),
    ('Desayunos',        'Reponer fruta',            3),
    ('Agua',             'Stock OK',                 0),
    ('Agua',             'Reponer',                  1),
    ('Agua',             'Sin stock',                2),
    ('Café',             'Hay café fresco',          0),
    ('Café',             'Reponer',                  1),
    ('Café',             'Solo descafeinado',        2),
    ('Secando',          'Nada en curso',            0),
    ('Secando',          '1 ciclo',                  1),
    ('Secando',          'Esperando recoger',        2),
    ('Lavando',          'Nada en curso',            0),
    ('Lavando',          '1 ciclo',                  1),
    ('Lavando',          '2 ciclos',                 2),
    ('Lavando',          'Carga completa',           3),
    ('Cama extra',       'Sin solicitudes',          0),
    ('Cama extra',       '1 cama armada',            1),
    ('Cama extra',       '2 camas armadas',          2),
    ('Lavandería',       'Sin pedidos',              0),
    ('Lavandería',       'Entrega pendiente',        1),
    ('Lavandería',       'Retiro pendiente',         2),
    ('Ventas',           'Sin ventas',               0),
    ('Ventas',           'Tarjeta',                  1),
    ('Ventas',           'Efectivo',                 2),
    ('Ventas',           'Transferencia',            3),
    ('Mails',            'Sin novedad',              0),
    ('Mails',            'Respondidos al día',       1),
    ('Mails',            'Pendientes',               2),
    ('Requerimientos',   'Sin requerimientos',       0),
    ('Requerimientos',   'Mantenimiento',            1),
    ('Requerimientos',   'Limpieza',                 2),
    ('Requerimientos',   'Recepción',                3),
    ('Reclamos',         'Sin reclamos',             0),
    ('Reclamos',         'Ruido',                    1),
    ('Reclamos',         'Limpieza',                 2),
    ('Reclamos',         'Servicio',                 3);
