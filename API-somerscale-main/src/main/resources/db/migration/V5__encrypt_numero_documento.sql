-- V5__encrypt_numero_documento.sql
-- task005: AES-GCM encryption of huespedes.numero_documento at rest.
--
-- The application encrypts/decrypts the field via security.EncryptedStringConverter
-- on every JPA read/write. Because AES-GCM is non-deterministic (a fresh 12-byte
-- IV per encryption), equality lookups cannot use the encrypted column directly.
-- We add a deterministic HMAC-SHA-256 sidecar column populated by an
-- @PrePersist/@PreUpdate hook on HuespedModel; uniqueness moves there.
--
-- Column widening: VARCHAR(64) cannot hold base64(IV || ciphertext || tag) for
-- realistic document numbers; bump to VARCHAR(255).

ALTER TABLE huespedes DROP CONSTRAINT huespedes_numero_documento_key;

ALTER TABLE huespedes ALTER COLUMN numero_documento TYPE VARCHAR(255);

ALTER TABLE huespedes ADD COLUMN numero_documento_hmac VARCHAR(64);
CREATE UNIQUE INDEX huespedes_doc_hmac_idx ON huespedes(numero_documento_hmac);

-- HMAC NOT NULL is intentionally deferred: existing rows would need a one-time
-- backfill keyed on the decryption result, which is out of scope for the MVP
-- (the dev DB is empty after this migration anyway). The JPA @PrePersist hook
-- guarantees every new row has a non-null hmac value.
