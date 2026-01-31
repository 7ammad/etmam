/**
 * Scraper Configuration
 *
 * Default configuration and CSS selectors for the Etimad scraper.
 *
 * IMPORTANT: Selectors are PLACEHOLDERS until verified by reconnaissance.
 * Run `pnpm scrape:recon` and update selectors based on findings.
 */

import type { ScraperConfig, EtimadSelectors } from '@/types/scraper'

/**
 * Default scraper configuration
 */
export const DEFAULT_CONFIG: ScraperConfig = {
  baseUrl: 'https://tenders.etimad.sa',
  batchSize: 120, // Default: collect up to 120 tenders (6 per page → ~20 pages)
  delayMs: 2000, // 2 second delay between requests (be polite)
  maxRetries: 3,
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  headless: true,
  timeout: 30000, // 30 seconds
}

/**
 * Etimad portal URLs
 *
 * NOTE: The Etimad tenders portal is Arabic-only (no English version available).
 */
export const ETIMAD_URLS = {
  /** Tender list page (Arabic only) */
  tenderList: '/Tender/AllTendersForVisitor',
  /** API endpoints */
  api: {
    mainActivities: '/Tender/GetMainActivitiesAsync',
    subActivities: '/Tender/GetSubActivitiesAsync',
  },
} as const

/**
 * Activity ID constants for type safety
 *
 * Use these constants instead of magic strings for activity IDs.
 * Only Telecom & IT activities are included (Etmam's target sectors).
 */
export const ACTIVITY_IDS = {
  TELECOM_IT: '9',
} as const

/**
 * Sub-activity ID constants
 * 
 * Only IT and Telecom sub-activities (includes AI, Robotics, and related tech).
 */
export const SUB_ACTIVITY_IDS = {
  TELECOM: '901',
  IT: '902', // Includes AI, Robotics, and all IT-related technologies
} as const

/**
 * Activity/Category filter IDs for Etmam's target sectors
 *
 * VERIFIED: 2026-01-27 via API
 * Use these IDs to filter tenders by category.
 *
 * Filter URL format:
 * /Tender/AllTendersForVisitor?TenderActivityId=9&TenderSubActivityId=902
 * 
 * NOTE: Only Telecom & IT activities are included. This includes:
 * - Telecommunications (الإتصالات)
 * - Information Technology (تقنية المعلومات) - includes AI, Robotics, Software, Hardware, etc.
 */
export const ETMAM_ACTIVITY_FILTERS = {
  /** Main activity: Telecom & IT (الاتصالات وتقنية المعلومات) */
  telecomIT: {
    mainActivityId: ACTIVITY_IDS.TELECOM_IT,
    nameAr: 'الاتصالات وتقنية المعلومات',
    nameEn: 'Telecom & Information Technology',
    subActivities: {
      /** Telecommunications (الإتصالات) */
      telecom: { id: SUB_ACTIVITY_IDS.TELECOM, nameAr: 'الإتصالات', nameEn: 'Telecommunications' },
      /** Information Technology (تقنية المعلومات) - includes AI, Robotics, Software, Hardware */
      it: { id: SUB_ACTIVITY_IDS.IT, nameAr: 'تقنية المعلومات', nameEn: 'Information Technology (AI, Robotics, Software, Hardware)' },
    },
  },
} as const

/**
 * Tender status filter options
 *
 * Use in #TenderCategory dropdown.
 * VERIFIED from portal HTML: "المنافسات النشطة (تقديم العروض)" = value "2".
 * Awarded: "تم اعلان الترسية" = value "6" (historical tenders).
 */
export const TENDER_STATUS_FILTERS = {
  all: '', // No filter (الكل)
  active: '2', // المنافسات النشطة (تقديم العروض) - open for bids
  ended: '8', // المنافسات المنتهية (الكل)
  awarded: '6', // تم اعلان الترسية - award announced (historical)
} as const

/**
 * Tender type filter options
 *
 * Use in #TenderTypeId dropdown
 */
export const TENDER_TYPE_FILTERS = {
  publicTender: '1', // منافسة عامة
  directPurchase: '2', // شراء مباشر
  limitedTender: '4', // منافسة محدودة
  reverseAuction: '5', // المزايدة العكسية الالكترونية
} as const

/**
 * CSS Selectors for Etimad portal
 *
 * ============================================================
 * VERIFIED: 2026-01-27 via recon script
 * ============================================================
 *
 * Portal uses card-based layout (not tables).
 * Each tender is a `.tender-card` with `data-ref` attribute.
 */
export const ETIMAD_SELECTORS: EtimadSelectors = {
  listPage: {
    /** Main cards container */
    tenderList: '#cardsresult',
    /** Individual tender card - has data-ref="TENDER_ID" attribute */
    tenderItem: '.tender-card, div[data-ref]',
    /** Link to tender detail page */
    tenderLink: '.tender-card h3 a, a[href*="DetailsForVisitor"]',
    /** Tender title text */
    tenderTitle: '.tender-card h3 a',
    /** Reference number (from data-ref attribute on .tender-card) */
    referenceNo: '.tender-card[data-ref]',
    /** Issuing entity/agency */
    entity: '.tender-metadata p.pb-2',
    /** Deadline info - days remaining shown in chart */
    deadline: '.tender-chart .text-chart-indicator',
    /** Pagination controls */
    pagination: '.pagination, nav[aria-label*="pagination"]',
    /** Next page button */
    nextPage: '.pagination .page-link[rel="next"], .pagination-next',
    /** Tender status filter dropdown (in filter panel) */
    filterActive: '#TenderCategory',
    /** Filter panel toggle - top-left "بحث" button; opens #Search collapse */
    filterToggle: '#searchBtnColaps',
    /** Filter panel collapse target */
    filterPanel: '#Search',
    /** Basic info section inside filter panel (TenderCategory, region, main/sub activity) */
    filterBasicInfo: '#basicInfo',
    /** Main activity dropdown (Telecom & IT = 9) */
    mainActivitySelect: '#activitiesList',
    /** Sub-activity dropdown (IT = 902; loads after main activity) */
    subActivitySelect: '#subActivitiesList',
    /** Search submit button inside filter panel */
    filterSearchButton: '#searchBtn',
    /** Items per page selector */
    itemsPerPage: '#itemsPerPage',
    /** Tender type badge (منافسة عامة, شراء مباشر, etc.) */
    tenderType: '.tender-card .badge-primary',
    /** Booklet price on card */
    bookletPrice: '.tender-coast .saudi-riyal-symbol',
    /** Publish date on card */
    publishDate: '.tender-metadata .col-6:first-child span',
  },
  detailPage: {
    /** Main content area - tab based navigation */
    content: '.tab-content, .form-details-list',
    /** Data list container */
    dataList: '.list-group.form-details-list',
    /** Individual data item */
    dataItem: '.list-group-item',
    /** Item label */
    itemLabel: '.etd-item-title',
    /** Item value */
    itemValue: '.etd-item-info span',
    /** Purpose/description (truncated and full versions) */
    purposeTruncated: '#subPurposSapn',
    purposeFull: '#purposeSpan',
    /** Tab list (nav pills) */
    tabList: 'ul.nav.nav-pills.nav-pills-icons[role="tablist"]',
    /** Tab link (each tab) - use a[href^="#d-"] to get all panes */
    tabLink: 'a[href^="#d-"][data-toggle="tab"]',
    /** Tab pane container */
    tabPane: '.tab-pane[id^="d-"]',
  },
  arabicLabels: {
    bookletPrice: ['قيمة وثائق المنافسة', 'قيمة الوثائق', 'رسوم الوثائق'],
    initialGuarantee: ['الضمان الابتدائي', 'الضمان الأولي', 'ضمان ابتدائي'],
    contractDuration: ['مدة العقد', 'مدة التنفيذ', 'فترة العقد'],
    referenceNo: ['رقم المنافسة', 'الرقم المرجعي'],
    entity: ['الجهة الحكومية', 'الجهة', 'جهة الطرح'],
    deadline: ['الموعد النهائي', 'موعد التقديم', 'آخر موعد'],
    estimatedValue: ['القيمة التقديرية', 'القيمة المقدرة', 'الميزانية التقديرية'],
    /** Award results tab (historical tenders): winning bidder, award amount, award date */
    winningBidder: ['إسم المورد', 'المورد الفائز', 'المنفذ الفائز'],
    awardAmount: ['قيمة الترسية', 'قيمة العقد'],
    awardDate: ['تاريخ الترسية', 'تاريخ الإعلان'],
  },
}

/**
 * Error codes for categorizing scraper failures
 */
export const ERROR_CODES = {
  NAVIGATION_FAILED: 'NAVIGATION_FAILED',
  SELECTOR_NOT_FOUND: 'SELECTOR_NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  BLOCKED: 'BLOCKED',
  TIMEOUT: 'TIMEOUT',
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

/**
 * Blocked/rate-limited detection patterns
 */
export const BLOCK_INDICATORS = [
  'Access Denied',
  'Blocked',
  'captcha',
  'rate limit',
  'too many requests',
  '403 Forbidden',
  '429 Too Many',
  'Please verify',
] as const
