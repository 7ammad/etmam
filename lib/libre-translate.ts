/**
 * LibreTranslate: self-hosted or public API (no AI).
 * - Self-hosted: docker compose -f docker-compose.libretranslate.yml up -d, LIBRE_TRANSLATE_URL default http://localhost:5000
 * - Public: set LIBRE_TRANSLATE_URL=https://libretranslate.com and LIBRE_TRANSLATE_API_KEY=your_key
 * See https://docs.libretranslate.com/guides/api_usage
 */

const DEFAULT_BASE_URL = 'http://localhost:5000'
const REQUEST_TIMEOUT_MS = 15_000

function getBaseUrl(): string {
  const url = process.env.LIBRE_TRANSLATE_URL?.trim()
  return url || DEFAULT_BASE_URL
}

function getApiKey(): string | undefined {
  return process.env.LIBRE_TRANSLATE_API_KEY?.trim() || undefined
}

export function isLibreTranslateConfigured(): boolean {
  return true // We always try default localhost; no env required
}

type TranslateResponse = { translatedText?: string; error?: string }

/**
 * Translate a single phrase via local LibreTranslate API.
 * Returns translated text or original on failure/timeout.
 */
export async function translateWithLibre(
  text: string,
  source: string,
  target: string
): Promise<string> {
  const baseUrl = getBaseUrl().replace(/\/$/, '')
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const body: { q: string; source: string; target: string; api_key?: string } = {
      q: text,
      source,
      target,
    }
    const apiKey = getApiKey()
    if (apiKey) body.api_key = apiKey

    const res = await fetch(`${baseUrl}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (!res.ok) {
      const err = await res.text()
      console.warn('[libre-translate] API error:', res.status, err)
      return text
    }
    const data = (await res.json()) as TranslateResponse
    if (data.error) {
      console.warn('[libre-translate]', data.error)
      return text
    }
    return typeof data.translatedText === 'string' ? data.translatedText : text
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.warn('[libre-translate] Request timeout')
    } else {
      console.warn('[libre-translate] Request failed:', err)
    }
    return text
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Translate a batch of phrases (Arabic -> English) via LibreTranslate.
 * Calls the API sequentially to avoid overwhelming the local server.
 * Returns a map: original phrase -> translated text (or original on failure).
 */
export async function translateBatchWithLibre(
  phrases: string[],
  source: string = 'ar',
  target: string = 'en'
): Promise<Record<string, string>> {
  const result: Record<string, string> = {}
  const unique = [...new Set(phrases.filter((p) => p != null && String(p).trim() !== ''))]
  for (const phrase of unique) {
    const s = phrase.trim()
    result[s] = await translateWithLibre(s, source, target)
  }
  return result
}
