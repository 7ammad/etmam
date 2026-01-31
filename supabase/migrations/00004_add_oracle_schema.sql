-- Migration: Add Oracle Schema Support
-- Purpose: Add columns for Oracle insights and scraper data
-- Phase: Phase 1 - Foundation
--
-- This migration:
-- 1. Adds scraper fields to tenders table (booklet_price_sar, initial_guarantee_sar, project_duration)
-- 2. Adds Oracle fields to evaluations table (oracle_metadata, predicted_budget_min/max, routing_decision)
-- 3. Creates routing_decision enum for tender routing logic

-- ============================================================
-- 1. Create routing_decision enum
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'routing_decision') THEN
    CREATE TYPE routing_decision AS ENUM (
      'INFRATECH',  -- Route to Infratech pipeline
      'EXOTECH',    -- Route to Exotech pipeline
      'JOINT',      -- Route to joint venture pipeline
      'NO_BID'      -- Do not bid
    );
  END IF;
END $$;

-- ============================================================
-- 2. Add scraper fields to tenders table
-- ============================================================

-- Booklet price in SAR (from scraper: "قيمة وثائق المنافسة")
ALTER TABLE tenders
  ADD COLUMN IF NOT EXISTS booklet_price_sar INTEGER;

-- Initial guarantee in SAR (from scraper: "الضمان الابتدائي")
-- CRITICAL for Budget Algo: If Initial Guarantee is X%, Estimate Budget = Guarantee / (X/100)
ALTER TABLE tenders
  ADD COLUMN IF NOT EXISTS initial_guarantee_sar NUMERIC(15, 2);

-- Project duration (from scraper: "مدة العقد")
ALTER TABLE tenders
  ADD COLUMN IF NOT EXISTS project_duration TEXT;

-- Add comments for documentation
COMMENT ON COLUMN tenders.booklet_price_sar IS
  'Booklet price in SAR (قيمة وثائق المنافسة) - scraped from Etimad detail page';

COMMENT ON COLUMN tenders.initial_guarantee_sar IS
  'Initial guarantee in SAR (الضمان الابتدائي) - CRITICAL for budget prediction algorithm';

COMMENT ON COLUMN tenders.project_duration IS
  'Project duration/contract period (مدة العقد) - scraped from Etimad detail page';

-- ============================================================
-- 3. Add Oracle fields to evaluations table
-- ============================================================

-- Oracle metadata (JSONB) - stores full Oracle output including:
-- - Inferred scope list
-- - Reasoning chain
-- - Confidence scores
-- - Budget calculation method
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS oracle_metadata JSONB DEFAULT '{}'::jsonb;

-- Predicted budget range (in SAR)
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS predicted_budget_min BIGINT;

ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS predicted_budget_max BIGINT;

-- Routing decision (enum)
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS routing_decision routing_decision;

-- Add comments for documentation
COMMENT ON COLUMN evaluations.oracle_metadata IS
  'Full Oracle output including inferred scope, reasoning, confidence, and calculation method';

COMMENT ON COLUMN evaluations.predicted_budget_min IS
  'Minimum predicted budget in SAR (calculated by Oracle)';

COMMENT ON COLUMN evaluations.predicted_budget_max IS
  'Maximum predicted budget in SAR (calculated by Oracle)';

COMMENT ON COLUMN evaluations.routing_decision IS
  'Routing decision: INFRATECH, EXOTECH, JOINT, or NO_BID';

-- ============================================================
-- 4. Add indexes for performance
-- ============================================================

-- Index for routing decision queries
CREATE INDEX IF NOT EXISTS idx_evaluations_routing_decision
  ON evaluations(routing_decision)
  WHERE routing_decision IS NOT NULL;

-- Index for budget range queries
CREATE INDEX IF NOT EXISTS idx_evaluations_budget_range
  ON evaluations(predicted_budget_min, predicted_budget_max)
  WHERE predicted_budget_min IS NOT NULL AND predicted_budget_max IS NOT NULL;

-- GIN index for oracle_metadata JSONB queries (per supabase-postgres-best-practices)
-- Enables efficient cache checks and JSONB containment queries
CREATE INDEX IF NOT EXISTS idx_evaluations_oracle_metadata_gin
  ON evaluations USING gin (oracle_metadata)
  WHERE oracle_metadata IS NOT NULL;

-- Index for tenders with scraper data
CREATE INDEX IF NOT EXISTS idx_tenders_has_scraper_data
  ON tenders(booklet_price_sar, initial_guarantee_sar)
  WHERE booklet_price_sar IS NOT NULL OR initial_guarantee_sar IS NOT NULL;

-- ============================================================
-- 5. Add check constraints
-- ============================================================

-- Ensure budget min <= max if both are set
ALTER TABLE evaluations
  ADD CONSTRAINT check_budget_range
  CHECK (
    predicted_budget_min IS NULL OR
    predicted_budget_max IS NULL OR
    predicted_budget_min <= predicted_budget_max
  );

-- ============================================================
-- Migration complete
-- ============================================================
