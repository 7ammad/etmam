/**
 * Automatic Arabic → English translation for scraper-sourced content (entity, title).
 * Uses the same AI provider as evaluation (DeepSeek/OpenAI).
 *
 * RULE: When UI locale is English, all Arabic content from the scraper is translated
 * automatically via AI. No manual glossary — one system for all Arabic text.
 */

import { generateText } from 'ai'
import { getAIModel, isAIConfigured } from './client'

const TRANSLATION_SYSTEM = `You are a professional translator. Translate Arabic text to clear, natural English.
- Output ONLY the translation(s). No explanations, numbering, or extra text.
- For government/entity names use standard English (e.g. "Ministry of Education", "Capital Market Authority").
- Preserve meaning and tone. One line per input line when multiple lines are given.`

/** In-memory cache: normalized Arabic key → English. Survives per-request; reduces duplicate AI calls. */
const translationCache = new Map<string, string>()

function normalizeKey(s: string): string {
  return s.trim().replace(/\s+/g, ' ').normalize('NFC')
}

/** True if text contains meaningful Arabic (e.g. ≥25% Arabic Unicode). */
export function isArabicContent(text: string | null | undefined): boolean {
  if (!text || typeof text !== 'string') return false
  const trimmed = text.trim()
  if (trimmed.length === 0) return false
  const arabicCount = (trimmed.match(/[\u0600-\u06FF]/g) || []).length
  return arabicCount / trimmed.length >= 0.25
}

/**
 * Translate a batch of Arabic phrases to English using one AI call.
 * Uses cache; only phrases not in cache are sent to the model.
 * Returns a map: original input phrase → English translation (or original if non-Arabic / AI off).
 */
export async function translateArabicToEnglishBatch(
  phrases: (string | null | undefined)[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  const unique = new Map<string, string>() // normalized → original (first occurrence for key in result)
  const toTranslate: string[] = []

  for (const p of phrases) {
    if (p == null || p === '') continue
    const s = p.trim()
    if (s === '') continue
    const key = normalizeKey(s)
    if (unique.has(key)) {
      result[s] = result[unique.get(key)!]
      continue
    }
    unique.set(key, s)
    if (!isArabicContent(s)) {
      result[s] = s
      continue
    }
    const cached = translationCache.get(key)
    if (cached !== undefined) {
      result[s] = cached
      continue
    }
    toTranslate.push(s)
  }

  if (toTranslate.length === 0) return result

  if (!isAIConfigured()) {
    for (const s of toTranslate) result[s] = s
    return result
  }

  const prompt =
    toTranslate.length === 1
      ? `Translate this Arabic phrase to English. Output only the English translation.\n\n${toTranslate[0]}`
      : `Translate each of the following Arabic phrases to English. Output exactly one English line per phrase, in the same order. No numbering or labels.\n\n${toTranslate.join('\n')}`

  try {
    const model = getAIModel()
    const { text } = await generateText({
      model,
      system: TRANSLATION_SYSTEM,
      prompt,
      temperature: 0.2,
      maxTokens: 2048,
    })

    const lines = text
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length >= toTranslate.length) {
      for (let i = 0; i < toTranslate.length; i++) {
        const orig = toTranslate[i]
        const translated = lines[i] ?? orig
        result[orig] = translated
        translationCache.set(normalizeKey(orig), translated)
      }
    } else {
      for (const orig of toTranslate) {
        result[orig] = orig
      }
    }
  } catch (err) {
    console.warn('[translate] AI translation failed:', err)
    for (const orig of toTranslate) result[orig] = orig
  }

  return result
}

/**
 * English → Arabic translation for rule-based evaluation text (summary, risks, etc.).
 * When UI locale is Arabic, evaluation reasons/summary from the rule engine are in English;
 * translate them so Summary and Risks sections show in Arabic (same pattern as title/entity for English).
 */
const TRANSLATION_SYSTEM_EN_AR = `You are a professional translator. Translate English text to clear, natural Arabic (Modern Standard Arabic).
- Output ONLY the translation(s). No explanations, numbering, or extra text.
- Preserve meaning and tone. One line per input line when multiple lines are given.
- For technical terms (e.g. "confidence", "booklet_price") use common Arabic equivalents or transliterate where appropriate.`

/** Cache: normalized English key → Arabic. Per-request; reduces duplicate AI calls. */
const translationCacheEnAr = new Map<string, string>()

/** True if text is predominantly English (e.g. <25% Arabic Unicode). */
function isEnglishContent(text: string | null | undefined): boolean {
  if (!text || typeof text !== 'string') return false
  const trimmed = text.trim()
  if (trimmed.length === 0) return false
  const arabicCount = (trimmed.match(/[\u0600-\u06FF]/g) || []).length
  return arabicCount / trimmed.length < 0.25
}

/**
 * Translate a batch of English phrases to Arabic using one AI call.
 * Skips phrases that are already predominantly Arabic. Returns map: original → Arabic (or original if skip).
 */
export async function translateEnglishToArabicBatch(
  phrases: (string | null | undefined)[]
): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  const unique = new Map<string, string>()
  const toTranslate: string[] = []

  for (const p of phrases) {
    if (p == null || p === '') continue
    const s = p.trim()
    if (s === '') continue
    const key = normalizeKey(s)
    if (unique.has(key)) {
      result[s] = result[unique.get(key)!]
      continue
    }
    unique.set(key, s)
    if (!isEnglishContent(s)) {
      result[s] = s
      continue
    }
    const cached = translationCacheEnAr.get(key)
    if (cached !== undefined) {
      result[s] = cached
      continue
    }
    toTranslate.push(s)
  }

  if (toTranslate.length === 0) return result

  if (!isAIConfigured()) {
    for (const s of toTranslate) result[s] = s
    return result
  }

  const prompt =
    toTranslate.length === 1
      ? `Translate this English phrase to Arabic. Output only the Arabic translation.\n\n${toTranslate[0]}`
      : `Translate each of the following English phrases to Arabic. Output exactly one Arabic line per phrase, in the same order. No numbering or labels.\n\n${toTranslate.join('\n')}`

  try {
    const model = getAIModel()
    const { text } = await generateText({
      model,
      system: TRANSLATION_SYSTEM_EN_AR,
      prompt,
      temperature: 0.2,
      maxTokens: 2048,
    })

    const lines = text
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length >= toTranslate.length) {
      for (let i = 0; i < toTranslate.length; i++) {
        const orig = toTranslate[i]
        const translated = lines[i] ?? orig
        result[orig] = translated
        translationCacheEnAr.set(normalizeKey(orig), translated)
      }
    } else {
      for (const orig of toTranslate) result[orig] = orig
    }
  } catch (err) {
    console.warn('[translate] English→Arabic failed:', err)
    for (const orig of toTranslate) result[orig] = orig
  }

  return result
}

const TRANSLATION_TIMEOUT_MS = 3000

/**
 * Translate with a timeout so page load is never blocked indefinitely.
 * If the AI call exceeds `timeoutMs`, returns {} so UI falls back to original text.
 */
export async function translateArabicToEnglishBatchWithTimeout(
  phrases: (string | null | undefined)[],
  timeoutMs: number = TRANSLATION_TIMEOUT_MS
): Promise<Record<string, string>> {
  const delay = () => new Promise<Record<string, string>>((resolve) => setTimeout(() => resolve({}), timeoutMs))
  try {
    return await Promise.race([translateArabicToEnglishBatch(phrases), delay()])
  } catch {
    return {}
  }
}

