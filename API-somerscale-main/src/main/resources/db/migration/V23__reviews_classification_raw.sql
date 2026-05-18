-- V23__reviews_classification_raw.sql
-- task031: store the raw Gemini response per review for audit + as the
-- "classified yet?" marker. classification_raw IS NULL replaces the old
-- sentiment IS NULL filter the classifier used to drain its backlog.

ALTER TABLE reviews ADD COLUMN classification_raw TEXT;

-- Partial index keeps the classifier backlog query cheap as the table grows;
-- only NULL rows are interesting, classified rows can stay un-indexed.
CREATE INDEX reviews_classification_pending_idx
    ON reviews(id)
    WHERE classification_raw IS NULL;
