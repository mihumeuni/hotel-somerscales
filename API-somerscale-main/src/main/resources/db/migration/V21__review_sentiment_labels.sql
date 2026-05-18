-- V21__review_sentiment_labels.sql
-- task031: multi-label sentiment per review.
-- The single-enum reviews.sentiment column loses information when a comment
-- mixes positive and negative beats (operator's spec: "comments can be more
-- than one, like say something positive but say what they found annoying").
-- This migration introduces the join table and back-fills it from the legacy
-- enum so the old column can be dropped in V22 without data loss.

CREATE TABLE review_sentiment_labels (
    review_id    BIGINT       NOT NULL REFERENCES reviews(id)            ON DELETE CASCADE,
    label_code   VARCHAR(16)  NOT NULL REFERENCES sentiment_labels(code) ON UPDATE CASCADE,
    PRIMARY KEY (review_id, label_code)
);

CREATE INDEX review_sentiment_labels_code_idx
    ON review_sentiment_labels(label_code);

-- Backfill: every classified review gets exactly one row mapping its old
-- enum to the new lowercase code. NULL sentiment rows (unclassified) stay
-- absent — the classifier will re-tag them on the next run.
INSERT INTO review_sentiment_labels (review_id, label_code)
    SELECT id, lower(sentiment)
      FROM reviews
     WHERE sentiment IS NOT NULL
       AND lower(sentiment) IN (SELECT code FROM sentiment_labels);
