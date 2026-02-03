# Translation: LibreTranslate (local) + DB cache + glossary fallback

**Current behavior:** The dashboard list uses **LibreTranslate** (self-hosted, in-repo via Docker) for Arabic → English when the service is running. No AI, no API key, no cloud cost.

- **LibreTranslate:** Run `docker compose -f docker-compose.libretranslate.yml up -d`. The app calls `http://localhost:5000` (or `LIBRE_TRANSLATE_URL`) for phrases not in the DB cache. Only Arabic and English models are loaded to save RAM.
- **DB cache:** Translated phrases are stored in `phrase_translations`; repeat page loads and repeated entities use the cache, so LibreTranslate is only called for new phrases.
- **Fallback:** If LibreTranslate is not running or a request fails, the app uses the **static glossary** ([`lib/entity-glossary.ts`](../lib/entity-glossary.ts)) for known entities, then original Arabic.
- **Extend the glossary:** Add entries to `ENTITY_GLOSSARY` in `lib/entity-glossary.ts` for entities you want in English when LibreTranslate is down.

---

## Why we were calling AI on every page load (historical)

When the UI locale is English, entity and title from tenders (Arabic) are translated to English. The previous flow:

1. Every dashboard load collected all unique entity/title phrases.
2. All of them were sent to the AI in one (or chunked) request.
3. The in-memory cache only lived for a single request, so each page load triggered the same AI calls again.

So opening the dashboard repeatedly or with many tenders caused slow loads and unnecessary AI usage.

## Best practice for dual-language sites with dynamic content

Standard approach (e.g. [caching translation results in DB](https://dev.to/petrtcoi/example-of-caching-google-translate-translation-results-for-a-multilingual-site-on-nextjs-4ana)):

1. **Persist translations** in a database (source phrase + target language → translated text).
2. **Before calling any translation API**, look up the phrase in the DB.
3. **If found**, return the cached translation (no API/AI).
4. **If not found**, call the API/AI, then **save the result to the DB** for next time.

So: translate once per phrase, then serve from cache. New tenders only trigger AI for phrases that have never been seen.

## What we implemented

- **Table:** `phrase_translations`  
  - `source_normalized` (normalized Arabic text)  
  - `target_lang` (e.g. `en`)  
  - `translated_text`  
  - Unique on `(source_normalized, target_lang)`.

- **Flow in `lib/ai/translate.ts`:**
  1. Build the list of phrases that need translation (Arabic, not in per-request memory cache).
  2. **Load from DB:** `getCachedTranslations(phrases, 'en')` → only phrases not in the result go to the AI.
  3. For each chunk sent to the AI, **save results to DB:** `saveTranslations(chunkResult, 'en')`.

- **Effect:**
  - First time a phrase appears: AI is called, result is stored.
  - Same phrase on later page loads or on other tenders: served from DB, no AI.
  - New tenders: only brand‑new phrases hit the AI; the rest come from cache.

## Applying the migration

Run Supabase migrations so the table exists:

```bash
supabase db push
```

Or run the migration file manually: `supabase/migrations/00013_phrase_translations.sql`.

## Out of scope (unchanged)

- **Evaluation text (summary, risks, etc.)** when locale is Arabic: still translated on demand (English → Arabic) and not cached in this table; that path is used on detail view and could be cached later with the same pattern if needed.
- **UI strings** (labels, buttons): still use i18n JSON (`messages/en.json`, `messages/ar.json`), not AI and not this cache.
