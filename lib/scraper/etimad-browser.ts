/**
 * Etimad Portal Browser Scraper
 *
 * Main scraper class for extracting tender data from the Etimad portal.
 *
 * Usage:
 *   const scraper = new EtimadScraper()
 *   await scraper.init()
 *   const result = await scraper.scrapePublicTenders()
 *   await scraper.close()
 *
 * Or use the convenience function:
 *   const result = await scrapePublicTenders()
 */

import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test'
import type {
  ScrapedTender,
  ScrapeResult,
  ScrapeError,
  ScraperConfig,
  ScrapeMetadata,
} from '@/types/scraper'
import { scrapedTenderSchema } from '@/types/scraper'
import { DEFAULT_CONFIG, ETIMAD_URLS, ETIMAD_SELECTORS, ETMAM_ACTIVITY_FILTERS, TENDER_STATUS_FILTERS } from './config'
import {
  withRetry,
  delay,
  checkForBlock,
  parseSARAmount,
  parsePercentage,
  parseDuration,
  parseDate,
  findValueByArabicLabel,
  sanitizeText,
} from './utils'
import {
  NavigationError,
  BlockedError,
  TimeoutError,
  ValidationError,
  wrapError,
} from './errors'

/**
 * Etimad Portal Scraper
 *
 * Scrapes tender data from https://tenders.etimad.sa (Arabic-only portal)
 */
export class EtimadScraper {
  private config: ScraperConfig
  private browser: Browser | null = null
  private context: BrowserContext | null = null

  constructor(config: Partial<ScraperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Initialize the browser instance
   */
  async init(): Promise<void> {
    if (this.browser) return

    this.browser = await chromium.launch({
      headless: this.config.headless,
    })

    this.context = await this.browser.newContext({
      userAgent: this.config.userAgent,
      locale: 'ar-SA', // Arabic locale for Arabic-only portal
      viewport: { width: 1920, height: 1080 },
    })
  }

  /**
   * Clean up browser resources
   */
  async close(): Promise<void> {
    if (this.context) {
      await this.context.close()
      this.context = null
    }
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  /**
   * Main entry point: scrape active tenders from Etimad
   *
   * @returns Scrape result with tenders, errors, and metadata
   */
  async scrapePublicTenders(): Promise<ScrapeResult> {
    const startedAt = new Date().toISOString()
    const tenders: ScrapedTender[] = []
    const errors: ScrapeError[] = []

    // Ensure browser is initialized
    if (!this.browser || !this.context) {
      await this.init()
    }

    const page = await this.context!.newPage()

    try {
      // Step 1: Navigate to tender list with optional activity filter
      console.log('[Scraper] Navigating to tender list...')
      const listUrl = this.buildListUrl()
      console.log(`[Scraper] URL: ${listUrl}`)

      await this.navigateWithRetry(page, listUrl)

      // Step 2: Check for blocking
      if (await checkForBlock(page)) {
        throw new BlockedError('Blocking detected on list page', listUrl)
      }

      // Step 3: Apply filters (if needed)
      await this.applyActiveFilter(page)

      // Step 4: Extract tender URLs from list
      console.log('[Scraper] Extracting tender URLs...')
      const tenderUrls = await this.extractTenderUrls(page)
      console.log(`[Scraper] Found ${tenderUrls.length} tender URLs`)

      // Step 5: Deep scrape each tender (with batch limit)
      const urlsToScrape = tenderUrls.slice(0, this.config.batchSize)
      console.log(`[Scraper] Scraping ${urlsToScrape.length} tenders...`)

      for (let i = 0; i < urlsToScrape.length; i++) {
        const url = urlsToScrape[i]
        console.log(`[Scraper] [${i + 1}/${urlsToScrape.length}] ${url}`)

        try {
          const tender = await this.scrapeTenderDetail(page, url)
          if (tender) {
            tenders.push(tender)
          }
        } catch (err) {
          const error = wrapError(err)
          errors.push({
            url,
            message: error.message,
            code: error.code,
            recoverable: error.recoverable,
            timestamp: new Date().toISOString(),
          })
          console.error(`[Scraper] Error scraping ${url}: ${error.message}`)
        }

        // Rate limiting between requests
        if (i < urlsToScrape.length - 1) {
          await delay(this.config.delayMs)
        }
      }
    } catch (err) {
      const error = wrapError(err)
      errors.push({
        message: error.message,
        code: error.code,
        recoverable: error.recoverable,
        timestamp: new Date().toISOString(),
      })
      console.error(`[Scraper] Fatal error: ${error.message}`)
    } finally {
      await page.close()
    }

    const completedAt = new Date().toISOString()
    const metadata: ScrapeMetadata = {
      startedAt,
      completedAt,
      totalScraped: tenders.length,
      totalErrors: errors.length,
      config: {
        batchSize: this.config.batchSize,
        delayMs: this.config.delayMs,
      },
    }

    return {
      success: errors.length === 0 || tenders.length > 0,
      tenders,
      errors,
      metadata,
    }
  }

  /**
   * Navigate to a URL with retry logic
   */
  private async navigateWithRetry(page: Page, url: string): Promise<void> {
    await withRetry(
      async () => {
        try {
          await page.goto(url, {
            waitUntil: 'networkidle',
            timeout: this.config.timeout,
          })
        } catch (err) {
          if (err instanceof Error && err.message.includes('Timeout')) {
            throw new TimeoutError(url, this.config.timeout)
          }
          throw new NavigationError(url, err instanceof Error ? err : undefined)
        }
      },
      {
        maxRetries: this.config.maxRetries,
        delayMs: this.config.delayMs,
        onRetry: (attempt, error, nextDelay) => {
          console.log(
            `[Scraper] Navigation retry ${attempt}/${this.config.maxRetries}: ${error.message}. Waiting ${nextDelay}ms...`
          )
        },
      }
    )
  }

  /**
   * Build the list page URL with optional activity filter
   *
   * VERIFIED: 2026-01-27 via recon script
   * Filter URL format: /Tender/AllTendersForVisitor?TenderActivityId=9&TenderSubActivityId=902
   */
  private buildListUrl(): string {
    const baseListUrl = `${this.config.baseUrl}${ETIMAD_URLS.tenderList}`
    const params = new URLSearchParams()

    // Apply activity filter if configured
    if (this.config.activityFilter) {
      params.set('TenderActivityId', this.config.activityFilter.mainActivityId)
      if (this.config.activityFilter.subActivityId) {
        params.set('TenderSubActivityId', this.config.activityFilter.subActivityId)
      }
      console.log(
        `[Scraper] Filtering by activity: ${this.config.activityFilter.mainActivityId}` +
          (this.config.activityFilter.subActivityId
            ? `/${this.config.activityFilter.subActivityId}`
            : '')
      )
    }

    const queryString = params.toString()
    return queryString ? `${baseListUrl}?${queryString}` : baseListUrl
  }

  /**
   * Apply filter for active tenders and Telecom/IT category
   *
   * VERIFIED: 2026-01-27 via recon script
   * Filter URL format: /Tender/AllTendersForVisitor?TenderActivityId=9&TenderSubActivityId=902
   */
  private async applyActiveFilter(page: Page): Promise<void> {
    await page.waitForLoadState('networkidle')

    // Check if we're already on a filtered URL
    const currentUrl = page.url()
    if (currentUrl.includes('TenderActivityId=')) {
      console.log('[Scraper] Activity filter already applied via URL')
      return
    }

    // Try to apply filter via dropdown (TenderCategory for status)
    try {
      const statusFilter = await page.$(ETIMAD_SELECTORS.listPage.filterActive)
      if (statusFilter) {
        // Select "active" tenders (value: '1')
        await statusFilter.selectOption('1')
        console.log('[Scraper] Applied active tender status filter')
        await page.waitForLoadState('networkidle')
        await delay(1000) // Wait for results to update
      }
    } catch (err) {
      console.log('[Scraper] Status filter dropdown not found, continuing with default view')
    }
  }

  /**
   * Extract tender detail URLs from the list page
   */
  private async extractTenderUrls(page: Page): Promise<string[]> {
    // Try multiple selector strategies
    const selectors = ETIMAD_SELECTORS.listPage.tenderLink.split(', ')

    for (const selector of selectors) {
      try {
        const links = await page.$$eval(selector, (anchors) =>
          anchors
            .map((a) => a.getAttribute('href'))
            .filter((href): href is string => !!href)
        )

        if (links.length > 0) {
          // Normalize URLs
          const normalized = [...new Set(links)].map((href) =>
            href.startsWith('http') ? href : `${this.config.baseUrl}${href}`
          )
          return normalized
        }
      } catch {
        // Try next selector
      }
    }

    // Enhanced logging for debugging
    const pageTitle = await page.title()
    const currentUrl = page.url()
    console.warn('[Scraper] No tender URLs found with configured selectors')
    console.warn(`[Scraper] Page title: ${pageTitle}`)
    console.warn(`[Scraper] Current URL: ${currentUrl}`)
    
    // Check if page loaded correctly
    const pageContent = await page.content()
    const hasTenderList = pageContent.includes('tender') || pageContent.includes('منافسة')
    console.warn(`[Scraper] Page contains tender-related content: ${hasTenderList}`)
    
    return []
  }

  /**
   * Scrape detailed information from a tender page
   */
  private async scrapeTenderDetail(
    page: Page,
    url: string
  ): Promise<ScrapedTender | null> {
    await this.navigateWithRetry(page, url)

    // Check for blocking
    if (await checkForBlock(page)) {
      throw new BlockedError('Blocking detected on detail page', url)
    }

    // Extract data using multiple strategies
    const data = await this.extractTenderData(page, url)

    // Validate with Zod
    const result = scrapedTenderSchema.safeParse(data)
    if (!result.success) {
      const validationErrors = result.error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }))
      throw new ValidationError(validationErrors, data.reference_no)
    }

    return result.data
  }

  /**
   * Extract tender data from the detail page
   *
   * VERIFIED: 2026-01-27 via recon script
   * Uses .list-group.form-details-list with .etd-item-title / .etd-item-info span
   */
  private async extractTenderData(
    page: Page,
    url: string
  ): Promise<Partial<ScrapedTender>> {
    const labels = ETIMAD_SELECTORS.arabicLabels
    const selectors = ETIMAD_SELECTORS.detailPage

    // Strategy 1: Extract using verified structured selectors
    const structuredData = await page.evaluate(
      (sel) => {
        const result: Record<string, string> = {}

        // Find all list items in the form details list
        const items = document.querySelectorAll(`${sel.dataList} ${sel.dataItem}`)
        items.forEach((item) => {
          const labelEl = item.querySelector(sel.itemLabel)
          const valueEl = item.querySelector(sel.itemValue)
          if (labelEl && valueEl) {
            const label = labelEl.textContent?.trim() || ''
            const value = valueEl.textContent?.trim() || ''
            if (label && value) {
              result[label] = value
            }
          }
        })

        // Extract title from h1
        const h1 = document.querySelector('h1')
        result['_title'] = h1?.textContent?.trim() || ''

        // Extract description from purpose spans
        const purposeFull = document.querySelector(sel.purposeFull)
        const purposeTruncated = document.querySelector(sel.purposeTruncated)
        result['_description'] =
          purposeFull?.textContent?.trim() ||
          purposeTruncated?.textContent?.trim() ||
          ''

        return result
      },
      selectors
    )

    // Strategy 2: Fallback to Arabic label matching
    const [
      referenceNoRaw,
      entityRaw,
      deadlineRaw,
      estimatedValueRaw,
      bookletPriceRaw,
      initialGuaranteeRaw,
      contractDurationRaw,
    ] = await Promise.all([
      this.findInStructuredData(structuredData, labels.referenceNo) ||
        findValueByArabicLabel(page, labels.referenceNo),
      this.findInStructuredData(structuredData, labels.entity) ||
        findValueByArabicLabel(page, labels.entity),
      this.findInStructuredData(structuredData, labels.deadline) ||
        findValueByArabicLabel(page, labels.deadline),
      this.findInStructuredData(structuredData, labels.estimatedValue) ||
        findValueByArabicLabel(page, labels.estimatedValue),
      this.findInStructuredData(structuredData, labels.bookletPrice) ||
        findValueByArabicLabel(page, labels.bookletPrice),
      this.findInStructuredData(structuredData, labels.initialGuarantee) ||
        findValueByArabicLabel(page, labels.initialGuarantee),
      this.findInStructuredData(structuredData, labels.contractDuration) ||
        findValueByArabicLabel(page, labels.contractDuration),
    ])

    // Get title from page title as final fallback
    const pageTitle = await page.title()

    // Build tender object
    const data: Partial<ScrapedTender> = {
      reference_no:
        sanitizeText(referenceNoRaw) || this.extractReferenceFromUrl(url) || 'UNKNOWN',
      title:
        sanitizeText(structuredData['_title']) || sanitizeText(pageTitle) || 'Untitled Tender',
      entity: sanitizeText(entityRaw) || 'Unknown Entity',
      deadline: parseDate(deadlineRaw) || new Date().toISOString(),
      estimated_value: parseSARAmount(estimatedValueRaw),
      booklet_price: parseSARAmount(bookletPriceRaw),
      initial_guarantee: parsePercentage(initialGuaranteeRaw),
      contract_duration: parseDuration(contractDurationRaw),
      description: sanitizeText(structuredData['_description']) || null,
      tender_url: url,
      source: 'etimad',
      scraped_at: new Date().toISOString(),
    }

    return data
  }

  /**
   * Find a value in structured data by matching Arabic labels
   */
  private findInStructuredData(
    data: Record<string, string>,
    labelVariants: string[]
  ): string | null {
    for (const label of labelVariants) {
      // Direct match
      if (data[label]) {
        return data[label]
      }
      // Partial match (label contains the variant)
      for (const key of Object.keys(data)) {
        if (key.includes(label) || label.includes(key)) {
          return data[key]
        }
      }
    }
    return null
  }

  /**
   * Try to extract reference number from URL
   */
  private extractReferenceFromUrl(url: string): string | null {
    // Common patterns: /tender/12345, /TenderDetails?id=12345
    const patterns = [
      /\/tender\/(\d+)/i,
      /TenderDetails.*[?&]id=(\d+)/i,
      /tender[_-]?id=(\d+)/i,
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return null
  }
}

/**
 * Convenience function for one-off scraping
 *
 * @param config - Optional scraper configuration
 * @returns Scrape result
 */
export async function scrapePublicTenders(
  config?: Partial<ScraperConfig>
): Promise<ScrapeResult> {
  const scraper = new EtimadScraper(config)
  try {
    await scraper.init()
    return await scraper.scrapePublicTenders()
  } finally {
    await scraper.close()
  }
}
