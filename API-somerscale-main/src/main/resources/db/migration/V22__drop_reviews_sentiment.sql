-- V22__drop_reviews_sentiment.sql
-- task031: drop the legacy single-enum column now that V21 has back-filled
-- every classified row into review_sentiment_labels. Split out from V21 so
-- a rollback only has to invert one statement if the backfill is suspect.

DROP INDEX IF EXISTS reviews_sentiment_idx;

ALTER TABLE reviews DROP COLUMN sentiment;
