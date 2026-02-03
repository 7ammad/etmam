Claude’s Plan
Historic Data Preservation & Competitors Analysis Plan
Overview
Two features to implement:

Historic Data Protection - Ensure historic tender data is always preserved for ML/pattern recognition
Competitors Analysis Tab - V2 Analysis page with market insights based on historic data
Feature 1: Historic Data Protection
Database Migration (supabase/migrations/00017_historic_data_protection.sql)
Add soft delete and protection mechanism:


-- Soft delete support
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS is_protected BOOLEAN DEFAULT FALSE;

-- Auto-protect historic tenders
CREATE OR REPLACE FUNCTION protect_historic_tenders()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.award_amount_sar IS NOT NULL THEN
    NEW.is_protected = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenders_protect_historic
  BEFORE INSERT OR UPDATE ON tenders
  FOR EACH ROW EXECUTE FUNCTION protect_historic_tenders();

-- Analysis indexes
CREATE INDEX IF NOT EXISTS idx_tenders_award_winning_bidder
  ON tenders(winning_bidder) WHERE award_amount_sar IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenders_historic_analysis
  ON tenders(award_date, award_amount_sar, winning_bidder, entity)
  WHERE award_amount_sar IS NOT NULL;
Type Updates (types/database.ts)
Add deleted_at?: string and is_protected?: boolean to Tender type.

Query Updates (lib/queries/tender.ts)
Add .is('deleted_at', null) filter to all tender queries.

Feature 2: Competitors Analysis Tab
New Files to Create
File	Purpose
lib/queries/analysis.ts	Query functions for competitor stats
app/[locale]/dashboard/analysis/page.tsx	Server component for data fetching
app/[locale]/dashboard/analysis/loading.tsx	Loading skeleton
components/dashboard/analysis/analysis-page-client.tsx	Main client wrapper
components/dashboard/analysis/analysis-kpi-row.tsx	Top metrics (4 KPIs)
components/dashboard/analysis/competitors-leaderboard.tsx	Top 10-20 competitors table
components/dashboard/analysis/competitor-bar-chart.tsx	Tremor bar chart
components/dashboard/analysis/trend-area-chart.tsx	Tremor area chart
Query Functions (lib/queries/analysis.ts)

export interface CompetitorStats {
  bidderName: string
  winCount: number
  totalValue: number
  avgValue: number
  lastWinDate: string
}

export interface AnalysisKpiStats {
  totalAwardedValue: number
  uniqueCompetitors: number
  averageAwardValue: number
  totalHistoricTenders: number
}

export async function getAnalysisKpis(): Promise<AnalysisKpiStats>
export async function getCompetitorStats(): Promise<CompetitorStats[]>
export async function getAwardTrends(period: 'month' | 'quarter'): Promise<AwardTrend[]>
KPI Row (4 cards)
KPI	Description
Total Awarded Value	Sum of all award_amount_sar
Unique Competitors	COUNT(DISTINCT winning_bidder)
Average Award	AVG(award_amount_sar)
Historic Tenders	Total count with award data
Competitors Leaderboard
Table with columns: Rank, Bidder Name, Wins, Total Value, Avg Value, Last Win Date

Charts (using Tremor)
Bar Chart - Top 10 competitors by win count
Area Chart - Award trends over time (monthly)
Navigation Update (components/layout/app-sidebar.tsx)
Enable the disabled "Analytics" link, point to /[locale]/dashboard/analysis.

Translation Keys
Add to messages/en.json and messages/ar.json:


"analysis": {
  "pageTitle": "Market Analysis",
  "subtitle": "{count} historic tenders analyzed",
  "kpi": {
    "totalAwarded": "Total Awarded Value",
    "uniqueCompetitors": "Unique Competitors",
    "avgAward": "Average Award",
    "historicTenders": "Historic Tenders"
  },
  "competitors": {
    "title": "Top Competitors",
    "rank": "Rank",
    "bidder": "Bidder",
    "wins": "Wins",
    "totalValue": "Total Value",
    "avgValue": "Avg Value",
    "lastWin": "Last Win"
  },
  "charts": {
    "winsByBidder": "Wins by Bidder",
    "trendsOverTime": "Award Trends Over Time"
  },
  "empty": {
    "title": "No historic data yet",
    "guidance": "Load historic tenders to see market analysis."
  }
}
Files to Modify
File	Changes
types/database.ts	Add deleted_at, is_protected fields
lib/queries/tender.ts	Add soft delete filter
components/layout/app-sidebar.tsx	Enable Analytics link
messages/en.json	Add analysis translations
messages/ar.json	Add analysis translations (Arabic)
Implementation Order
Database migration (protection + indexes)
Type updates
Query functions (lib/queries/analysis.ts)
Analysis page route
KPI row component
Competitors leaderboard component
Charts (bar + area)
Sidebar navigation
Translations
Verification Steps
Run pnpm supabase db reset or apply migration
Run pnpm type-check - no errors
Navigate to /en/dashboard/analysis
Verify KPIs show correct aggregated values
Verify competitors table loads with sorted data
Verify charts render with historic data
Test empty state (no historic data)
Test Arabic locale for RTL
Dependencies
Tremor (@tremor/react) - Already installed
Radix UI themes - Already used
Design tokens from styles/tokens.css
User approved the plan