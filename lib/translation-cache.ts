/**
 * Persistent translation cache in DB (phrase_translations table).
 * Best practice for dual-language sites with dynamic content: translate once, serve from cache.
 * Only phrases not in the cache hit the AI; page reloads and repeated phrases use DB only.
 */

import { createServiceClient } from '@/lib/supabase/server'

export const TARGET_LANG_EN = 'en'

function normalizeKey(s: string): string {
  return s.trim().replace(/\s+/g, ' ').normalize('NFC')
}

/**
 * Load cached translations from DB for the given phrases and target language.
 * Returns a map: original input phrase -> translated text (only for phrases that have a cache row).
 */
export async function getCachedTranslations(
  phrases: string[],
  targetLang: string
): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  const normalizedToOriginals = new Map<string, string[]>() // normalized -> [original1, original2, ...]

  for (const p of phrases) {
    if (p == null || typeof p !== 'string' || p.trim() === '') continue
    const s = p.trim()
    const key = normalizeKey(s)
    const list = normalizedToOriginals.get(key) ?? []
    if (!list.includes(s)) list.push(s)
    normalizedToOriginals.set(key, list)
  }

  const keys = [...normalizedToOriginals.keys()]
  if (keys.length === 0) return result

  const supabase = createServiceClient()
  // Official: batch .in() to avoid URI length limits; Supabase pattern for large sets (docs/BUILD_FIXES_OFFICIAL.md)
  const BATCH_SIZE = 25
  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const batch = keys.slice(i, i + BATCH_SIZE)
    const { data: rows, error } = await supabase
      .from('phrase_translations')
      .select('source_normalized, translated_text')
      .eq('target_lang', targetLang)
      .in('source_normalized', batch)

    if (error) {
      if (/Could not find the table .*phrase_translations/.test(error.message)) {
        console.warn('[translation-cache] Table phrase_translations missing. Run the migration: supabase db reset (local) or run docs/supabase-phrase-translations-manual.sql in Supabase SQL Editor.')
      } else {
        console.warn('[translation-cache] getCachedTranslations error:', error.message)
      }
      continue
    }
    for (const row of rows ?? []) {
      const translated = row.translated_text
      const originals = normalizedToOriginals.get(row.source_normalized) ?? []
      for (const orig of originals) {
        result[orig] = translated
        result[row.source_normalized] = translated
      }
    }
  }

  return result
}

/**
 * Save new translations to the cache. Keys of `map` are original source phrases;
 * we store by normalized key so duplicates (e.g. same text with different whitespace) share one row.
 */
export async function saveTranslations(
  map: Record<string, string>,
  targetLang: string
): Promise<void> {
  const entries = Object.entries(map).filter(([, v]) => v != null && String(v).trim() !== '')
  if (entries.length === 0) return

  const seen = new Set<string>()
  const rows: { source_normalized: string; target_lang: string; translated_text: string }[] = []
  for (const [source, translated] of entries) {
    const key = normalizeKey(source)
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({
      source_normalized: key,
      target_lang: targetLang,
      translated_text: translated.trim(),
    })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('phrase_translations').upsert(rows, {
    onConflict: 'source_normalized,target_lang',
  })

  if (error) {
    if (/Could not find the table .*phrase_translations/.test(error.message)) {
      console.warn('[translation-cache] Table phrase_translations missing. Run the migration: supabase db reset (local) or run docs/supabase-phrase-translations-manual.sql in Supabase SQL Editor.')
    } else {
      console.warn('[translation-cache] saveTranslations error:', error.message)
    }
  }
}

/** Prefix for summary cache keys (entity_summary / title_summary). Same table, different key space. */
export type SummaryPrefix = 'entity_summary' | 'title_summary'

/**
 * Load cached summaries from DB. Uses source_normalized = prefix + ':' + normalized phrase.
 * Returns map: original phrase -> summary text.
 */
export async function getCachedSummaries(
  phrases: string[],
  targetLang: string,
  prefix: SummaryPrefix
): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  const keyToOriginals = new Map<string, string[]>()
  for (const p of phrases) {
    if (p == null || typeof p !== 'string' || p.trim() === '') continue
    const s = p.trim()
    const key = `${prefix}:${normalizeKey(s)}`
    const list = keyToOriginals.get(key) ?? []
    if (!list.includes(s)) list.push(s)
    keyToOriginals.set(key, list)
  }
  const keys = [...keyToOriginals.keys()]
  if (keys.length === 0) return result

  const supabase = createServiceClient()
  // Official: Supabase Realtime in-filter max 100 values; batch .in() to avoid URI length limits (docs/BUILD_FIXES_OFFICIAL.md)
  const BATCH_SIZE = 25
  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    const batch = keys.slice(i, i + BATCH_SIZE)
    const { data: rows, error } = await supabase
      .from('phrase_translations')
      .select('source_normalized, translated_text')
      .eq('target_lang', targetLang)
      .in('source_normalized', batch)

    if (error) {
      console.warn('[translation-cache] getCachedSummaries error:', error.message)
      continue
    }
    for (const row of rows ?? []) {
      const summary = row.translated_text
      const originals = keyToOriginals.get(row.source_normalized) ?? []
      for (const orig of originals) result[orig] = summary
    }
  }
  return result
}

/**
 * Save summaries to cache. Keys stored as source_normalized = prefix + ':' + normalized(source).
 */
export async function saveSummaries(
  map: Record<string, string>,
  targetLang: string,
  prefix: SummaryPrefix
): Promise<void> {
  const entries = Object.entries(map).filter(([, v]) => v != null && String(v).trim() !== '')
  if (entries.length === 0) return
  const seen = new Set<string>()
  const rows: { source_normalized: string; target_lang: string; translated_text: string }[] = []
  for (const [source, summary] of entries) {
    const key = `${prefix}:${normalizeKey(source)}`
    if (seen.has(key)) continue
    seen.add(key)
    rows.push({
      source_normalized: key,
      target_lang: targetLang,
      translated_text: summary.trim(),
    })
  }
  const supabase = createServiceClient()
  const { error } = await supabase.from('phrase_translations').upsert(rows, {
    onConflict: 'source_normalized,target_lang',
  })
  if (error) console.warn('[translation-cache] saveSummaries error:', error.message)
}
