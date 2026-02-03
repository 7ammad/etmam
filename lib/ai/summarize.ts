/**
 * AI summarization for dashboard list: entity names and tender titles.
 * Produces short, canonical English for table display. Cached in phrase_translations.
 */

import { generateText } from 'ai'
import { getAIModel, isAIConfigured } from './client'
import { getCachedSummaries, saveSummaries, TARGET_LANG_EN, type SummaryPrefix } from '@/lib/translation-cache'

const ENTITY_SUMMARY_SYSTEM = `You are an expert at normalizing organization and entity names.
Given an entity name (in Arabic or English), output the entity name only—not the department or subdivision.
- Output ONLY the main entity: e.g. "Ministry of Health", "Ministry of Education", "Capital Market Authority".
- Strip departments/divisions: "Ministry of health, education department" → "Ministry of Health". "Saudi Water Authority, Western Region" → "Saudi Water Authority".
- Government entities: use official-style short form (e.g. "Saudi Water Authority", "Defense Department").
- One line per input line when multiple are given. No numbering or labels.`

const TITLE_SUMMARY_SYSTEM = `You are an expert at summarizing tender and contract titles.
Given a tender title (in Arabic or English), output a very short English phrase that captures the essence.

STRICT RULE: Your output must be 5 words or fewer. Count the words. If a summary would exceed 5 words, shorten it (e.g. "Remote stroke care system operation and maintenance" → "Stroke care system operation maintenance" or "Remote stroke care ops and maintenance").
- Good: "Subscription renewal" (2), "Digital infrastructure development" (3), "Stroke care ops and maintenance" (5).
- Bad: "Remote stroke care system operation and maintenance" (7 words) — too long.

Focus on the main subject. One line per input line when multiple are given. No numbering or labels. Output ONLY the short summary, 5 words max.`

const CHUNK_SIZE = 20
const TITLE_MAX_WORDS = 5

/** Enforce max words by taking the first N words. */
function enforceMaxWords(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return text.trim()
  return words.slice(0, maxWords).join(' ')
}

async function summarizeBatch(
  phrases: string[],
  systemPrompt: string,
  prefix: SummaryPrefix,
  postProcess?: (line: string) => string
): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  const unique = [...new Set(phrases.filter((p) => p != null && String(p).trim() !== ''))]
  if (unique.length === 0) return result

  const cached = await getCachedSummaries(unique, TARGET_LANG_EN, prefix)
  for (const [phrase, summary] of Object.entries(cached)) {
    result[phrase] = summary
  }
  const stillToSummarize = unique.filter((p) => result[p] === undefined)
  if (stillToSummarize.length === 0) return result

  if (!isAIConfigured()) {
    for (const p of stillToSummarize) result[p] = p.trim()
    return result
  }

  const model = getAIModel()
  for (let start = 0; start < stillToSummarize.length; start += CHUNK_SIZE) {
    const chunk = stillToSummarize.slice(start, start + CHUNK_SIZE)
    const prompt =
      chunk.length === 1
        ? chunk[0]
        : `Summarize each of the following, one per line, in the same order:\n\n${chunk.join('\n')}`

    try {
      const { text } = await generateText({
        model,
        system: systemPrompt,
        prompt,
        temperature: 0.2,
        maxTokens: 512,
      })

      const lines = text
        .split(/\n/)
        .map((l) => l.trim())
        .filter((l) => l.length > 0)

      const chunkResult: Record<string, string> = {}
      if (lines.length >= chunk.length) {
        for (let i = 0; i < chunk.length; i++) {
          const orig = chunk[i]
          let summary = (lines[i] ?? orig.trim()).trim()
          if (postProcess) summary = postProcess(summary)
          result[orig] = summary
          chunkResult[orig] = summary
        }
        await saveSummaries(chunkResult, TARGET_LANG_EN, prefix)
      } else {
        for (const orig of chunk) result[orig] = orig.trim()
      }
    } catch (err) {
      console.warn('[summarize] AI failed for chunk:', err)
      for (const orig of chunk) result[orig] = orig.trim()
    }
  }

  return result
}

/**
 * Summarize entity names to short canonical English (e.g. "Ministry of health, education department" → "Ministry of Health").
 * Uses cache; only uncached phrases hit the AI.
 */
export async function summarizeEntitiesBatch(phrases: (string | null | undefined)[]): Promise<Record<string, string>> {
  const list = phrases.filter((p): p is string => p != null && String(p).trim() !== '')
  return summarizeBatch(list, ENTITY_SUMMARY_SYSTEM, 'entity_summary')
}

/**
 * Summarize tender titles to short English phrases (e.g. "Annual subscription to CLSI" → "Subscription renewal").
 * Uses cache; only uncached phrases hit the AI.
 */
export async function summarizeTitlesBatch(phrases: (string | null | undefined)[]): Promise<Record<string, string>> {
  const list = phrases.filter((p): p is string => p != null && String(p).trim() !== '')
  return summarizeBatch(list, TITLE_SUMMARY_SYSTEM, 'title_summary', (line) =>
    enforceMaxWords(line, TITLE_MAX_WORDS)
  )
}
