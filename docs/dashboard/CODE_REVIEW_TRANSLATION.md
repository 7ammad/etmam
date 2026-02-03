# Code review: translation flow (last 2 tasks)

**Scope:** (1) No-AI translation path: static glossary + DB cache + LibreTranslate; (2) LibreTranslate Docker + app integration.

---

## Summary

- **Logic:** Sound. Cache-first, then LibreTranslate for missing phrases, then save to DB. Fallback to glossary/original when LibreTranslate is down.
- **Edge cases:** Mostly covered; one consistency gap (detail page still uses AI) and one optional hardening (large phrase sets).
- **Fix applied:** `libre-translate.ts` — timeout cleared in `finally` so it is always cleared.

---

## 1. Logic and data flow

### 1.1 Dashboard list (English)

- **Flow:** `page.tsx` → `TendersListTranslated` (en) → `getCachedTranslations(phrases, 'en')` → filter `stillToTranslate` → `translateBatchWithLibre(stillToTranslate)` → `saveTranslations(libreMap)` → merge into `translationMap` → `TendersListClient` with map.
- **Verdict:** Correct. Cache reduces calls; only missing phrases hit LibreTranslate; new results are persisted; client receives a single map keyed by original phrase.

### 1.2 Display resolution

- **Flow:** `getDisplayText(text, locale, translationMap)` → if `locale !== 'en'` return original; if `translationMap` use it (with fallbacks for `text` / `trim` / `normalizeKey`); else `getGlossaryDisplayText(text, locale)`.
- **Verdict:** Correct. Fallback chain (map → glossary → original) is clear and safe.

### 1.3 Cache keying

- **DB:** `source_normalized` + `target_lang` (normalize: trim, collapse spaces, NFC).
- **In memory:** Maps are keyed by **original** phrase so display can look up by `tender.entity` / `tender.title` as stored.
- **Verdict:** Consistent. `getCachedTranslations` correctly maps normalized DB rows back to all originals that share that key (e.g. different whitespace).

---

## 2. Edge cases and robustness

### 2.1 LibreTranslate down or slow

- **List:** `translateBatchWithLibre` is in try/catch; on failure we keep `translationMap` from cache only and still render. No crash.
- **Per phrase:** `translateWithLibre` returns original on timeout/error; we then save that “translation” (original) to DB. So we cache failures and keep calling LibreTranslate on every load for that phrase until it succeeds.
- **Suggestion:** Either do not call `saveTranslations` when the translated value equals the source (so we retry next time), or add a small helper that only saves when `translated !== source`. Optional improvement.

### 2.2 Empty or invalid input

- **Phrases:** `phrases.length === 0` → we pass `translationMap={null}`; client uses glossary/original. Good.
- **`getCachedTranslations`:** Skips null/empty; builds keys from trimmed strings. Good.
- **`getDisplayText`:** Handles null/empty; glossary handles null/empty. Good.

### 2.3 Large phrase set

- **DB:** `getCachedTranslations` uses `.in('source_normalized', keys)`. PostgreSQL supports large IN lists, but very large sets (e.g. thousands) can be slow or hit driver limits.
- **LibreTranslate:** Sequential calls per phrase; many phrases can make the first load slow. Acceptable for “new phrases only” after cache warms; optional improvement: cap `stillToTranslate.length` or process in chunks with a timeout for the whole batch.

### 2.4 Timeout cleanup

- **Before:** `clearTimeout(timeoutId)` was only on the success path and in catch; if `res.json()` threw, catch would run and clear, but the pattern was brittle.
- **After:** `clearTimeout(timeoutId)` moved to `finally` so the timer is always cleared. **Fix applied.**

---

## 3. Consistency and scope

### 3.1 Detail page still uses AI

- **File:** `tender-detail-content.tsx` still calls `translateArabicToEnglishBatch` (and `translateEnglishToArabicBatch` for evaluation text).
- **Effect:** List uses LibreTranslate + cache; detail page still uses AI. Cost and behavior differ between list and detail.
- **Suggestion:** For consistency and cost, consider reusing the same strategy on the detail page: DB cache + LibreTranslate for entity/title (and, if desired, for evaluation text with a separate cache key or table). Leave as follow-up if out of scope for the last two tasks.

### 3.2 Unused export

- **File:** `libre-translate.ts` exports `isLibreTranslateConfigured()` which always returns `true`. It is not used anywhere.
- **Suggestion:** Remove the export or use it (e.g. to skip calling LibreTranslate when URL is explicitly unset). Low priority.

---

## 4. Security and configuration

- **LibreTranslate URL:** From env `LIBRE_TRANSLATE_URL`; default `http://localhost:5000`. Server-side only. No user input in URL. OK.
- **DB:** `phrase_translations` is written via service client; no user-controlled keys beyond normalized content. Normalize is deterministic and safe for storage.
- **Docker:** Compose file documents port and volume; no secrets. OK.

---

## 5. Files touched (recap)

| File | Role |
|------|------|
| `app/[locale]/dashboard/page.tsx` | En locale → TendersListTranslated; Ar → TendersListClient with null map |
| `components/dashboard/tenders-list-translated.tsx` | Cache + LibreTranslate + save; merge map; render client |
| `lib/libre-translate.ts` | Call local LibreTranslate API; timeout in `finally` |
| `lib/translation-cache.ts` | getCachedTranslations, saveTranslations (phrase_translations) |
| `lib/translate-display.ts` | getDisplayText: map → glossary → original |
| `lib/entity-glossary.ts` | Static ENTITY_GLOSSARY; getGlossaryDisplayText |
| `docker-compose.libretranslate.yml` | LibreTranslate service (ar, en only) |
| `supabase/migrations/00013_phrase_translations.sql` | Cache table |
| `types/database.ts` | phrase_translations types |

---

## 6. Verdict

- **Logic:** Correct; cache-first and fallbacks are clear.
- **Robustness:** Good; timeout cleanup fixed; optional improvements: avoid saving “translation” when result equals source, and optionally cap or chunk large `stillToTranslate`.
- **Consistency:** Detail page still uses AI; consider aligning with list (LibreTranslate + cache) in a follow-up.
- **Security/config:** No issues identified.
