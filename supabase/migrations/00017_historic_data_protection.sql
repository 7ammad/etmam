-- Migration: Historic Data Protection
-- Adds soft delete and protection mechanism for historic tenders
-- Historic tenders (with award_amount_sar) are auto-protected for ML/pattern recognition

-- Soft delete support
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS is_protected BOOLEAN DEFAULT FALSE;

-- Auto-protect historic tenders (those with award data)
CREATE OR REPLACE FUNCTION protect_historic_tenders()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.award_amount_sar IS NOT NULL THEN
    NEW.is_protected = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to avoid errors on re-run
DROP TRIGGER IF EXISTS tenders_protect_historic ON tenders;

CREATE TRIGGER tenders_protect_historic
  BEFORE INSERT OR UPDATE ON tenders
  FOR EACH ROW EXECUTE FUNCTION protect_historic_tenders();

-- Analysis indexes for competitor queries
CREATE INDEX IF NOT EXISTS idx_tenders_award_winning_bidder
  ON tenders(winning_bidder) WHERE award_amount_sar IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tenders_historic_analysis
  ON tenders(award_date, award_amount_sar, winning_bidder, entity)
  WHERE award_amount_sar IS NOT NULL;

-- Update existing historic tenders to be protected
UPDATE tenders SET is_protected = TRUE WHERE award_amount_sar IS NOT NULL AND is_protected IS NOT TRUE;
