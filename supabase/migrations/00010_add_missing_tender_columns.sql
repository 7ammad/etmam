-- Add missing tender columns required by sync API (booklet_price_sar, etc.)
-- Safe to run: uses IF NOT EXISTS. Fixes PGRST204 "Could not find booklet_price_sar" when 00004/00005 were not applied.

ALTER TABLE tenders ADD COLUMN IF NOT EXISTS booklet_price_sar INTEGER;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS initial_guarantee_sar NUMERIC(15, 2);
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS project_duration TEXT;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS award_amount_sar NUMERIC(15, 2);
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS award_date TEXT;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS winning_bidder TEXT;

COMMENT ON COLUMN tenders.booklet_price_sar IS 'Booklet price in SAR - scraped from Etimad';
COMMENT ON COLUMN tenders.initial_guarantee_sar IS 'Initial guarantee in SAR - scraped from Etimad';
COMMENT ON COLUMN tenders.project_duration IS 'Project/contract duration - scraped from Etimad';
COMMENT ON COLUMN tenders.award_amount_sar IS 'Award amount in SAR - historical tenders';
COMMENT ON COLUMN tenders.award_date IS 'Award date - historical tenders';
COMMENT ON COLUMN tenders.winning_bidder IS 'Winning bidder - historical tenders';
