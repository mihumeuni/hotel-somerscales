-- V8__reviews.sql
-- task010: review intelligence foundation (CLAUDE.md "Intelligence").
-- 'categories' is the small catalog of buckets the LLM classifier (task 013)
-- tags reviews with. 'reviews' holds one row per Google Places + TripAdvisor
-- entry; (source, external_id) is the dedupe key so daily refetches stay
-- idempotent. sentiment/summary/key_phrases are nullable so reviews can land
-- before classification — decouples fetch (tasks 011/012) from LLM enrichment.

CREATE TABLE categories (
    id        BIGSERIAL    PRIMARY KEY,
    code      VARCHAR(40)  UNIQUE NOT NULL,
    label_es  VARCHAR(80)  NOT NULL,
    label_en  VARCHAR(80)  NOT NULL
);

INSERT INTO categories (code, label_es, label_en) VALUES
    ('cleanliness', 'Limpieza',     'Cleanliness'),
    ('service',     'Servicio',     'Service'),
    ('food',        'Comida',       'Food'),
    ('location',    'Ubicación',    'Location'),
    ('value',       'Precio/Valor', 'Value'),
    ('comfort',     'Comodidad',    'Comfort'),
    ('amenities',   'Amenidades',   'Amenities'),
    ('other',       'Otro',         'Other');

CREATE TABLE reviews (
    id           BIGSERIAL     PRIMARY KEY,
    source       VARCHAR(20)   NOT NULL,
    external_id  VARCHAR(120)  NOT NULL,
    author       VARCHAR(200),
    rating       NUMERIC(3,1),
    language     VARCHAR(8),
    raw_text     TEXT          NOT NULL,
    posted_at    TIMESTAMP,
    fetched_at   TIMESTAMP     NOT NULL DEFAULT NOW(),
    sentiment    VARCHAR(20),
    summary      VARCHAR(500),
    key_phrases  TEXT,
    UNIQUE (source, external_id)
);

CREATE INDEX reviews_posted_idx    ON reviews(posted_at DESC);
CREATE INDEX reviews_sentiment_idx ON reviews(sentiment);

CREATE TABLE review_categories (
    review_id    BIGINT       NOT NULL REFERENCES reviews(id)    ON DELETE CASCADE,
    category_id  BIGINT       NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    confidence   NUMERIC(4,3),
    PRIMARY KEY (review_id, category_id)
);
