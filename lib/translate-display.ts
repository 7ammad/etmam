/**
 * Display helper for entity/title text by locale.
 * No AI — uses optional translation map (if provided) or static glossary for known entities.
 * When locale is English and no map is provided, we use glossary only; otherwise show original.
 */

import { getGlossaryDisplayText } from '@/lib/entity-glossary'

function normalizeKey(s: string): string {
  return s.trim().replace(/\s+/g, ' ').normalize('NFC')
}

/**
 * Resolve display text for locale.
 * - Arabic locale: always original.
 * - English locale + translationMap: use map; if key missing, fall back to glossary then original.
 * - English locale + no map: use static glossary for known entities; otherwise original (no AI).
 */
export function getDisplayText(
  text: string | null | undefined,
  locale: string,
  translationMap: Record<string, string> | null
): string {
  if (text == null || text === '') return text ?? ''
  if (locale !== 'en') return text
  if (translationMap) {
    const t = text.trim()
    const n = normalizeKey(text)
    let fromMap =
      translationMap[text] ?? translationMap[t] ?? translationMap[n]
    if (fromMap === undefined || fromMap === '') {
      for (const [key, value] of Object.entries(translationMap)) {
        if (value && normalizeKey(key) === n) {
          fromMap = value
          break
        }
      }
    }
    if (fromMap !== undefined && fromMap !== '') return fromMap
  }
  return getGlossaryDisplayText(text, locale)
}
