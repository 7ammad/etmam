/**
 * Etimad Scraper Module
 *
 * Public exports for the Etimad tender portal scraper.
 *
 * Usage:
 *   import { scrapePublicTenders, EtimadScraper } from '@/lib/scraper'
 *
 *   // Quick scrape with defaults
 *   const result = await scrapePublicTenders()
 *
 *   // Custom configuration
 *   const scraper = new EtimadScraper({ batchSize: 10 })
 *   await scraper.init()
 *   const result = await scraper.scrapePublicTenders()
 *   await scraper.close()
 */

// Main scraper
export { EtimadScraper, scrapePublicTenders } from './etimad-browser'

// Configuration
export {
  DEFAULT_CONFIG,
  ETIMAD_URLS,
  ETIMAD_SELECTORS,
  ERROR_CODES,
  BLOCK_INDICATORS,
  ACTIVITY_IDS,
  SUB_ACTIVITY_IDS,
  ETMAM_ACTIVITY_FILTERS,
  TENDER_STATUS_FILTERS,
  TENDER_TYPE_FILTERS,
  type ErrorCode,
} from './config'

// Utilities
export {
  withRetry,
  delay,
  checkForBlock,
  parseSARAmount,
  parsePercentage,
  parseDuration,
  parseDate,
  extractText,
  findValueByArabicLabel,
  generateTenderId,
  sanitizeText,
  type RetryOptions,
} from './utils'

// Errors
export {
  ScraperError,
  NavigationError,
  SelectorNotFoundError,
  RateLimitError,
  BlockedError,
  TimeoutError,
  ParseError,
  ValidationError,
  NetworkError,
  isScraperError,
  wrapError,
} from './errors'

// Re-export types for convenience
export type {
  ScrapedTender,
  ScraperConfig,
  ScrapeResult,
  ScrapeError,
  ScrapeMetadata,
  EtimadSelectors,
  SyncPayload,
  SyncResponse,
} from '@/types/scraper'
