-- Migration: Dual-Track / Booklet evaluation columns (Phase 4.2)
-- Purpose: Add infratech_score, exotech_score, predicted_value_sar, value_method, work_type to evaluations
-- so the rule runner can persist dual-track and booklet value results.

-- Predicted value in SAR (from booklet or other value estimator)
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS predicted_value_sar BIGINT;

-- Value estimation method label (e.g. "Booklet Tier 3")
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS value_method TEXT;

-- Infratech track score (0-100)
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS infratech_score SMALLINT;

-- Exotech track score (0-100)
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS exotech_score SMALLINT;

-- Work type: Commodity | General IT | Core Infra | Emerging Tech
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS work_type TEXT;

COMMENT ON COLUMN evaluations.predicted_value_sar IS 'Predicted contract value in SAR (from booklet or value estimator)';
COMMENT ON COLUMN evaluations.value_method IS 'Value estimation method label (e.g. Booklet Tier 3)';
COMMENT ON COLUMN evaluations.infratech_score IS 'Infratech track score 0-100 (Phase 3 dual-track)';
COMMENT ON COLUMN evaluations.exotech_score IS 'Exotech track score 0-100 (Phase 3 dual-track)';
COMMENT ON COLUMN evaluations.work_type IS 'Work type: Commodity | General IT | Core Infra | Emerging Tech';
