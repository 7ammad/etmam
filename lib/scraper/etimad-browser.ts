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
import {
  DEFAULT_CONFIG,
  ETIMAD_URLS,
  ETIMAD_SELECTORS,
  ACTIVITY_IDS,
  SUB_ACTIVITY_IDS,
  TENDER_STATUS_FILTERS,
} from './config'
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
  detectNonItTenders,
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
      // Step 1: Navigate to tender list (base URL; no query params – filters applied via UI)
      console.log('[Scraper] Navigating to tender list...')
      const listUrl = this.buildListUrl()
      console.log(`[Scraper] URL: ${listUrl}`)

      await this.navigateWithRetry(page, listUrl)

      // Step 2: Check for blocking
      if (await checkForBlock(page)) {
        throw new BlockedError('Blocking detected on list page', listUrl)
      }

      // Step 3: Apply filters via UI (search button → Tender status: open for bids, Main: Telecom & IT, Sub: IT → Search)
      await this.applyFiltersViaUI(page)

      // Step 3b: Set list page size (e.g. 24 for historical to get more tenders per page)
      await this.setListPageSize(page)

      // Step 4: Collect tender URLs from list (with pagination until we have enough or all pages for historical)
      console.log('[Scraper] Collecting tender URLs (with pagination)...')
      const tenderUrls = await this.collectTenderUrlsWithPagination(page)
      console.log(`[Scraper] Found ${tenderUrls.length} tender URLs`)

      // Step 5: Deep scrape tenders (slice to batchSize; historical run uses high batchSize to get all)
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

      // Logic verification: when STRICT_FILTER_VERIFY=true, fail if any scraped tender looks non-IT
      if (process.env.STRICT_FILTER_VERIFY === 'true' && tenders.length > 0) {
        const violations = detectNonItTenders(tenders)
        if (violations.length > 0) {
          const msg = `Filter verification failed: ${violations.length} tender(s) appear non-IT (Telecom/IT filter expected). Examples: ${violations.slice(0, 3).map((v) => v.reference_no + ': ' + v.title.slice(0, 50)).join('; ')}`
          console.error('[Scraper] ' + msg)
          errors.push({
            message: msg,
            code: 'PARSE_ERROR',
            recoverable: false,
            timestamp: new Date().toISOString(),
          })
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
   * Build the list page URL (base list; filters are applied via UI).
   */
  private buildListUrl(): string {
    return `${this.config.baseUrl}${ETIMAD_URLS.tenderList}`
  }

  /**
   * Apply filters via the portal UI: open filter panel, set Tender status, Main activity = Telecom & IT,
   * Sub-activity = IT, then click Search. Uses Playwright selectOption on native <select> elements
   * so values are applied correctly (bootstrap-select wraps these; setting the select is what the form submits).
   */
  private async applyFiltersViaUI(page: Page): Promise<void> {
    const sel = ETIMAD_SELECTORS.listPage
    const tenderStatus =
      this.config.mode === 'historical'
        ? TENDER_STATUS_FILTERS.awarded
        : TENDER_STATUS_FILTERS.active
    const mainActivityId = ACTIVITY_IDS.TELECOM_IT
    const subActivityId = SUB_ACTIVITY_IDS.IT

    console.log('[Scraper] Opening filter panel (search button)...')
    const toggle = page.locator(sel.filterToggle).first()
    await toggle.click()
    await delay(1000)

    await page.locator(sel.filterPanel).waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    const basicInfoLink = page.locator(`a[href="#basicInfo"]`).first()
    if (await basicInfoLink.isVisible().catch(() => false)) {
      const expanded = await page.locator(sel.filterBasicInfo).getAttribute('class')
      if (expanded?.includes('collapse') && !expanded?.includes('show')) {
        await basicInfoLink.click()
        await delay(600)
      }
    }

    // Wait for Tender Category dropdown to have options (including our target value)
    await page.waitForFunction(
      (value: string) => {
        const select = document.querySelector<HTMLSelectElement>('#TenderCategory')
        if (!select) return false
        return Array.from(select.options).some((o) => o.value === value)
      },
      tenderStatus,
      { timeout: 10000 }
    ).catch(() => {})
    await delay(400)

    console.log(`[Scraper] Tender status: ${this.config.mode === 'historical' ? 'historical (awarded)' : 'active'} (value ${tenderStatus})`)
    await page.locator('#TenderCategory').selectOption({ value: tenderStatus })
    await page.locator('#TenderCategory').evaluate((el) => el.dispatchEvent(new Event('change', { bubbles: true })))
    await delay(600)

    // Wait for Main activity dropdown to have option 9 (Telecom & IT)
    await page.waitForFunction(
      (value: string) => {
        const select = document.querySelector<HTMLSelectElement>('#activitiesList')
        if (!select) return false
        return Array.from(select.options).some((o) => o.value === value)
      },
      mainActivityId,
      { timeout: 10000 }
    ).catch(() => {})
    await delay(400)

    console.log('[Scraper] Main activity: Telecom & IT (9), Sub-activity: IT (902)')
    await page.locator('#activitiesList').selectOption({ value: mainActivityId })
    await page.locator('#activitiesList').evaluate((el) => el.dispatchEvent(new Event('change', { bubbles: true })))
    await delay(1200)

    // Sub-activities load after main activity change; wait for option 902 (IT)
    await page.waitForFunction(
      (value: string) => {
        const select = document.querySelector<HTMLSelectElement>('#subActivitiesList')
        if (!select) return false
        return Array.from(select.options).some((o) => o.value === value)
      },
      subActivityId,
      { timeout: 10000 }
    ).catch(() => {})
    await delay(400)

    await page.locator('#subActivitiesList').selectOption({ value: subActivityId })
    await page.locator('#subActivitiesList').evaluate((el) => el.dispatchEvent(new Event('change', { bubbles: true })))
    await delay(600)

    // If portal uses bootstrap-select, refresh so visible UI matches (optional; form still uses <select> value)
    await page.evaluate(() => {
      const w = window as Window & { jQuery?: (sel: string) => { selectpicker: (a: string) => void } }
      const $ = w.jQuery
      if (typeof $ !== 'function') return
      try {
        $('#TenderCategory').selectpicker('refresh')
        $('#activitiesList').selectpicker('refresh')
        $('#subActivitiesList').selectpicker('refresh')
      } catch {
        /* no selectpicker */
      }
    })
    await delay(400)

    console.log('[Scraper] Clicking Search in filter panel...')
    await page.locator(sel.filterSearchButton).first().click()
    await page.waitForLoadState('networkidle')
    await delay(this.config.delayMs)

    // Wait for results area to load so filter was applied (container appears even if 0 results)
    await page.waitForSelector(sel.tenderList, { state: 'visible', timeout: 15000 }).catch(() => {})
    await delay(500)
  }

  /** Maximum tenders to collect in historical mode (safety cap). */
  private static readonly MAX_HISTORICAL_TENDERS = 5000

  /**
   * Set the list page "عدد العناصر" (items per page) dropdown to show more results (6, 12, 18, 24).
   * Called after search so the results page is visible.
   */
  private async setListPageSize(page: Page): Promise<void> {
    const size = this.config.listPageSize ?? 24
    const sel = ETIMAD_SELECTORS.listPage.itemsPerPage
    try {
      await page.waitForSelector(sel, { state: 'visible', timeout: 8000 })
      await page.locator(sel).selectOption({ value: String(size) })
      await delay(600)
      // If portal uses bootstrap-select, refresh visible dropdown
      await page.evaluate(() => {
        const w = window as Window & { jQuery?: (s: string) => { selectpicker: (a: string) => void } }
        if (typeof w.jQuery === 'function') {
          try {
            w.jQuery('#itemsPerPage').selectpicker('refresh')
          } catch {
            /* no selectpicker */
          }
        }
      })
      await page.waitForLoadState('networkidle')
      await delay(this.config.delayMs)
      console.log(`[Scraper] List page size set to ${size} items`)
    } catch {
      console.warn(`[Scraper] Could not set items per page to ${size}, using default`)
    }
  }

  /**
   * Collect tender detail URLs from list, following pagination until we have
   * enough (batchSize) or all pages (historical mode) or no next page.
   */
  private async collectTenderUrlsWithPagination(page: Page): Promise<string[]> {
    const isHistorical = this.config.mode === 'historical'
    const targetCount = isHistorical
      ? EtimadScraper.MAX_HISTORICAL_TENDERS
      : this.config.batchSize
    const maxPages = isHistorical ? 500 : 50 // Higher cap for historical
    const seen = new Set<string>()
    let pageNum = 1

    while (seen.size < targetCount && pageNum <= maxPages) {
      const pageUrls = await this.extractTenderUrlsFromCurrentPage(page)
      const before = seen.size
      for (const url of pageUrls) {
        seen.add(url)
      }
      const added = seen.size - before
      console.log(
        `[Scraper] Page ${pageNum}: ${added} URLs (total: ${seen.size})`
      )

      // No results on this page (past the last page)
      if (pageUrls.length === 0 && pageNum > 1) {
        console.log('[Scraper] No more results (empty page)')
        break
      }

      if (seen.size >= targetCount && !isHistorical) break

      const hasNext = await this.goToNextListPage(page)
      if (!hasNext) {
        console.log('[Scraper] No more pages')
        break
      }
      pageNum++
      await delay(this.config.delayMs)
    }

    return isHistorical ? [...seen] : [...seen].slice(0, this.config.batchSize)
  }

  /**
   * Extract tender detail URLs from the current list page only
   */
  private async extractTenderUrlsFromCurrentPage(page: Page): Promise<string[]> {
    const selectors = ETIMAD_SELECTORS.listPage.tenderLink.split(', ')

    for (const selector of selectors) {
      try {
        const links = await page.$$eval(selector, (anchors) =>
          anchors
            .map((a) => a.getAttribute('href'))
            .filter((href): href is string => !!href)
        )

        if (links.length > 0) {
          const normalized = [...new Set(links)].map((href) =>
            href.startsWith('http') ? href : `${this.config.baseUrl}${href}`
          )
          return normalized
        }
      } catch {
        // Try next selector
      }
    }

    const pageTitle = await page.title()
    const currentUrl = page.url()
    console.warn('[Scraper] No tender URLs found with configured selectors')
    console.warn(`[Scraper] Page title: ${pageTitle}`)
    console.warn(`[Scraper] Current URL: ${currentUrl}`)
    const pageContent = await page.content()
    const hasTenderList =
      pageContent.includes('tender') || pageContent.includes('منافسة')
    console.warn(
      `[Scraper] Page contains tender-related content: ${hasTenderList}`
    )
    return []
  }

  /**
   * Go to the next list page (click next link or follow next URL). Returns
   * true if navigation happened, false if there is no next page.
   */
  private async goToNextListPage(page: Page): Promise<boolean> {
    const nextSelectors = ETIMAD_SELECTORS.listPage.nextPage.split(', ')

    for (const selector of nextSelectors) {
      try {
        const link = await page.$(selector.trim())
        if (!link) continue

        const href = await link.getAttribute('href')
        const isDisabled =
          (await link.getAttribute('aria-disabled')) === 'true' ||
          (await link.getAttribute('disabled')) != null

        if (isDisabled) return false

        if (href && href !== '#' && !href.startsWith('javascript:')) {
          const nextUrl = href.startsWith('http')
            ? href
            : `${this.config.baseUrl}${href}`
          await this.navigateWithRetry(page, nextUrl)
          return true
        }

        await link.click()
        await page.waitForLoadState('networkidle')
        await delay(1000)
        return true
      } catch {
        // Try next selector
      }
    }

    // Fallback: URL-based pagination (portal uses PageNumber=1, PageNumber=2, ...)
    try {
      const currentUrl = page.url()
      const url = new URL(currentUrl)
      const pageNum = parseInt(url.searchParams.get('PageNumber') || '1', 10)
      url.searchParams.set('PageNumber', String(pageNum + 1))
      await this.navigateWithRetry(page, url.toString())
      await delay(this.config.delayMs)
      return true
    } catch {
      return false
    }
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
   * Re-extract tender data from an already-loaded detail page (for verification).
   * Call after navigating to tender_url.
   */
  async extractTenderDataFromPage(
    page: Page,
    url: string
  ): Promise<Partial<ScrapedTender>> {
    return this.extractTenderData(page, url)
  }

  /**
   * Extract tender data from the detail page (all 5 tabs: Basic Info, Addresses/Dates, Classification, Award, Local Content).
   *
   * VERIFIED: 2026-01-27 via recon script. Uses .list-group.form-details-list with .etd-item-title / .etd-item-info span.
   * Clicks each tab and extracts label/value pairs from each pane.
   */
  private async extractTenderData(
    page: Page,
    url: string
  ): Promise<Partial<ScrapedTender>> {
    const labels = ETIMAD_SELECTORS.arabicLabels
    const selectors = ETIMAD_SELECTORS.detailPage

    // Tab IDs: d-1 (Basic), d-2 (Addresses/Dates), d-3 (Classification), d-5 (Award), d-6 (Local Content)
    const tabIds = ['d-1', 'd-2', 'd-3', 'd-5', 'd-6'] as const
    const tabSlugs: Record<string, string> = {
      'd-1': 'basic_info',
      'd-2': 'addresses_and_dates',
      'd-3': 'classification_and_submission',
      'd-5': 'award_results',
      'd-6': 'local_content',
    }

    // Extract from first tab (d-1 Basic Information)
    const structuredData = await this.extractLabelValueFromPane(page, selectors, null)
    const tabSections: Record<string, Record<string, string>> = {}
    const { _title, _description, ...basicKeyValues } = structuredData
    tabSections[tabSlugs['d-1']] = basicKeyValues as Record<string, string>

    // Click and extract from the other 4 tabs (d-2, d-3, d-5, d-6)
    for (let i = 1; i < tabIds.length; i++) {
      const tabId = tabIds[i]
      const slug = tabSlugs[tabId]

      // Try Bootstrap 4 selector first, then Bootstrap 5
      let link = page.locator(`a[href="#${tabId}"][data-toggle="tab"]`).first()
      let isVisible = await link.isVisible().catch(() => false)

      if (!isVisible) {
        // Try Bootstrap 5 selector
        link = page.locator(`a[href="#${tabId}"][data-bs-toggle="tab"]`).first()
        isVisible = await link.isVisible().catch(() => false)
      }

      if (!isVisible) {
        console.log(`[Scraper] Tab ${tabId} (${slug}) not found, skipping`)
        continue
      }

      try {
        await link.click()
        await page
          .waitForSelector(`.tab-pane#${tabId}.active, .tab-pane#${tabId}.show`, {
            state: 'visible',
            timeout: 5000,
          })
        await delay(600)
        let paneData = await this.extractLabelValueFromPane(page, selectors, tabId)

        // Award tab (d-5) uses tables, not list-group; fallback to table extraction when empty
        if (tabId === 'd-5' && Object.keys(paneData).length === 0) {
          paneData = await this.extractAwardDataFromTables(page)
        }

        if (Object.keys(paneData).length > 0) {
          tabSections[slug] = paneData as Record<string, string>
          console.log(`[Scraper] Tab ${tabId} (${slug}): ${Object.keys(paneData).length} fields`)
        } else {
          console.log(`[Scraper] Tab ${tabId} (${slug}): empty`)
        }
      } catch (err) {
        console.warn(`[Scraper] Tab ${tabId} (${slug}) failed:`, err instanceof Error ? err.message : err)
      }
    }

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

    // Extract values from tab_sections (primary source) with fallbacks
    const basicInfo = tabSections['basic_info'] || {}
    const addressesDates = tabSections['addresses_and_dates'] || {}
    const awardResults = tabSections['award_results'] || {}
    const winningBidderRaw = this.findInStructuredData(awardResults, labels.winningBidder ?? [])
    const awardAmountRaw = this.findInStructuredData(awardResults, labels.awardAmount ?? [])
    const awardDateRaw = this.findInStructuredData(awardResults, labels.awardDate ?? [])

    // Title: prefer "اسم المنافسة" from basic_info
    const titleFromTab = basicInfo['اسم المنافسة']
    const finalTitle =
      sanitizeText(titleFromTab) ||
      sanitizeText(structuredData['_title']) ||
      sanitizeText(pageTitle) ||
      'Untitled Tender'

    // Reference number: prefer "الرقم المرجعي" (official reference) over "رقم المنافسة" (tender number)
    const refFromTab = basicInfo['الرقم المرجعي'] || basicInfo['رقم المنافسة']
    const finalRefNo =
      sanitizeText(refFromTab) ||
      sanitizeText(referenceNoRaw) ||
      this.extractReferenceFromUrl(url) ||
      'UNKNOWN'

    // Deadline: prefer "آخر موعد لتقديم العروض" from addresses_and_dates
    const deadlineFromTab = addressesDates['آخر موعد لتقديم العروض']
    const finalDeadline =
      parseDate(deadlineFromTab) || parseDate(deadlineRaw) || new Date().toISOString()

    // Entity: prefer "الجهة الحكوميه" or "الجهة الحكومية" from basic_info
    const entityFromTab = basicInfo['الجهة الحكوميه'] || basicInfo['الجهة الحكومية']
    const finalEntity = sanitizeText(entityFromTab) || sanitizeText(entityRaw) || 'Unknown Entity'

    // Build tender object (include award fields when present from award_results tab)
    const data: Partial<ScrapedTender> = {
      reference_no: finalRefNo,
      title: finalTitle,
      entity: finalEntity,
      deadline: finalDeadline,
      estimated_value: parseSARAmount(estimatedValueRaw),
      booklet_price: parseSARAmount(bookletPriceRaw),
      initial_guarantee: parsePercentage(initialGuaranteeRaw),
      contract_duration: parseDuration(contractDurationRaw),
      description: sanitizeText(structuredData['_description']) || null,
      tender_url: url,
      source: 'etimad',
      scraped_at: new Date().toISOString(),
      tab_sections: tabSections,
      award_amount_sar: parseSARAmount(awardAmountRaw) ?? null,
      award_date: parseDate(awardDateRaw) ?? sanitizeText(awardDateRaw) ?? null,
      winning_bidder: sanitizeText(winningBidderRaw) ?? null,
    }

    return data
  }

  /**
   * Extract all label/value pairs from a tab pane (or document if paneId is null).
   * Uses .list-group-item with .etd-item-title and .etd-item-info span within the pane.
   */
  private async extractLabelValueFromPane(
    page: Page,
    selectors: typeof ETIMAD_SELECTORS.detailPage,
    paneId: string | null
  ): Promise<Record<string, string>> {
    return page.evaluate(
      (opts: {
        dataList: string
        dataItem: string
        itemLabel: string
        itemValue: string
        purposeFull: string
        purposeTruncated: string
        paneId: string | null
      }) => {
        const scope = opts.paneId
          ? document.querySelector(`.tab-pane#${opts.paneId}`)
          : document
        if (!scope) return {}
        const root = scope as HTMLElement
        const result: Record<string, string> = {}
        const items = root.querySelectorAll(
          `${opts.dataList} ${opts.dataItem}, .list-group-item`
        )
        items.forEach((item) => {
          const labelEl = item.querySelector(opts.itemLabel)
          const valueEl =
            item.querySelector(opts.itemValue) ||
            item.querySelector('.etd-item-info span')
          if (labelEl && valueEl) {
            const label = labelEl.textContent?.trim() || ''
            const value = valueEl.textContent?.trim() || ''
            if (label && value) {
              result[label] = value
            }
          }
        })
        if (!opts.paneId) {
          const h1 = document.querySelector('h1')
          result['_title'] = h1?.textContent?.trim() || ''
          const purposeFull = document.querySelector(opts.purposeFull)
          const purposeTruncated = document.querySelector(opts.purposeTruncated)
          result['_description'] =
            purposeFull?.textContent?.trim() ||
            purposeTruncated?.textContent?.trim() ||
            ''
        }
        return result
      },
      {
        dataList: selectors.dataList,
        dataItem: selectors.dataItem,
        itemLabel: selectors.itemLabel,
        itemValue: selectors.itemValue,
        purposeFull: selectors.purposeFull,
        purposeTruncated: selectors.purposeTruncated,
        paneId,
      }
    )
  }

  /**
   * Extract award data from the award tab (d-5) when it uses tables instead of list-group.
   * Parses the "List of Awarded Suppliers" table (قائمة الموردين المرسى عليهم) for
   * قيمة الترسية (award value) and إسم المورد (supplier name).
   */
  private async extractAwardDataFromTables(page: Page): Promise<Record<string, string>> {
    return page.evaluate(() => {
      const pane = document.querySelector('.tab-pane#d-5')
      if (!pane) return {}
      const tables = Array.from(pane.querySelectorAll('table'))
      const result: Record<string, string> = {}
      let targetTable: HTMLTableElement | null = null
      for (const table of tables) {
        const text = (table as HTMLTableElement).textContent || ''
        if (text.includes('المرسى عليهم') || text.includes('ترسية كاملة')) {
          targetTable = table as HTMLTableElement
          break
        }
      }
      if (!targetTable && tables.length >= 2) targetTable = tables[tables.length - 1] as HTMLTableElement
      if (!targetTable && tables.length === 1) targetTable = tables[0] as HTMLTableElement
      if (!targetTable) return result

      const allRows = Array.from(targetTable.querySelectorAll('tr'))
      if (allRows.length < 2) return result
      const headerRow = allRows[0]
      const headerCells = headerRow.querySelectorAll('th, td')
      const headers = Array.from(headerCells).map((c) => (c.textContent || '').trim())
      const dataRow = allRows[1]
      const cells = dataRow.querySelectorAll('td')
      for (let i = 0; i < headers.length && i < cells.length; i++) {
        const h = headers[i]
        if (h) result[h] = (cells[i].textContent || '').trim()
      }
      return result
    })
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
