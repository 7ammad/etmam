/**
 * Etimad Portal Reconnaissance Script
 *
 * Purpose: Explore the Etimad tender portal to understand its HTML structure,
 * identify CSS selectors, and document findings before building the scraper.
 *
 * Run with: pnpm scrape:recon
 *
 * Output:
 * - Screenshots saved to scratchpad/etimad-recon/
 * - HTML files for analysis
 * - Console logs with selector recommendations
 */

import { chromium, type Page, type Browser } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

// Configuration
const CONFIG = {
  baseUrl: 'https://tenders.etimad.sa',
  listUrl: '/Tender/AllTendersForVisitor', // Arabic-only portal
  outputDir: './scratchpad/etimad-recon',
  headless: process.env.HEADLESS !== 'false', // Default headless, set HEADLESS=false for visual
  slowMo: process.env.HEADLESS === 'false' ? 500 : 100, // Faster in headless mode
  timeout: 30000,
}

// Ensure output directory exists
function ensureOutputDir(): void {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true })
  }
}

// Save content to file
function saveFile(filename: string, content: string): void {
  const filepath = path.join(CONFIG.outputDir, filename)
  fs.writeFileSync(filepath, content, 'utf-8')
  console.log(`  Saved: ${filepath}`)
}

// Main reconnaissance function
async function runReconnaissance(): Promise<void> {
  console.log('=' .repeat(60))
  console.log('ETIMAD PORTAL RECONNAISSANCE')
  console.log('=' .repeat(60))
  console.log(`Target: ${CONFIG.baseUrl}${CONFIG.listUrl}`)
  console.log(`Output: ${CONFIG.outputDir}`)
  console.log('')

  ensureOutputDir()

  let browser: Browser | null = null

  try {
    // Launch browser
    console.log('[1/6] Launching browser...')
    browser = await chromium.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
    })

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'ar-SA', // Arabic locale for Arabic-only portal
      viewport: { width: 1920, height: 1080 },
    })

    const page = await context.newPage()

    // Navigate to tender list
    console.log('\n[2/6] Navigating to tender list...')
    const listUrl = `${CONFIG.baseUrl}${CONFIG.listUrl}`

    try {
      await page.goto(listUrl, {
        waitUntil: 'networkidle',
        timeout: CONFIG.timeout,
      })
      console.log(`  URL loaded: ${page.url()}`)
    } catch (err) {
      console.log(`  Navigation error: ${err instanceof Error ? err.message : 'Unknown error'}`)
      console.log('  Attempting to continue...')
    }

    // Capture list page
    console.log('\n[3/6] Capturing list page...')
    await page.screenshot({
      path: path.join(CONFIG.outputDir, '01-list-page.png'),
      fullPage: true,
    })
    console.log('  Screenshot: 01-list-page.png')

    const listHtml = await page.content()
    saveFile('01-list-page.html', listHtml)

    // Analyze list page structure using verified selectors
    console.log('\n[4/6] Analyzing tender cards...')

    interface ListAnalysis {
      title: string
      url: string
      bodyClasses: string
      totalCards: number
      cards: Array<{
        dataRef: string | null
        title: string | null
        entity: string | null
        publishDate: string | null
        tenderType: string | null
        bookletPrice: string | null
        daysRemaining: string | null
        detailUrl: string | null
      }>
      filterOptions: {
        tenderStatus: string[]
        tenderTypes: string[]
        activities: Array<{ text: string | undefined; value: string | null }>
        activitiesFromJs?: unknown
      }
      pagination: {
        itemsPerPage: string[]
        currentPage: number
      }
    }

    const listAnalysis: ListAnalysis = await page.evaluate(() => {
      const analysis = {
        title: document.title,
        url: window.location.href,
        bodyClasses: document.body.className,
        totalCards: 0,
        cards: [] as Array<{
          dataRef: string | null
          title: string | null
          entity: string | null
          publishDate: string | null
          tenderType: string | null
          bookletPrice: string | null
          daysRemaining: string | null
          detailUrl: string | null
        }>,
        filterOptions: {
          tenderStatus: [] as string[],
          tenderTypes: [] as string[],
          activities: [] as Array<{ text: string | undefined; value: string | null }>,
          activitiesFromJs: undefined as unknown,
        },
        pagination: {
          itemsPerPage: [] as string[],
          currentPage: 1,
        },
      }

      // Extract tender cards using verified selectors
      const cards = document.querySelectorAll('.tender-card, div[data-ref]')
      analysis.totalCards = cards.length

      // Get first 5 cards for analysis
      Array.from(cards).slice(0, 5).forEach(card => {
        const dataRef = card.getAttribute('data-ref')
        const titleLink = card.querySelector('h3 a')
        const entity = card.querySelector('.tender-metadata p.pb-2')
        const publishDateEl = card.querySelector('.tender-metadata .col-6:first-child span')
        const tenderType = card.querySelector('.badge-primary')
        const bookletPrice = card.querySelector('.tender-coast .saudi-riyal-symbol')
        const daysRemaining = card.querySelector('.tender-chart .text-chart-indicator')

        analysis.cards.push({
          dataRef,
          title: titleLink?.textContent?.trim() || null,
          entity: entity?.textContent?.trim() || null,
          publishDate: publishDateEl?.textContent?.trim() || null,
          tenderType: tenderType?.textContent?.trim() || null,
          bookletPrice: bookletPrice?.textContent?.trim() || null,
          daysRemaining: daysRemaining?.textContent?.trim() || null,
          detailUrl: titleLink?.getAttribute('href') || null,
        })
      })

      // Extract filter options
      const statusOptions = document.querySelectorAll('#TenderCategory option')
      analysis.filterOptions.tenderStatus = Array.from(statusOptions)
        .map(opt => opt.textContent?.trim())
        .filter((t): t is string => !!t)

      const typeOptions = document.querySelectorAll('#TenderTypeId option')
      analysis.filterOptions.tenderTypes = Array.from(typeOptions)
        .map(opt => opt.textContent?.trim())
        .filter((t): t is string => !!t)

      // Activities loaded dynamically - check if any are pre-loaded
      const activityOptions = document.querySelectorAll('#activitiesList option')
      analysis.filterOptions.activities = Array.from(activityOptions)
        .map(opt => ({ text: opt.textContent?.trim(), value: opt.getAttribute('value') }))
        .filter(a => a.text && a.value !== '0')

      // Also check if Tender.activitiesList exists in page context
      // @ts-expect-error - checking global var
      if (typeof Tender !== 'undefined' && Tender.activitiesList) {
        // @ts-expect-error - global var
        analysis.filterOptions.activitiesFromJs = Tender.activitiesList
      }

      // Pagination info
      const itemsPerPage = document.querySelectorAll('#itemsPerPage option')
      analysis.pagination.itemsPerPage = Array.from(itemsPerPage)
        .map(opt => opt.textContent?.trim())
        .filter((t): t is string => !!t)

      return analysis
    })

    saveFile('02-list-analysis.json', JSON.stringify(listAnalysis, null, 2))
    console.log('  Analysis saved: 02-list-analysis.json')
    console.log(`  Total tender cards: ${listAnalysis.totalCards}`)
    console.log(`  Sample cards extracted: ${listAnalysis.cards.length}`)
    console.log(`  Tender status options: ${listAnalysis.filterOptions.tenderStatus.length}`)
    console.log(`  Tender type options: ${listAnalysis.filterOptions.tenderTypes.length}`)
    console.log(`  Activity options: ${listAnalysis.filterOptions.activities.length}`)

    // Fetch main activities via API
    console.log('\n[4.5/6] Fetching activity categories via API...')
    try {
      const activitiesResponse = await page.evaluate(async () => {
        const response = await fetch('/Tender/GetMainActivitiesAsync')
        return response.json()
      })
      saveFile('05-activities.json', JSON.stringify(activitiesResponse, null, 2))
      console.log(`  Fetched ${Array.isArray(activitiesResponse) ? activitiesResponse.length : 0} main activities`)
      console.log('  Saved: 05-activities.json')

      // Fetch sub-activities for IT/Telecom (ID 9) - key category for Etmam
      const subActivitiesResponse = await page.evaluate(async () => {
        const response = await fetch('/Tender/GetSubActivitiesAsync?mainAcivityId=9')
        return response.json()
      })
      saveFile('06-it-subactivities.json', JSON.stringify(subActivitiesResponse, null, 2))
      console.log(`  Fetched ${Array.isArray(subActivitiesResponse) ? subActivitiesResponse.length : 0} IT/Telecom sub-activities`)
      console.log('  Saved: 06-it-subactivities.json')
    } catch (err) {
      console.log(`  Failed to fetch activities: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }

    // Navigate to tender detail page
    console.log('\n[5/6] Looking for tender detail page...')

    // Use verified selector: .tender-card h3 a
    const detailSelectors = [
      '.tender-card h3 a',
      'a[href*="DetailsForVisitor"]',
    ]

    let detailUrl: string | null = null

    for (const selector of detailSelectors) {
      try {
        const link = await page.locator(selector).first()
        if (await link.count() > 0) {
          const href = await link.getAttribute('href')
          if (href) {
            console.log(`  Found link with selector: ${selector}`)
            console.log(`  Link href: ${href}`)

            // Click and navigate
            await link.click()
            await page.waitForLoadState('networkidle', { timeout: CONFIG.timeout })
            detailUrl = page.url()
            console.log(`  Navigated to: ${detailUrl}`)
            break
          }
        }
      } catch {
        // Try next selector
      }
    }

    if (detailUrl) {
      // Capture detail page
      console.log('\n[6/6] Capturing detail page...')
      await page.screenshot({
        path: path.join(CONFIG.outputDir, '03-detail-page.png'),
        fullPage: true,
      })
      console.log('  Screenshot: 03-detail-page.png')

      const detailHtml = await page.content()
      saveFile('03-detail-page.html', detailHtml)

      // Analyze detail page using verified selectors
      const detailAnalysis = await page.evaluate(function() {
        var analysis = {
          url: window.location.href,
          title: document.title,
          fields: [] as Array<{ label: string; value: string }>,
          tabs: [] as string[],
        }

        // Extract data using verified selectors: .etd-item-title and .etd-item-info span
        var items = document.querySelectorAll('.list-group-item')
        for (var i = 0; i < items.length; i++) {
          var item = items[i]
          var labelEl = item.querySelector('.etd-item-title')
          var valueEl = item.querySelector('.etd-item-info span')
          if (labelEl && valueEl) {
            analysis.fields.push({
              label: (labelEl.textContent || '').trim(),
              value: (valueEl.textContent || '').trim(),
            })
          }
        }

        // Extract tab names for navigation
        var tabs = document.querySelectorAll('.nav-link')
        for (var j = 0; j < tabs.length; j++) {
          var tabText = (tabs[j].textContent || '').trim()
          if (tabText) {
            analysis.tabs.push(tabText)
          }
        }

        return analysis
      })

      saveFile('04-detail-analysis.json', JSON.stringify(detailAnalysis, null, 2))
      console.log('  Analysis saved: 04-detail-analysis.json')

      // Print extracted fields
      console.log(`\n  Extracted ${(detailAnalysis.fields as unknown[]).length} fields:`)
      const fields = detailAnalysis.fields as Array<{ label: string; value: string }>
      for (const field of fields.slice(0, 10)) {
        console.log(`    ${field.label}: ${field.value.slice(0, 50)}`)
      }
      if (fields.length > 10) {
        console.log(`    ... and ${fields.length - 10} more fields`)
      }
    } else {
      console.log('  Could not find or navigate to tender detail page')
      console.log('  Manual inspection may be required')
    }

    // Summary
    console.log('\n' + '=' .repeat(60))
    console.log('RECONNAISSANCE COMPLETE')
    console.log('=' .repeat(60))
    console.log(`\nOutput files saved to: ${CONFIG.outputDir}`)
    console.log('\nNext steps:')
    console.log('1. Review screenshots to understand page layout')
    console.log('2. Inspect HTML files to identify CSS selectors')
    console.log('3. Check JSON analysis files for Arabic label patterns')
    console.log('4. Update lib/scraper/config.ts with verified selectors')

    // Keep browser open for manual inspection if not headless
    if (!CONFIG.headless) {
      console.log('\nBrowser window left open for manual inspection.')
      console.log('Press Ctrl+C to close.')
      await new Promise(() => {}) // Keep running
    }

  } catch (err) {
    console.error('\nReconnaissance failed:', err)
    throw err
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Run
runReconnaissance().catch(console.error)
