/**
 * Static Arabic → English glossary for entity names (and optionally titles).
 * No AI — extend this list manually for known government entities.
 * Used when locale is English and we are not using AI translation.
 * Add entries as you encounter recurring entities.
 */

function normalize(s: string): string {
  return s.trim().replace(/\s+/g, ' ').normalize('NFC')
}

const ENTITY_GLOSSARY: Record<string, string> = {
  // Saudi government entities — add more as needed (normalized Arabic key → English)
  [normalize('الهيئة السعودية للمياه')]: 'Saudi Water Authority',
  [normalize('القوات البحرية')]: 'Royal Saudi Naval Forces',
  [normalize('مستشفى القوات المسلحة بالرياض')]: 'Armed Forces Hospital – Riyadh',
  [normalize('وزارة التعليم')]: 'Ministry of Education',
  [normalize('وزارة الصحة')]: 'Ministry of Health',
  [normalize('هيئة السوق المالية')]: 'Capital Market Authority',
  [normalize('الجهة الحكوميه')]: 'Government Entity',
}

/**
 * Look up English for a phrase when using static glossary only (no AI).
 * Returns the glossary translation if found, otherwise the original text.
 */
export function getGlossaryDisplayText(
  text: string | null | undefined,
  locale: string
): string {
  if (text == null || text === '') return text ?? ''
  if (locale !== 'en') return text
  const key = normalize(text)
  return ENTITY_GLOSSARY[key] ?? text
}
