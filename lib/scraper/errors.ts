/**
 * Scraper Error Classes
 *
 * Custom error types for categorizing and handling scraper failures.
 */

import type { ErrorCode } from './config'
import { ERROR_CODES } from './config'

/**
 * Base error class for scraper errors
 */
export class ScraperError extends Error {
  /** Error code for categorization */
  readonly code: ErrorCode
  /** Whether the error is potentially recoverable with retry */
  readonly recoverable: boolean
  /** URL where the error occurred */
  readonly url?: string
  /** Tender reference if known */
  readonly referenceNo?: string

  constructor(
    message: string,
    code: ErrorCode,
    options?: {
      recoverable?: boolean
      url?: string
      referenceNo?: string
      cause?: Error
    }
  ) {
    super(message, { cause: options?.cause })
    this.name = 'ScraperError'
    this.code = code
    this.recoverable = options?.recoverable ?? true
    this.url = options?.url
    this.referenceNo = options?.referenceNo
  }

  /**
   * Convert to a plain object for serialization
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      recoverable: this.recoverable,
      url: this.url,
      referenceNo: this.referenceNo,
      timestamp: new Date().toISOString(),
    }
  }
}

/**
 * Error when page navigation fails
 */
export class NavigationError extends ScraperError {
  constructor(url: string, cause?: Error) {
    super(`Failed to navigate to ${url}`, ERROR_CODES.NAVIGATION_FAILED, {
      recoverable: true,
      url,
      cause,
    })
    this.name = 'NavigationError'
  }
}

/**
 * Error when a required selector is not found
 */
export class SelectorNotFoundError extends ScraperError {
  readonly selector: string

  constructor(selector: string, url?: string) {
    super(
      `Required selector not found: ${selector}`,
      ERROR_CODES.SELECTOR_NOT_FOUND,
      {
        recoverable: false, // Selector issues won't fix with retry
        url,
      }
    )
    this.name = 'SelectorNotFoundError'
    this.selector = selector
  }
}

/**
 * Error when rate limiting is detected
 */
export class RateLimitError extends ScraperError {
  readonly retryAfter?: number

  constructor(url?: string, retryAfter?: number) {
    super(
      retryAfter
        ? `Rate limited. Retry after ${retryAfter} seconds`
        : 'Rate limited by server',
      ERROR_CODES.RATE_LIMITED,
      {
        recoverable: true,
        url,
      }
    )
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
  }
}

/**
 * Error when access is blocked (CAPTCHA, IP block, etc.)
 */
export class BlockedError extends ScraperError {
  readonly reason?: string

  constructor(reason?: string, url?: string) {
    super(
      reason ? `Access blocked: ${reason}` : 'Access blocked by server',
      ERROR_CODES.BLOCKED,
      {
        recoverable: false, // Blocking usually requires manual intervention
        url,
      }
    )
    this.name = 'BlockedError'
    this.reason = reason
  }
}

/**
 * Error when page load times out
 */
export class TimeoutError extends ScraperError {
  readonly timeoutMs: number

  constructor(url: string, timeoutMs: number) {
    super(
      `Page load timed out after ${timeoutMs}ms: ${url}`,
      ERROR_CODES.TIMEOUT,
      {
        recoverable: true,
        url,
      }
    )
    this.name = 'TimeoutError'
    this.timeoutMs = timeoutMs
  }
}

/**
 * Error when parsing page content fails
 */
export class ParseError extends ScraperError {
  readonly field?: string

  constructor(message: string, url?: string, field?: string) {
    super(message, ERROR_CODES.PARSE_ERROR, {
      recoverable: false,
      url,
    })
    this.name = 'ParseError'
    this.field = field
  }
}

/**
 * Error when Zod validation fails
 */
export class ValidationError extends ScraperError {
  readonly validationErrors: Array<{ path: string; message: string }>

  constructor(
    errors: Array<{ path: string; message: string }>,
    referenceNo?: string
  ) {
    const message = `Validation failed: ${errors.map((e) => e.message).join(', ')}`
    super(message, ERROR_CODES.VALIDATION_ERROR, {
      recoverable: false,
      referenceNo,
    })
    this.name = 'ValidationError'
    this.validationErrors = errors
  }
}

/**
 * Error for network-level failures
 */
export class NetworkError extends ScraperError {
  constructor(message: string, url?: string, cause?: Error) {
    super(message, ERROR_CODES.NETWORK_ERROR, {
      recoverable: true,
      url,
      cause,
    })
    this.name = 'NetworkError'
  }
}

/**
 * Check if an error is a ScraperError
 */
export function isScraperError(error: unknown): error is ScraperError {
  return error instanceof ScraperError
}

/**
 * Wrap any error as a ScraperError
 */
export function wrapError(
  error: unknown,
  defaultCode: ErrorCode = ERROR_CODES.NETWORK_ERROR,
  url?: string
): ScraperError {
  if (isScraperError(error)) {
    return error
  }

  const message = error instanceof Error ? error.message : String(error)
  const cause = error instanceof Error ? error : undefined

  return new ScraperError(message, defaultCode, {
    recoverable: true,
    url,
    cause,
  })
}
