/**
 * Display helper for translated content. No AI dependency — safe to use in client components.
 * Server builds translation map via lib/ai/translate and passes it as props.
 */

function normalizeKey(s: string): string {
  return s.trim().replace(/\s+/g, ' ').normalize('NFC')
}

/**
 * Resolve display text for locale: when locale is 'en', use translation map; otherwise return original.
 */
export function getDisplayText(
  text: string | null | undefined,
  locale: string,
  translationMap: Record<string, string> | null
): string {
  if (text == null || text === '') return text ?? ''
  if (locale !== 'en') return text
  if (!translationMap) return text
  const t = text.trim()
  return translationMap[text] ?? translationMap[t] ?? translationMap[normalizeKey(text)] ?? text
}
