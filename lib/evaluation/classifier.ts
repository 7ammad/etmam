/**
 * Tender Classification Module
 *
 * Classifies tenders by:
 * - Service Type (software, procurement, maintenance, etc.)
 * - Tender Type (direct purchase, public tender, limited tender)
 * - Entity Category (ministry, authority, healthcare, education)
 * - Complexity Level (based on submission method, guarantees, insurance)
 *
 * Historical calibration: reads from in-memory cache (populated from system_settings),
 * then data/calibration-result.json (or historical_calibration_path), else built-in constants.
 */

import * as fs from 'fs'
import * as path from 'path'
import type { ScrapedTender } from '@/types/scraper'
import {
  BLOCKLIST_KEYWORDS,
  INFRATECH_KEYWORDS,
  EXOTECH_KEYWORDS,
  STRATEGIC_ENTITIES,
} from './constants'
import { getCachedCalibration } from './calibration-cache'

// ============================================================================
// TYPES
// ============================================================================

export type ServiceType =
  | 'software_dev'
  | 'cybersecurity'
  | 'integration'
  | 'it_hardware'
  | 'license_renewal'
  | 'managed_services'
  | 'procurement'
  | 'maintenance'
  | 'consulting'
  | 'training'
  | 'construction'
  | 'cleaning'
  | 'vehicles'
  | 'printing'
  | 'other'

export type TenderType =
  | 'direct_purchase'    // شراء مباشر - max 500K SAR
  | 'public_tender'      // منافسة عامة
  | 'limited_tender'     // منافسة محدودة
  | 'framework_agreement'// اتفاقية إطارية
  | 'unknown'

export type EntityCategory =
  | 'ministry'
  | 'royal_authority'
  | 'authority'
  | 'municipality'
  | 'education'
  | 'healthcare'
  | 'military'
  | 'other'

export type ComplexityLevel = 'low' | 'medium' | 'high' | 'very_high'

export interface TenderClassification {
  serviceType: ServiceType
  serviceTypeLabel: string
  serviceTypeConfidence: number

  tenderType: TenderType
  tenderTypeLabel: string
  maxLegalValue: number | null  // Legal cap (e.g., 500K for direct purchase)

  entityCategory: EntityCategory
  entityCategoryLabel: string

  complexity: ComplexityLevel
  complexityScore: number  // 0-100

  // Company fit score (0-100) - how well this matches company capabilities
  companyFitScore: number
  companyFitCategory: 'core' | 'adjacent' | 'avoid' | 'unknown'
}

// ============================================================================
// COMPANY SERVICES CONFIG (Etmam = IT/Telecom company)
// ============================================================================

export interface ServicePattern {
  pattern: string
  fit: number  // 0-100
  label: ServiceType
  labelAr: string
}

export const COMPANY_SERVICES = {
  core: [
    { pattern: 'تطوير|برمجة|منصة|نظام|تطبيق|software|platform|application', fit: 100, label: 'software_dev' as ServiceType, labelAr: 'تطوير برمجيات' },
    { pattern: 'أمن سيبراني|حماية|أمن معلومات|اختراق|cybersecurity', fit: 100, label: 'cybersecurity' as ServiceType, labelAr: 'أمن سيبراني' },
    { pattern: 'تكامل|ربط|API|integration|واجهات', fit: 95, label: 'integration' as ServiceType, labelAr: 'تكامل الأنظمة' },
  ],
  adjacent: [
    { pattern: 'توريد.*أجهزة|معدات.*تقنية|حاسب|خوادم|servers|hardware', fit: 70, label: 'it_hardware' as ServiceType, labelAr: 'أجهزة تقنية' },
    { pattern: 'تجديد.*رخص|اشتراك|تراخيص|licenses|subscription', fit: 60, label: 'license_renewal' as ServiceType, labelAr: 'تجديد رخص' },
    { pattern: 'تشغيل.*صيانة|دعم فني|support|managed', fit: 50, label: 'managed_services' as ServiceType, labelAr: 'خدمات مدارة' },
    { pattern: 'استشارات.*تقنية|consulting|دراسة.*تقنية', fit: 65, label: 'consulting' as ServiceType, labelAr: 'استشارات' },
    { pattern: 'تدريب.*تقني|training|ورش.*تقنية', fit: 55, label: 'training' as ServiceType, labelAr: 'تدريب' },
  ],
  avoid: [
    { pattern: 'نظافة|تنظيف|cleaning', fit: 0, label: 'cleaning' as ServiceType, labelAr: 'نظافة' },
    { pattern: 'مركبات|سيارات|vehicles|نقل', fit: 0, label: 'vehicles' as ServiceType, labelAr: 'مركبات' },
    { pattern: 'طباعة|أحبار|printing|مطبوعات', fit: 10, label: 'printing' as ServiceType, labelAr: 'طباعة' },
    { pattern: 'بناء|إنشاء|مقاولات|construction', fit: 5, label: 'construction' as ServiceType, labelAr: 'إنشاءات' },
    { pattern: 'أثاث|furniture|مفروشات', fit: 5, label: 'other' as ServiceType, labelAr: 'أثاث' },
  ],
}

// ============================================================================
// SERVICE TYPE PATTERNS
// ============================================================================

const SERVICE_TYPE_PATTERNS: Array<{ pattern: RegExp; type: ServiceType; label: string }> = [
  // Software Development
  { pattern: /تطوير|برمجة|منصة|نظام|تطبيق|software|application|platform/i, type: 'software_dev', label: 'تطوير برمجيات' },
  // Cybersecurity
  { pattern: /أمن سيبراني|حماية|أمن معلومات|اختراق|cybersecurity|security/i, type: 'cybersecurity', label: 'أمن سيبراني' },
  // Integration
  { pattern: /تكامل|ربط|API|integration|واجهات/i, type: 'integration', label: 'تكامل الأنظمة' },
  // IT Hardware
  { pattern: /توريد.*أجهزة|معدات.*تقنية|حاسب|خوادم|servers|hardware/i, type: 'it_hardware', label: 'أجهزة تقنية' },
  // License Renewal
  { pattern: /تجديد.*رخص|اشتراك|تراخيص|licenses|subscription|renewal/i, type: 'license_renewal', label: 'تجديد رخص' },
  // Managed Services
  { pattern: /تشغيل.*صيانة|دعم فني|support|managed|operation/i, type: 'managed_services', label: 'خدمات مدارة' },
  // General Procurement
  { pattern: /توريد|شراء|تجهيز|procurement|supply/i, type: 'procurement', label: 'توريد' },
  // Maintenance
  { pattern: /صيانة|maintenance/i, type: 'maintenance', label: 'صيانة' },
  // Consulting
  { pattern: /استشارات|دراسة|تقييم|consulting|study/i, type: 'consulting', label: 'استشارات' },
  // Training
  { pattern: /تدريب|تأهيل|ورش|training|workshop/i, type: 'training', label: 'تدريب' },
  // Construction
  { pattern: /بناء|إنشاء|تأهيل|ترميم|construction/i, type: 'construction', label: 'إنشاءات' },
  // Cleaning
  { pattern: /نظافة|تنظيف|cleaning/i, type: 'cleaning', label: 'نظافة' },
  // Vehicles
  { pattern: /مركبات|سيارات|vehicles/i, type: 'vehicles', label: 'مركبات' },
  // Printing
  { pattern: /طباعة|أحبار|printing/i, type: 'printing', label: 'طباعة' },
]

// ============================================================================
// TENDER TYPE PATTERNS
// ============================================================================

const TENDER_TYPE_PATTERNS: Array<{ pattern: RegExp; type: TenderType; label: string; maxValue: number | null }> = [
  { pattern: /شراء مباشر|direct.?purchase/i, type: 'direct_purchase', label: 'شراء مباشر', maxValue: 500000 },
  { pattern: /منافسة عامة|public.?tender/i, type: 'public_tender', label: 'منافسة عامة', maxValue: null },
  { pattern: /منافسة محدودة|limited.?tender/i, type: 'limited_tender', label: 'منافسة محدودة', maxValue: null },
  { pattern: /اتفاقية إطارية|framework/i, type: 'framework_agreement', label: 'اتفاقية إطارية', maxValue: null },
]

// ============================================================================
// ENTITY CATEGORY PATTERNS
// ============================================================================

const ENTITY_CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: EntityCategory; label: string }> = [
  { pattern: /الديوان الملكي|royal/i, category: 'royal_authority', label: 'الديوان الملكي' },
  { pattern: /وزارة|ministry/i, category: 'ministry', label: 'وزارة' },
  { pattern: /هيئة ملكية/i, category: 'royal_authority', label: 'هيئة ملكية' },
  { pattern: /هيئة|authority|commission/i, category: 'authority', label: 'هيئة' },
  { pattern: /أمانة|municipality/i, category: 'municipality', label: 'أمانة' },
  { pattern: /جامعة|كلية|تعليم|university|college|education/i, category: 'education', label: 'تعليم' },
  { pattern: /مستشفى|صحة|طبي|hospital|health|medical/i, category: 'healthcare', label: 'صحة' },
  { pattern: /عسكري|دفاع|أمن|military|defense/i, category: 'military', label: 'عسكري' },
]

// ============================================================================
// HISTORICAL CALIBRATION DATA (from 94 historical tenders)
// ============================================================================

export interface HistoricalCalibration {
  serviceType: ServiceType
  count: number
  median: number
  p25: number  // 25th percentile
  p75: number  // 75th percentile
  min: number
  max: number
}

export const HISTORICAL_CALIBRATION: HistoricalCalibration[] = [
  // Software (تطوير/برمجة/نظام) - 31 tenders
  { serviceType: 'software_dev', count: 31, median: 41800000, p25: 6900000, p75: 145000000, min: 500000, max: 500000000 },
  // Procurement (توريد/شراء) - 21 tenders
  { serviceType: 'procurement', count: 21, median: 4600000, p25: 1600000, p75: 9000000, min: 100000, max: 50000000 },
  // Maintenance (صيانة/تشغيل) - 11 tenders
  { serviceType: 'maintenance', count: 11, median: 199900000, p25: 6300000, p75: 289000000, min: 500000, max: 500000000 },
  // Cybersecurity (أمن سيبراني) - 4 tenders
  { serviceType: 'cybersecurity', count: 4, median: 265900000, p25: 9600000, p75: 266000000, min: 5000000, max: 500000000 },
  // Consulting (استشارات) - 2 tenders
  { serviceType: 'consulting', count: 2, median: 9200000, p25: 5000000, p75: 15000000, min: 2000000, max: 20000000 },
  // Training (تدريب) - 2 tenders
  { serviceType: 'training', count: 2, median: 8000000, p25: 3000000, p75: 12000000, min: 1000000, max: 15000000 },
  // License Renewal - estimated from similar patterns
  { serviceType: 'license_renewal', count: 5, median: 3000000, p25: 500000, p75: 5000000, min: 100000, max: 10000000 },
  // IT Hardware - estimated
  { serviceType: 'it_hardware', count: 8, median: 5000000, p25: 2000000, p75: 15000000, min: 500000, max: 50000000 },
  // Integration - estimated
  { serviceType: 'integration', count: 3, median: 15000000, p25: 5000000, p75: 50000000, min: 2000000, max: 100000000 },
  // Managed Services - estimated
  { serviceType: 'managed_services', count: 6, median: 25000000, p25: 5000000, p75: 100000000, min: 1000000, max: 200000000 },
  // Construction
  { serviceType: 'construction', count: 10, median: 50000000, p25: 10000000, p75: 200000000, min: 1000000, max: 500000000 },
  // Other/Fallback
  { serviceType: 'other', count: 20, median: 5000000, p25: 1000000, p75: 20000000, min: 100000, max: 100000000 },
  { serviceType: 'cleaning', count: 5, median: 2000000, p25: 500000, p75: 5000000, min: 100000, max: 10000000 },
  { serviceType: 'vehicles', count: 3, median: 3000000, p25: 1000000, p75: 8000000, min: 500000, max: 15000000 },
  { serviceType: 'printing', count: 2, median: 500000, p25: 200000, p75: 1000000, min: 50000, max: 2000000 },
]

export interface EntityCalibration {
  category: EntityCategory
  count: number
  median: number
  p25: number
  p75: number
  multiplier: number  // Adjustment factor relative to baseline
}

export const ENTITY_CALIBRATION: EntityCalibration[] = [
  { category: 'royal_authority', count: 5, median: 100000000, p25: 50000000, p75: 200000000, multiplier: 1.5 },
  { category: 'authority', count: 10, median: 61900000, p25: 9600000, p75: 79000000, multiplier: 1.3 },
  { category: 'ministry', count: 25, median: 6100000, p25: 3100000, p75: 10000000, multiplier: 1.0 },
  { category: 'municipality', count: 8, median: 15000000, p25: 5000000, p75: 30000000, multiplier: 1.1 },
  { category: 'healthcare', count: 4, median: 1200000, p25: 700000, p75: 1200000, multiplier: 0.7 },
  { category: 'education', count: 6, median: 3000000, p25: 1000000, p75: 8000000, multiplier: 0.8 },
  { category: 'military', count: 3, median: 50000000, p25: 20000000, p75: 100000000, multiplier: 1.4 },
  { category: 'other', count: 15, median: 5000000, p25: 2000000, p75: 15000000, multiplier: 1.0 },
]

// ============================================================================
// CLASSIFICATION FUNCTIONS
// ============================================================================

/**
 * Classify service type from tender title and description
 */
export function classifyServiceType(title: string | null | undefined, description?: string | null): { type: ServiceType; label: string; confidence: number } {
  const text = `${title || ''} ${description || ''}`.toLowerCase()

  for (const pattern of SERVICE_TYPE_PATTERNS) {
    if (pattern.pattern.test(text)) {
      return { type: pattern.type, label: pattern.label, confidence: 85 }
    }
  }

  return { type: 'other', label: 'أخرى', confidence: 30 }
}

/**
 * Classify tender type from tab_sections or other fields
 */
export function classifyTenderType(tender: ScrapedTender): { type: TenderType; label: string; maxValue: number | null } {
  // Check tab_sections.basic_info for نوع المنافسة
  const tenderTypeField = tender.tab_sections?.basic_info?.['نوع المنافسة'] ||
                          tender.tab_sections?.basic_info?.['tender_type'] || ''

  for (const pattern of TENDER_TYPE_PATTERNS) {
    if (pattern.pattern.test(tenderTypeField)) {
      return { type: pattern.type, label: pattern.label, maxValue: pattern.maxValue }
    }
  }

  // Also check the title for hints
  const titleCheck = `${tender.title}`.toLowerCase()
  for (const pattern of TENDER_TYPE_PATTERNS) {
    if (pattern.pattern.test(titleCheck)) {
      return { type: pattern.type, label: pattern.label, maxValue: pattern.maxValue }
    }
  }

  return { type: 'unknown', label: 'غير محدد', maxValue: null }
}

/**
 * Classify entity category from entity name
 */
export function classifyEntityCategory(entity: string): { category: EntityCategory; label: string } {
  for (const pattern of ENTITY_CATEGORY_PATTERNS) {
    if (pattern.pattern.test(entity)) {
      return { category: pattern.category, label: pattern.label }
    }
  }

  return { category: 'other', label: 'أخرى' }
}

/**
 * Calculate complexity level from tender signals
 */
export function calculateComplexity(tender: ScrapedTender): { level: ComplexityLevel; score: number } {
  let score = 50 // Base score

  // Submission method - separate files = more complex
  const submissionMethod = tender.tab_sections?.basic_info?.['طريقة تقديم العروض'] || ''
  if (/ملفات منفصلة|separate|multiple/i.test(submissionMethod)) {
    score += 20
  }

  // Initial guarantee required = more complex/serious
  if (tender.initial_guarantee && tender.initial_guarantee > 0) {
    score += 15
    if (tender.initial_guarantee > 100000) score += 10
  }

  // Insurance required = complex
  const insurance = tender.tab_sections?.financial_info?.['التأمين'] || ''
  if (insurance && !/لا يوجد|none|غير مطلوب/i.test(insurance)) {
    score += 15
  }

  // Contract duration > 12 months = complex
  const duration = parseContractDuration(tender.contract_duration)
  if (duration > 12) score += 15
  else if (duration > 6) score += 5

  // Booklet price > 10K = complex
  if (tender.booklet_price && tender.booklet_price > 10000) {
    score += 10
  }

  score = Math.min(100, Math.max(0, score))

  let level: ComplexityLevel = 'low'
  if (score >= 80) level = 'very_high'
  else if (score >= 60) level = 'high'
  else if (score >= 40) level = 'medium'

  return { level, score }
}

/**
 * Calculate company fit score - how well this tender matches company capabilities
 */
export function calculateCompanyFit(title: string | null | undefined, description?: string | null): { score: number; category: 'core' | 'adjacent' | 'avoid' | 'unknown' } {
  const text = `${title || ''} ${description || ''}`.toLowerCase()

  // Check avoid patterns first
  for (const service of COMPANY_SERVICES.avoid) {
    const regex = new RegExp(service.pattern, 'i')
    if (regex.test(text)) {
      return { score: service.fit, category: 'avoid' }
    }
  }

  // Check core patterns
  for (const service of COMPANY_SERVICES.core) {
    const regex = new RegExp(service.pattern, 'i')
    if (regex.test(text)) {
      return { score: service.fit, category: 'core' }
    }
  }

  // Check adjacent patterns
  for (const service of COMPANY_SERVICES.adjacent) {
    const regex = new RegExp(service.pattern, 'i')
    if (regex.test(text)) {
      return { score: service.fit, category: 'adjacent' }
    }
  }

  // Unknown - neutral score
  return { score: 40, category: 'unknown' }
}

// =============================================================================
// DUAL-TRACK (Phase 3): Work type + Infratech vs Exotech scoring
// =============================================================================

export type WorkTypeCommodityOrPro = 'Commodity' | 'Professional Services'

/**
 * Detect work type from text (Phase 3.1).
 * Returns `'Commodity'` if any BLOCKLIST_KEYWORDS match (case-insensitive), otherwise `'Professional Services'`.
 *
 * @param text - Title/description to check (nullable; treated as empty string if null/undefined)
 * @returns `'Commodity'` | `'Professional Services'`
 */
export function detectWorkType(text: string): WorkTypeCommodityOrPro {
  const lower = (text ?? '').toLowerCase()
  for (const keyword of BLOCKLIST_KEYWORDS) {
    if (lower.includes(keyword.toLowerCase())) {
      return 'Commodity'
    }
  }
  return 'Professional Services'
}

/** Result of dual-track scoring (Infratech vs Exotech). */
export interface DualScoreResult {
  infratech_score: number
  exotech_score: number
}

/**
 * Calculate dual-track scores from title/description and entity (Phase 3).
 * Infratech: start 30, +15 per INFRATECH_KEYWORDS match, +20 if entity in STRATEGIC_ENTITIES, cap 100.
 * Exotech: start 20, +25 per EXOTECH_KEYWORDS match, +15 if text has "Platform" AND "Development" (or منصة and تطوير), cap 100.
 */
export function calculateDualScore(text: string, entity: string): DualScoreResult {
  const lowerText = (text ?? '').toLowerCase()
  const lowerEntity = (entity ?? '').toLowerCase()

  // Infratech: start 30, +15 per keyword, +20 strategic entity, cap 100
  let infratech_score = 30
  for (const keyword of INFRATECH_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      infratech_score += 15
    }
  }
  for (const strategic of STRATEGIC_ENTITIES) {
    if (lowerEntity.includes(strategic.toLowerCase())) {
      infratech_score += 20
      break
    }
  }
  infratech_score = Math.min(100, infratech_score)

  // Exotech: start 20, +25 per keyword, +15 if "Platform" AND "Development" (or منصة and تطوير), cap 100
  let exotech_score = 20
  for (const keyword of EXOTECH_KEYWORDS) {
    if (lowerText.includes(keyword.toLowerCase())) {
      exotech_score += 25
    }
  }
  const hasPlatform = /platform|منصة/i.test(lowerText)
  const hasDevelopment = /development|تطوير/i.test(lowerText)
  if (hasPlatform && hasDevelopment) {
    exotech_score += 15
  }
  exotech_score = Math.min(100, exotech_score)

  return { infratech_score, exotech_score }
}

/**
 * Parse contract duration string to months
 */
export function parseContractDuration(duration: string | null | undefined): number {
  if (!duration) return 0

  // Try to extract months
  const monthMatch = duration.match(/(\d+)\s*(شهر|month)/i)
  if (monthMatch) return parseInt(monthMatch[1], 10)

  // Try to extract years and convert
  const yearMatch = duration.match(/(\d+)\s*(سنة|سنوات|year)/i)
  if (yearMatch) return parseInt(yearMatch[1], 10) * 12

  // Try to extract days and convert
  const dayMatch = duration.match(/(\d+)\s*(يوم|day)/i)
  if (dayMatch) return Math.ceil(parseInt(dayMatch[1], 10) / 30)

  return 0
}

/**
 * Main classification function - classifies a tender across all dimensions
 */
export function classifyTender(tender: ScrapedTender): TenderClassification {
  const serviceClassification = classifyServiceType(tender.title, tender.description)
  const tenderTypeClassification = classifyTenderType(tender)
  const entityClassification = classifyEntityCategory(tender.entity || '')
  const complexity = calculateComplexity(tender)
  const companyFit = calculateCompanyFit(tender.title, tender.description)

  return {
    serviceType: serviceClassification.type,
    serviceTypeLabel: serviceClassification.label,
    serviceTypeConfidence: serviceClassification.confidence,

    tenderType: tenderTypeClassification.type,
    tenderTypeLabel: tenderTypeClassification.label,
    maxLegalValue: tenderTypeClassification.maxValue,

    entityCategory: entityClassification.category,
    entityCategoryLabel: entityClassification.label,

    complexity: complexity.level,
    complexityScore: complexity.score,

    companyFitScore: companyFit.score,
    companyFitCategory: companyFit.category,
  }
}

const DEFAULT_CALIBRATION_PATH = path.join(process.cwd(), 'data', 'calibration-result.json')

/** Load historical calibration: cache (from DB) first, then file, then built-in. Fail-safe. */
function loadHistoricalCalibrationData(calibrationPath?: string): HistoricalCalibration[] {
  const cached = getCachedCalibration()
  if (cached != null && cached.length > 0) {
    return cached as HistoricalCalibration[]
  }
  const filePath = calibrationPath ?? DEFAULT_CALIBRATION_PATH
  try {
    if (!fs.existsSync(filePath)) return HISTORICAL_CALIBRATION
    const raw = fs.readFileSync(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as { service_type_calibration?: unknown[] }
    const arr = parsed?.service_type_calibration
    if (!Array.isArray(arr) || arr.length === 0) return HISTORICAL_CALIBRATION
    const valid = arr.filter(
      (e): e is HistoricalCalibration =>
        e != null &&
        typeof e === 'object' &&
        typeof (e as HistoricalCalibration).serviceType === 'string' &&
        typeof (e as HistoricalCalibration).median === 'number' &&
        typeof (e as HistoricalCalibration).p25 === 'number' &&
        typeof (e as HistoricalCalibration).p75 === 'number'
    )
    if (valid.length === 0) return HISTORICAL_CALIBRATION
    return valid
  } catch {
    return HISTORICAL_CALIBRATION
  }
}

/**
 * Get historical calibration data for a service type.
 * Uses cache (system_settings) then calibration-result.json, else built-in constants.
 */
export function getHistoricalCalibration(
  serviceType: ServiceType,
  calibrationPath?: string
): HistoricalCalibration {
  const data = loadHistoricalCalibrationData(calibrationPath)
  const found = data.find((h) => h.serviceType === serviceType)
  return found || data.find((h) => h.serviceType === 'other')!
}

/**
 * Get entity calibration data
 */
export function getEntityCalibration(entityCategory: EntityCategory): EntityCalibration {
  const found = ENTITY_CALIBRATION.find(e => e.category === entityCategory)
  return found || ENTITY_CALIBRATION.find(e => e.category === 'other')!
}
