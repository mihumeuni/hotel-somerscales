-- V11__user_disabled_and_invitation_reset.sql
-- Somerscales Hotel Management - task024
-- 1. Soft-delete column on usuarios so DELETE /api/users/{id} preserves
--    sheet authorship history (sheets ship in task026 and will FK usuarios.id).
-- 2. Reset flag on invitations so a single token store backs both first-time
--    activation and password reset, but consume() can tell them apart and
--    refuse to silently pwn an existing account with a stale invite token.

ALTER TABLE usuarios
    ADD COLUMN disabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE invitations
    ADD COLUMN reset BOOLEAN NOT NULL DEFAULT FALSE;
