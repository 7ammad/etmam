-- Add booklet_metadata JSONB column for RFP PDF extraction results
-- This stores AI-extracted data from uploaded booklet PDFs (Kurrasa)

ALTER TABLE tenders ADD COLUMN IF NOT EXISTS booklet_metadata JSONB;

COMMENT ON COLUMN tenders.booklet_metadata IS 'AI-extracted data from uploaded booklet PDF: boq_items, evaluation_weights, local_content_target';

-- Add GIN index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_tenders_booklet_metadata_gin ON tenders USING gin (booklet_metadata);
