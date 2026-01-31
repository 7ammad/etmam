/**
 * Scraper Utility Functions
 *
 * Helper functions for retry logic, rate limiting, and data parsing.
 */

import type { Page } from '@playwright/test'
import { BLOCK_INDICATORS } from './config'

/**
 * Retry options for resilient operations
 */
export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number
  /** Initial delay between retries in milliseconds */
  delayMs: number
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number
  /** Maximum delay cap in milliseconds (default: 30000) */
  maxDelay?: number
  /** Callback for retry logging */
  onRetry?: (attempt: number, error: Error, nextDelay: number) => void
}

/**
 * Execute a function with retry logic and exponential backoff
 *
 * @param fn - Async function to execute
 * @param options - Retry configuration
 * @returns Result of the function
 * @throws Last error if all retries fail
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxRetries,
    delayMs,
    backoffMultiplier = 2,
    maxDelay = 30000,
    onRetry,
  } = options

  let lastError: Error | null = null
  let currentDelay = delayMs

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      if (attempt < maxRetries) {
        onRetry?.(attempt, lastError, currentDelay)
        await delay(currentDelay)
        currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay)
      }
    }
  }

  throw lastError
}

/**
 * Promise-based delay
 *
 * @param ms - Milliseconds to wait
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if a page shows signs of being blocked or rate-limited
 *
 * @param page - Playwright page instance
 * @returns True if blocking indicators are detected
 */
export async function checkForBlock(page: Page): Promise<boolean> {
  try {
    const content = await page.content()
    const contentLower = content.toLowerCase()

    return BLOCK_INDICATORS.some((indicator) =>
      contentLower.includes(indicator.toLowerCase())
    )
  } catch {
    // If we can't get content, assume not blocked
    return false
  }
}

/**
 * Parse a SAR (Saudi Riyal) amount from text
 *
 * Handles formats like:
 * - "500 SAR"
 * - "500.00"
 * - "1,500.00 ريال"
 * - "SAR 1500"
 *
 * @param text - Text containing amount
 * @returns Parsed number or null
 */
export function parseSARAmount(text: string | null | undefined): number | null {
  if (!text) return null

  // Remove currency symbols and text
  const cleaned = text
    .replace(/[ريال|SAR|R\.S\.?|SR\.?]/gi, '')
    .replace(/,/g, '') // Remove thousand separators
    .trim()

  // Extract number
  const match = cleaned.match(/[\d.]+/)
  if (!match) return null

  const num = parseFloat(match[0])
  return isNaN(num) ? null : num
}

/**
 * Parse a percentage from text
 *
 * Handles formats like:
 * - "5%"
 * - "5.00 %"
 * - "5 percent"
 *
 * @param text - Text containing percentage
 * @returns Parsed number (as decimal, e.g., 5% -> 5) or null
 */
export function parsePercentage(text: string | null | undefined): number | null {
  if (!text) return null

  const cleaned = text.replace(/%|percent|في المائة/gi, '').trim()
  const match = cleaned.match(/[\d.]+/)
  if (!match) return null

  const num = parseFloat(match[0])
  return isNaN(num) ? null : num
}

/**
 * Parse a duration string
 *
 * Handles formats like:
 * - "12 months"
 * - "١٢ شهر"
 * - "1 year"
 * - "365 days"
 *
 * @param text - Text containing duration
 * @returns Normalized duration string or null
 */
export function parseDuration(text: string | null | undefined): string | null {
  if (!text) return null

  const cleaned = text.trim()
  if (!cleaned) return null

  // Return as-is for now, normalization can be added later
  return cleaned
}

/**
 * Parse a date string from Arabic or English format
 *
 * @param text - Text containing date
 * @returns ISO date string or null (never returns original text)
 */
export function parseDate(text: string | null | undefined): string | null {
  if (!text) return null

  const cleaned = text.trim()
  if (!cleaned) return null

  // Try to parse as Date
  const date = new Date(cleaned)
  if (!isNaN(date.getTime())) {
    return date.toISOString()
  }

  // Try common Arabic date patterns (if needed in future)
  // For now, return null if can't parse (don't return original text)
  // This ensures consistent return type: ISO string or null
  return null
}

/**
 * Extract text content from a page element using multiple selector strategies
 *
 * @param page - Playwright page instance
 * @param selectors - Array of CSS selectors to try
 * @returns Text content or null
 */
export async function extractText(
  page: Page,
  selectors: string[]
): Promise<string | null> {
  for (const selector of selectors) {
    try {
      const element = page.locator(selector).first()
      if ((await element.count()) > 0) {
        const text = await element.textContent()
        if (text?.trim()) {
          return text.trim()
        }
      }
    } catch {
      // Try next selector
    }
  }
  return null
}

/**
 * Find a value by looking for an Arabic label in the page content
 *
 * @param page - Playwright page instance
 * @param labels - Array of Arabic labels to search for
 * @returns Found value or null
 */
export async function findValueByArabicLabel(
  page: Page,
  labels: string[]
): Promise<string | null> {
  return page.evaluate((searchLabels: string[]) => {
    for (const label of searchLabels) {
      // Strategy 1: Look for definition lists (dt/dd)
      const dts = document.querySelectorAll('dt')
      for (const dt of dts) {
        if (dt.textContent?.includes(label)) {
          const dd = dt.nextElementSibling
          if (dd?.tagName === 'DD' && dd.textContent) {
            return dd.textContent.trim()
          }
        }
      }

      // Strategy 2: Look for table rows
      const rows = document.querySelectorAll('tr')
      for (const row of rows) {
        const cells = row.querySelectorAll('td, th')
        for (let i = 0; i < cells.length - 1; i++) {
          if (cells[i].textContent?.includes(label)) {
            const value = cells[i + 1].textContent
            if (value) return value.trim()
          }
        }
      }

      // Strategy 3: Look for label/value pairs in divs
      const elements = document.querySelectorAll('*')
      for (const el of elements) {
        if (el.textContent?.trim() === label || el.textContent?.includes(label)) {
          // Check next sibling
          const next = el.nextElementSibling
          if (next && next.textContent && !next.textContent.includes(label)) {
            return next.textContent.trim()
          }
          // Check parent's next child
          const parent = el.parentElement
          if (parent) {
            const idx = Array.from(parent.children).indexOf(el)
            const nextChild = parent.children[idx + 1]
            if (nextChild && nextChild.textContent) {
              return nextChild.textContent.trim()
            }
          }
        }
      }
    }
    return null
  }, labels)
}

/**
 * Generate a unique identifier for a tender based on reference number
 *
 * @param referenceNo - Tender reference number
 * @returns Consistent identifier
 */
export function generateTenderId(referenceNo: string): string {
  return `etimad-${referenceNo.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`
}

/**
 * Sanitize text content by removing excessive whitespace
 *
 * @param text - Input text
 * @returns Cleaned text
 */
export function sanitizeText(text: string | null | undefined): string | null {
  if (!text) return null

  return text
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\n+/g, '\n') // Collapse newlines
    .trim()
}
