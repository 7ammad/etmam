/**
 * Global evaluation constants (Phase 1.2).
 * Centralizes hardcoded logic so core scoring and classification stay clean.
 */

// =============================================================================
// BOOKLET MULTIPLIERS (Value estimation from booklet price)
// =============================================================================

/** Booklet price → value multiplier by tier (SAR). Tier 1: 300, Tier 2: 500, Tier 3: 1500+. */
export const BOOKLET_MULTIPLIERS = {
  /** Tier 1: low booklet price → multiplier 300 */
  tier1: 300,
  /** Tier 2: medium booklet price → multiplier 500 */
  tier2: 500,
  /** Tier 3: high booklet price → multiplier 1500+ */
  tier3: 1500,
} as const

// =============================================================================
// BLOCKLIST KEYWORDS (Kill list — Commodity / auto-reject)
// =============================================================================

/** Keywords that indicate commodity/low-value work; match triggers Commodity work type or auto-reject. */
export const BLOCKLIST_KEYWORDS: readonly string[] = [
  // English
  'supply',
  'toner',
  'cleaning',
  'stationery',
  'office supplies',
  'consumables',
  'furniture supply',
  'catering',
  // Arabic (common commodity terms)
  'توريد',
  'أحبار',
  'طباعة',
  'نظافة',
  'تنظيف',
  'قرطاسية',
  'مستلزمات',
  'أثاث',
  'تجهيز مكاتب',
]

// =============================================================================
// INFRATECH KEYWORDS (Cyber, SOC, Infra — Infratech track)
// =============================================================================

/** Keywords that boost Infratech score (cybersecurity, infrastructure, NCA-related). */
export const INFRATECH_KEYWORDS: readonly string[] = [
  // English
  'cyber',
  'cybersecurity',
  'SOC',
  'infra',
  'infrastructure',
  'NCA',
  'OT',
  'ICS',
  'CCTV',
  'monitoring',
  'network',
  'security operations',
  'managed security',
  // Arabic
  'أمن سيبراني',
  'سيبراني',
  'بنية تحتية',
  'شبكة',
  'مراقبة',
  'كاميرات',
  'نظام مراقبة',
]

// =============================================================================
// EXOTECH KEYWORDS (AI, Data, Robotics — Exotech track)
// =============================================================================

/** Keywords that boost Exotech score (AI, data, robotics, platform/dev). */
export const EXOTECH_KEYWORDS: readonly string[] = [
  // English
  'AI',
  'artificial intelligence',
  'data',
  'analytics',
  'robotics',
  'ML',
  'machine learning',
  'platform',
  'development',
  'software development',
  'digital transformation',
  // Arabic
  'ذكاء اصطناعي',
  'بيانات',
  'تحليلات',
  'روبوت',
  'منصة',
  'تطوير',
  'تحول رقمي',
]

// =============================================================================
// STRATEGIC ENTITIES (SDAIA, NEOM, NCA — high-value clients)
// =============================================================================

/** Entity names/patterns that indicate strategic high-value clients; match can boost strategic/Infratech score. */
export const STRATEGIC_ENTITIES: readonly string[] = [
  // English
  'SDAIA',
  'NEOM',
  'NCA',
  'National Cybersecurity Authority',
  'Royal Commission',
  'Vision 2030',
  'giga',
  // Arabic
  'الهيئة الوطنية للأمن السيبراني',
  'نيوم',
  'سدايا',
  'اللجنة الملكية',
  'رؤية 2030',
]
