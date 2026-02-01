# Etmaam Database Schema
# Defined BEFORE implementation (Schema-First Principle)

## Overview
This schema defines all database tables, relationships, and security policies for Etmaam. All tables use Row Level Security (RLS) for data isolation.

## Tables

### `tenders`
Main table storing tender information and AI analysis results.

```sql
CREATE TABLE tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  
  -- Tender Information
  title_ar TEXT NOT NULL,
  title_en TEXT,
  reference_no TEXT UNIQUE,
  description_ar TEXT,
  description_en TEXT,
  
  -- AI Analysis Results
  ai_qualification_score INTEGER CHECK (ai_qualification_score >= 0 AND ai_qualification_score <= 100),
  ai_summary_ar TEXT,
  ai_summary_en TEXT,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  missing_docs JSONB DEFAULT '[]'::jsonb,
  
  -- Status & Metadata
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'qualified', 'excluded', 'approved')),
  original_source_url TEXT,
  file_url TEXT, -- Supabase Storage URL
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT tenders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for Performance
CREATE INDEX idx_tenders_user_id ON tenders(user_id);
CREATE INDEX idx_tenders_status ON tenders(status);
CREATE INDEX idx_tenders_created_at ON tenders(created_at DESC);
CREATE INDEX idx_tenders_qualification_score ON tenders(ai_qualification_score DESC) WHERE ai_qualification_score IS NOT NULL;

-- Row Level Security
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenders"
  ON tenders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tenders"
  ON tenders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tenders"
  ON tenders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tenders"
  ON tenders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
```

### `deals` (CRM Integration)
Table for tenders approved and pushed to CRM.

```sql
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE NOT NULL,
  
  -- CRM Integration
  crm_id TEXT, -- External CRM system ID
  crm_synced_at TIMESTAMPTZ,
  crm_sync_status TEXT DEFAULT 'pending' CHECK (crm_sync_status IN ('pending', 'syncing', 'synced', 'failed')),
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT deals_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT deals_tender_id_fkey FOREIGN KEY (tender_id) REFERENCES tenders(id) ON DELETE CASCADE
);

CREATE INDEX idx_deals_user_id ON deals(user_id);
CREATE INDEX idx_deals_tender_id ON deals(tender_id);
CREATE INDEX idx_deals_crm_sync_status ON deals(crm_sync_status);

ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own deals"
  ON deals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own deals"
  ON deals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own deals"
  ON deals FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### `user_preferences`
Store user-specific settings.

```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- UI Preferences
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  locale TEXT DEFAULT 'ar' CHECK (locale IN ('ar', 'en')),
  
  -- Notification Settings
  email_notifications BOOLEAN DEFAULT true,
  notification_frequency TEXT DEFAULT 'daily' CHECK (notification_frequency IN ('realtime', 'daily', 'weekly')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## TypeScript Types

```typescript
// Generated from Supabase schema
export type Tender = {
  id: string
  user_id: string
  title_ar: string
  title_en: string | null
  reference_no: string | null
  description_ar: string | null
  description_en: string | null
  ai_qualification_score: number | null
  ai_summary_ar: string | null
  ai_summary_en: string | null
  risk_factors: string[]
  missing_docs: string[]
  status: 'pending' | 'analyzing' | 'qualified' | 'excluded' | 'approved'
  original_source_url: string | null
  file_url: string | null
  created_at: string
  updated_at: string
}

export type Deal = {
  id: string
  user_id: string
  tender_id: string
  crm_id: string | null
  crm_synced_at: string | null
  crm_sync_status: 'pending' | 'syncing' | 'synced' | 'failed'
  notes: string | null
  created_at: string
  updated_at: string
}

export type UserPreferences = {
  user_id: string
  theme: 'light' | 'dark' | 'system'
  locale: 'ar' | 'en'
  email_notifications: boolean
  notification_frequency: 'realtime' | 'daily' | 'weekly'
  created_at: string
  updated_at: string
}
```

## Relationships

```
auth.users (1) ──< (many) tenders
tenders (1) ──< (many) deals
auth.users (1) ──< (1) user_preferences
```

## Security Notes

1. **All tables have RLS enabled** - No exceptions
2. **All policies check `auth.uid()`** - Users can only access their own data
3. **Foreign keys use `ON DELETE CASCADE`** - Clean up related data when user deleted
4. **Indexes on foreign keys** - Performance optimization

## Migration Strategy

1. Run migrations in order (001, 002, 003...)
2. Test RLS policies after each migration
3. Generate TypeScript types after schema changes
4. Update Zod schemas to match database schema
