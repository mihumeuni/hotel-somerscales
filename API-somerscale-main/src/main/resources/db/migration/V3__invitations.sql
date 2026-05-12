-- V3__invitations.sql
-- Somerscales Hotel Management - Tokenized staff invitation flow (task004).
-- Stores pending invites created by users with the 'user.invite' permission.
-- token_hash is the SHA-256 hex digest of a 32-byte CSPRNG raw token; the raw
-- token is never persisted, only emailed to the invitee via Brevo SMTP.
--
-- Re-invite policy (see task004 plan):
--   * UNIQUE(email) keeps at most one invitation row per email address.
--   * When a row already exists and is not yet consumed, the service updates
--     it in place (new token_hash, new expires_at, refreshed role/metadata)
--     so the previous link becomes invalid.
--   * If a usuarios row already exists with that email, the service refuses
--     with HTTP 409 instead of creating/updating an invitation.

CREATE TABLE invitations (
    id          BIGSERIAL    PRIMARY KEY,
    email       VARCHAR(200) UNIQUE NOT NULL,
    nombre      VARCHAR(200) NOT NULL,
    telefono    VARCHAR(40),
    role        VARCHAR(20)  NOT NULL,
    token_hash  VARCHAR(128) NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMP    NOT NULL,
    consumed_at TIMESTAMP    NULL
);

CREATE INDEX idx_invitations_token_hash ON invitations(token_hash);
