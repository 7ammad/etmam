/**
 * Scraper Type Definitions
 *
 * Types and Zod schemas for the Etimad tender scraper.
 */

import { z } from 'zod'

/**
 * Scraped tender data schema
 *
 * Validates data extracted from the Etimad portal.
 * Required fields come from the list page, optional from detail page.
 */
/**
 * Helper to validate ISO 8601 date strings
 */
const isoDateString = z.string().refine(
  (val) => {
    const date = new Date(val)
    return !isNaN(date.getTime()) && val.includes('T')
  },
  { message: 'Must be a valid ISO 8601 date string (e.g., 2026-02-10T00:00:00.000Z)' }
)

export const scrapedTenderSchema = z.object({
  // Required fields (from list page)
  reference_no: z.string().min(1, 'Reference number is required'),
  title: z.string().min(1, 'Title is required'),
  entity: z.string().min(1, 'Entity is required'),
  deadline: isoDateString,

  // Optional fields (from list page or detail page)
  estimated_value: z.number().nullable().optional(),

  // Award fields (from award_results tab; present for historical/awarded tenders)
  award_amount_sar: z.number().nullable().optional(),
  award_date: z.string().nullable().optional(),
  winning_bidder: z.string().nullable().optional(),

  // Detail page fields (deep scrape)
  booklet_price: z.number().nullable().optional(),
  initial_guarantee: z.number().nullable().optional(),
  contract_duration: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  tender_url: z.string().url().optional(),

  /** Data scraped from each detail-page tab (Basic Info, Addresses/Dates, Classification, Award, Local Content). Required; must contain at least one tab section. */
  tab_sections: z
    .record(z.string(), z.record(z.string(), z.string()))
    .refine((obj) => Object.keys(obj).length > 0, {
      message: 'tab_sections must contain at least one tab',
    }),

  // Metadata
  source: z.literal('etimad'),
  scraped_at: isoDateString,
})

export type ScrapedTender = z.infer<typeof scrapedTenderSchema>

/**
 * Activity filter configuration for targeting specific tender categories
 */
export interface ActivityFilter {
  /** Main activity ID (e.g., '9' for Telecom/IT) */
  mainActivityId: string
  /** Optional sub-activity ID (e.g., '902' for IT) */
  subActivityId?: string
}

/**
 * Progress callback for real-time scraping updates
 */
export interface ScrapeProgress {
  /** Current phase: 'initializing' | 'collecting' | 'scraping' | 'syncing' */
  phase: 'initializing' | 'collecting' | 'scraping' | 'syncing'
  /** Human-readable message */
  message: string
  /** Progress percentage (0-100) */
  percent: number
  /** Number of URLs collected so far */
  urlsCollected?: number
  /** Total URLs to scrape */
  urlsTotal?: number
  /** Number of tenders scraped so far */
  tendersScraped?: number
  /** Number of tenders to scrape */
  tendersTotal?: number
  /** Current page number (during collection) */
  currentPage?: number
}

export type ProgressCallback = (progress: ScrapeProgress) => void

/**
 * Scraper configuration
 */
export interface ScraperConfig {
  /** Base URL of the Etimad portal */
  baseUrl: string
  /** Number of tenders to scrape per batch */
  batchSize: number
  /** Delay between requests in milliseconds */
  delayMs: number
  /** Maximum retry attempts for failed requests */
  maxRetries: number
  /** Browser user agent string */
  userAgent: string
  /** Run browser in headless mode */
  headless: boolean
  /** Timeout for page navigation in milliseconds */
  timeout: number
  /** Optional activity filter for targeting specific sectors */
  activityFilter?: ActivityFilter
  /** Optional: 'active' = open for bids (2), 'historical' = awarded (6). Default: 'active'. */
  mode?: 'active' | 'historical'
  /** Optional: items per page on list (6, 12, 18, 24). Default: 24 for historical, 6 for active. */
  listPageSize?: 6 | 12 | 18 | 24
  /** Optional: progress callback for real-time updates */
  onProgress?: ProgressCallback
}

/**
 * Scrape error details
 */
export interface ScrapeError {
  /** Tender reference number if known */
  referenceNo?: string
  /** URL that failed */
  url?: string
  /** Error message */
  message: string
  /** Error code for categorization */
  code?: string
  /** When the error occurred */
  timestamp: string
  /** Whether the error is recoverable */
  recoverable?: boolean
}

/**
 * Scrape operation result
 */
export interface ScrapeResult {
  /** Whether the scrape completed without critical errors */
  success: boolean
  /** Successfully scraped tenders */
  tenders: ScrapedTender[]
  /** Errors encountered during scraping */
  errors: ScrapeError[]
  /** Operation metadata */
  metadata: ScrapeMetadata
}

/**
 * Scrape operation metadata
 */
export interface ScrapeMetadata {
  /** When the scrape started */
  startedAt: string
  /** When the scrape completed */
  completedAt: string
  /** Total tenders successfully scraped */
  totalScraped: number
  /** Total errors encountered */
  totalErrors: number
  /** Total tenders found on list page */
  totalFound?: number
  /** Configuration used for this scrape */
  config?: Partial<ScraperConfig>
}

/**
 * CSS selectors for Etimad portal
 *
 * VERIFIED: 2026-01-27 via recon script
 * Portal uses card-based layout (not tables).
 */
export interface EtimadSelectors {
  // List page selectors
  listPage: {
    /** Container for tender cards (#cardsresult) */
    tenderList: string
    /** Individual tender card (.tender-card with data-ref) */
    tenderItem: string
    /** Link to tender detail page */
    tenderLink: string
    /** Tender title text */
    tenderTitle: string
    /** Tender reference number (from data-ref attribute) */
    referenceNo: string
    /** Entity/organization name */
    entity: string
    /** Deadline/days remaining */
    deadline: string
    /** Pagination controls */
    pagination: string
    /** Next page button */
    nextPage: string
    /** Tender status filter dropdown */
    filterActive: string
    /** Filter panel toggle (top-left search button) */
    filterToggle: string
    /** Filter panel collapse target */
    filterPanel: string
    /** Basic info section inside filter panel */
    filterBasicInfo: string
    /** Main activity dropdown */
    mainActivitySelect: string
    /** Sub-activity dropdown */
    subActivitySelect: string
    /** Search submit button inside filter panel */
    filterSearchButton: string
    /** Items per page selector */
    itemsPerPage: string
    /** Tender type badge */
    tenderType: string
    /** Booklet price on card */
    bookletPrice: string
    /** Publish date */
    publishDate: string
  }
  // Detail page selectors (tab-based layout with list groups)
  detailPage: {
    /** Main content area - tab based navigation */
    content: string
    /** Data list container (.list-group.form-details-list) */
    dataList: string
    /** Individual data item (.list-group-item) */
    dataItem: string
    /** Item label (.etd-item-title) */
    itemLabel: string
    /** Item value (.etd-item-info span) */
    itemValue: string
    /** Purpose/description truncated (#subPurposSapn) */
    purposeTruncated: string
    /** Purpose/description full (#purposeSpan) */
    purposeFull: string
    /** Tab list selector */
    tabList: string
    /** Tab link selector */
    tabLink: string
    /** Tab pane selector */
    tabPane: string
  }
  // Arabic labels to search for
  arabicLabels: {
    bookletPrice: string[]
    initialGuarantee: string[]
    contractDuration: string[]
    referenceNo: string[]
    entity: string[]
    deadline: string[]
    estimatedValue: string[]
    winningBidder?: string[]
    awardAmount?: string[]
    awardDate?: string[]
  }
}

/**
 * API sync request payload
 */
export interface SyncPayload {
  tenders: ScrapedTender[]
  metadata: ScrapeMetadata
}

/**
 * API sync response
 */
export interface SyncResponse {
  success: boolean
  upserted: number
  errors: string[]
  metadata?: ScrapeMetadata
}
