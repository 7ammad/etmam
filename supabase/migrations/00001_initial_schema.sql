-- Etmaam CRM Database Schema
-- Initial migration: Tables, Indexes, RLS Policies

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE tender_status AS ENUM (
  'pending',
  'evaluating', 
  'evaluated',
  'approved',
  'pushed',
  'rejected'
);

CREATE TYPE recommendation_type AS ENUM (
  'qualified',
  'conditional',
  'excluded'
);

CREATE TYPE crm_provider AS ENUM (
  'webhook',
  'hubspot',
  'salesforce',
  'zoho',
  'odoo'
);

CREATE TYPE push_status AS ENUM (
  'pending',
  'success',
  'failed'
);

-- ============================================================
-- TABLES
-- ============================================================

-- Tenders table
CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Core fields (Arabic: جهة, عنوان المنافسة, رقم المنافسة, الموعد النهائي, قيمة تقديرية)
  entity TEXT NOT NULL,                    -- الجهة
  title TEXT NOT NULL,                     -- عنوان المنافسة
  reference_no TEXT NOT NULL,              -- رقم المنافسة
  deadline TIMESTAMPTZ NOT NULL,           -- الموعد النهائي
  estimated_value NUMERIC(12, 2),          -- القيمة التقديرية (SAR) - 12 digits sufficient for SAR values up to 999 billion
  
  -- Additional fields
  description TEXT,
  source TEXT,                             -- 'etimad', 'excel', 'csv', 'manual'
  status tender_status DEFAULT 'pending' NOT NULL,
  
  -- Raw data from import
  raw_data JSONB
);

-- Evaluations table (AI evaluation results)
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Core evaluation fields (درجة التقييم, التوصية)
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  recommendation recommendation_type NOT NULL,
  
  -- Arabic summary fields
  summary TEXT NOT NULL,                   -- ملخص التقييم
  strengths TEXT[] DEFAULT '{}',           -- نقاط القوة
  risks TEXT[] DEFAULT '{}',               -- المخاطر
  missing_requirements TEXT[] DEFAULT '{}',-- المتطلبات الناقصة
  action_items TEXT[] DEFAULT '{}',        -- الخطوات المقترحة
  
  -- Detailed breakdown
  breakdown JSONB DEFAULT '{
    "budget_fit": 0,
    "technical_fit": 0,
    "timeline_fit": 0,
    "strategic_fit": 0,
    "risk_score": 0
  }'::jsonb NOT NULL,
  
  -- Model tracking
  model_used TEXT DEFAULT 'deepseek-chat' NOT NULL
);

-- CRM configurations
CREATE TABLE crm_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  provider crm_provider NOT NULL,
  name TEXT NOT NULL,
  config JSONB NOT NULL,                   -- Provider-specific config (webhook_url, api_key, etc.)
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_tested_at TIMESTAMPTZ,
  
  -- Only one active config per provider per user
  UNIQUE(user_id, provider, name)
);

-- CRM push history
CREATE TABLE crm_pushes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL,
  crm_config_id UUID REFERENCES crm_configs(id) ON DELETE CASCADE NOT NULL,
  
  external_id TEXT,                        -- ID from CRM system
  status push_status DEFAULT 'pending' NOT NULL,
  error_message TEXT,
  response_data JSONB
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Tenders
CREATE INDEX idx_tenders_user_id ON tenders(user_id);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_deadline ON tenders(deadline);
CREATE INDEX idx_tenders_created_at ON tenders(created_at DESC);

-- Evaluations
CREATE INDEX idx_evaluations_tender_id ON evaluations(tender_id);
CREATE INDEX idx_evaluations_score ON evaluations(score);
CREATE INDEX idx_evaluations_recommendation ON evaluations(recommendation);

-- CRM Configs
CREATE INDEX idx_crm_configs_user_id ON crm_configs(user_id);
CREATE INDEX idx_crm_configs_provider ON crm_configs(provider);

-- CRM Pushes
CREATE INDEX idx_crm_pushes_tender_id ON crm_pushes(tender_id);
CREATE INDEX idx_crm_pushes_status ON crm_pushes(status);

-- ============================================================
-- JSONB GIN INDEXES (for efficient JSONB queries)
-- ============================================================

-- GIN index for tenders.raw_data (supports @>, ?, ?&, ?| operators)
CREATE INDEX idx_tenders_raw_data_gin ON tenders USING gin (raw_data);

-- GIN index for evaluations.breakdown (supports JSONB containment queries)
CREATE INDEX idx_evaluations_breakdown_gin ON evaluations USING gin (breakdown);

-- GIN index for crm_configs.config (supports JSONB queries on config)
CREATE INDEX idx_crm_configs_config_gin ON crm_configs USING gin (config);

-- GIN index for crm_pushes.response_data (supports JSONB queries on responses)
CREATE INDEX idx_crm_pushes_response_data_gin ON crm_pushes USING gin (response_data);

-- ============================================================
-- UNIQUE CONSTRAINTS (idempotent)
-- ============================================================

-- Add unique constraint on (user_id, reference_no) for tenders
-- This enables upsert operations and prevents duplicate tenders per user
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tenders_user_reference_unique'
  ) THEN
    ALTER TABLE tenders
      ADD CONSTRAINT tenders_user_reference_unique
      UNIQUE (user_id, reference_no);
  END IF;
END $$;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenders_updated_at
  BEFORE UPDATE ON tenders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER crm_configs_updated_at
  BEFORE UPDATE ON crm_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pushes ENABLE ROW LEVEL SECURITY;

-- Tenders: Users can only access their own tenders
CREATE POLICY "Users can view own tenders"
  ON tenders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tenders"
  ON tenders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tenders"
  ON tenders FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tenders"
  ON tenders FOR DELETE
  USING (auth.uid() = user_id);

-- Evaluations: Users can access evaluations for their tenders
CREATE POLICY "Users can view evaluations for own tenders"
  ON evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenders
      WHERE tenders.id = evaluations.tender_id
      AND tenders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert evaluations for own tenders"
  ON evaluations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenders
      WHERE tenders.id = evaluations.tender_id
      AND tenders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update evaluations for own tenders"
  ON evaluations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tenders
      WHERE tenders.id = evaluations.tender_id
      AND tenders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete evaluations for own tenders"
  ON evaluations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM tenders
      WHERE tenders.id = evaluations.tender_id
      AND tenders.user_id = auth.uid()
    )
  );

-- CRM Configs: Users can only access their own configs
CREATE POLICY "Users can view own CRM configs"
  ON crm_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CRM configs"
  ON crm_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CRM configs"
  ON crm_configs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own CRM configs"
  ON crm_configs FOR DELETE
  USING (auth.uid() = user_id);

-- CRM Pushes: Users can access pushes for their tenders
CREATE POLICY "Users can view pushes for own tenders"
  ON crm_pushes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenders
      WHERE tenders.id = crm_pushes.tender_id
      AND tenders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert pushes for own tenders"
  ON crm_pushes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenders
      WHERE tenders.id = crm_pushes.tender_id
      AND tenders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pushes for own tenders"
  ON crm_pushes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tenders
      WHERE tenders.id = crm_pushes.tender_id
      AND tenders.user_id = auth.uid()
    )
  );

-- ============================================================
-- COMMENTS (Documentation)
-- ============================================================

COMMENT ON TABLE tenders IS 'Tender/منافسة records imported from Etimad or files';
COMMENT ON TABLE evaluations IS 'AI evaluation results for tenders';
COMMENT ON TABLE crm_configs IS 'CRM provider configurations (webhook, HubSpot, etc.)';
COMMENT ON TABLE crm_pushes IS 'History of tender pushes to CRM systems';

COMMENT ON COLUMN tenders.entity IS 'الجهة - Government entity name';
COMMENT ON COLUMN tenders.title IS 'عنوان المنافسة - Tender title';
COMMENT ON COLUMN tenders.reference_no IS 'رقم المنافسة - Unique tender reference number';
COMMENT ON COLUMN tenders.deadline IS 'الموعد النهائي - Submission deadline';
COMMENT ON COLUMN tenders.estimated_value IS 'القيمة التقديرية - Estimated value in SAR';

COMMENT ON COLUMN evaluations.score IS 'درجة التقييم - Overall score (0-100)';
COMMENT ON COLUMN evaluations.recommendation IS 'التوصية - qualified/conditional/excluded';
