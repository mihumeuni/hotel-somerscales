-- V18__user_preferences.sql
-- Somerscales Hotel Management - Per-user preferences (task029).
-- Stores theme choice and avatar bytes server-side so the FE applies
-- the saved theme at first paint on any device, and avatars survive
-- cache clears. Avatar is BYTEA (BCmK at MVP scale) to avoid the
-- operational overhead of Supabase Storage buckets + signed URLs.

CREATE TABLE user_preferences (
    id          BIGSERIAL    PRIMARY KEY,
    user_id     BIGINT       NOT NULL UNIQUE
                 REFERENCES usuarios(id) ON DELETE CASCADE,
    theme       VARCHAR(8)   NOT NULL DEFAULT 'system',
    language    VARCHAR(8)   NOT NULL DEFAULT 'es',
    avatar_data BYTEA        NULL,
    avatar_mime VARCHAR(32)  NULL,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_theme CHECK (theme IN ('light','dark','system'))
);

CREATE INDEX idx_user_preferences_user ON user_preferences (user_id);
