/**
 * Display helper for entity/title text by locale.
 *
 * Resolution order for English locale:
 * 1. Tender's entity_en/title_en column (populated by AI at sync time - primary source)
 * 2. Translation map from phrase_translations cache (AI fallback)
 * 3. Static glossary for known entities
 * 4. Original Arabic text (last resort)
 *
 * For Arabic locale: always returns original text.
 */

import { getGlossaryDisplayText } from '@/lib/entity-glossary'

function normalizeKey(s: string): string {
  return s.trim().replace(/\s+/g, ' ').normalize('NFC')
}

/**
 * Get display entity for a tender.
 *
 * @param entity - Original Arabic entity name
 * @param entityEn - Pre-translated English entity (from tender.entity_en)
 * @param locale - Current locale ('en' or 'ar')
 * @param translationMap - Optional fallback map from phrase_translations cache
 */
export function getDisplayEntity(
  entity: string | null | undefined,
  entityEn: string | null | undefined,
  locale: string,
  translationMap?: Record<string, string> | null
): string {
  if (entity == null || entity === '') return entity ?? ''
  if (locale !== 'en') return entity

  // Primary source: tender.entity_en (populated at sync time)
  if (entityEn && entityEn.trim() !== '') {
    return entityEn
  }

  // Fallback: translation map from AI cache
  if (translationMap) {
    const result = lookupInMap(entity, translationMap)
    if (result) return result
  }

  // Last resort: static glossary
  return getGlossaryDisplayText(entity, locale)
}

/**
 * Get display title for a tender.
 *
 * @param title - Original Arabic title
 * @param titleEn - Pre-translated English title (from tender.title_en)
 * @param locale - Current locale ('en' or 'ar')
 * @param translationMap - Optional fallback map from phrase_translations cache
 */
export function getDisplayTitle(
  title: string | null | undefined,
  titleEn: string | null | undefined,
  locale: string,
  translationMap?: Record<string, string> | null
): string {
  if (title == null || title === '') return title ?? ''
  if (locale !== 'en') return title

  // Primary source: tender.title_en (populated at sync time)
  if (titleEn && titleEn.trim() !== '') {
    return titleEn
  }

  // Fallback: translation map from AI cache
  if (translationMap) {
    const result = lookupInMap(title, translationMap)
    if (result) return result
  }

  // Last resort: return original (titles are too variable for static glossary)
  return title
}

/**
 * Look up a value in a translation map with normalization.
 */
function lookupInMap(text: string, map: Record<string, string>): string | null {
  const t = text.trim()
  const n = normalizeKey(text)

  // Direct lookups
  let fromMap = map[text] ?? map[t] ?? map[n]

  // Normalized key search
  if (fromMap === undefined || fromMap === '') {
    for (const [key, value] of Object.entries(map)) {
      if (value && normalizeKey(key) === n) {
        fromMap = value
        break
      }
    }
  }

  return fromMap && fromMap !== '' ? fromMap : null
}

/**
 * Legacy function for backward compatibility.
 * Resolve display text for locale (without tender-specific _en fields).
 *
 * @deprecated Use getDisplayEntity or getDisplayTitle instead for new code.
 */
export function getDisplayText(
  text: string | null | undefined,
  locale: string,
  translationMap: Record<string, string> | null
): string {
  if (text == null || text === '') return text ?? ''
  if (locale !== 'en') return text

  if (translationMap) {
    const result = lookupInMap(text, translationMap)
    if (result) return result
  }

  return getGlossaryDisplayText(text, locale)
}
