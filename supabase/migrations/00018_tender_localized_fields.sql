-- Migration: Tender Localized Fields
-- Adds English columns for entity and title to avoid runtime translation dependency
-- Primary source for English display; AI translation fills these during sync
-- Fallback: phrase_translations cache + AI if these columns are null

-- Add English columns for localized display
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS entity_en TEXT;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS title_en TEXT;

-- Comment for documentation
COMMENT ON COLUMN tenders.entity_en IS 'English translation/summary of entity name. Populated by AI during sync. Used for English locale display.';
COMMENT ON COLUMN tenders.title_en IS 'English summary of tender title (max 5 words). Populated by AI during sync. Used for English locale display.';

-- Index for potential search functionality
CREATE INDEX IF NOT EXISTS idx_tenders_entity_en ON tenders(entity_en) WHERE entity_en IS NOT NULL;
