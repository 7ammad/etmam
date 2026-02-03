# Explorer + Code Review: Tender Analysis & Translation (2026-02-03)

## 1. Executive summary

- **Tender analysis:** The app uses a single path: **V2 deterministic** (`runEvaluationAction` → `scoreTenderV2`). No code loads `.env.example`; runtime env must be in **`.env.local`** (Next.js loads `.env*` automatically; `.env.example` is template only).
- **Likely failure points for “analysis not working”:** (1) Missing/invalid `.env.local` → `createServiceClient()` throws (`SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SUPABASE_URL`); (2) `scoreTenderV2` throwing (e.g. custom `scoring.config.json` with invalid `weights_v2` sum); (3) DB/RLS or `upsertEvaluation`/`updateTender` errors.
- **Translation:** Detail page uses **AI** (`lib/ai/translate.ts`) for entity/title (ar→en) and evaluation text (en→ar). When AI is not configured, originals are returned (no crash). **Translation issues:** (1) Lookup by exact string only — minor whitespace/Unicode differences prevent match; (2) Detail page uses AI while list uses LibreTranslate + cache (inconsistent).

---

## 2. Tender analysis flow (verified)

| Step | Location | What happens |
|------|----------|--------------|
| Trigger | `RunAnalysisButton` → `runEvaluationAction(tenderId)` or `rerunEvaluationAction` | User clicks “Run analysis” / “Re-run analysis” |
| Load tender | `getTenderById(tenderId)` | Uses `createClient()` (user session). Returns `TenderWithEvaluation \| null`. |
| Set status | `updateTender(tenderId, { status: 'evaluating' })` | User-scoped client |
| Shape | `tenderRowToScraped(tender)` | `lib/evaluation/db-adapter.ts` → `ScrapedTender` |
| Config | `loadScoringConfig()` | Reads `config/scoring.config.json` (Node `fs`). Returns `null` if missing/invalid; then `config ?? undefined` → `scoreTenderV2` uses `DEFAULT_CONFIG`. |
| Score | `scoreTenderV2(scraped, config ?? undefined)` | `lib/evaluation/rules.ts`. Uses `config.weights_v2 ?? DEFAULT_WEIGHTS_V2`. Throws if weights don’t sum to 1.0. |
| Persist | `upsertEvaluation(...)` | Uses **`createServiceClient()`**. Throws if `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_URL` missing. |
| Status | `updateTender(tenderId, { status: 'evaluated' })` | Then optional Odoo push if enabled |

**Critical:** `createServiceClient()` in `lib/supabase/server.ts` throws when env vars are missing. Those vars are loaded by Next.js from **`.env.local`** (and other `.env*` files), **not** from `.env.example`. No code in the repo reads `.env.example` for runtime.

---

## 3. .env vs .env.example vs .env.local

- **Next.js (official):** Loads `.env*` into `process.env` automatically; `.env.example` is **not** in the load list. For local dev, the correct file is **`.env.local`**.
- **This repo:** All scripts and docs that need env refer to `.env.local`. `.env.example` is a template (comment: “Copy this file to .env.local”).
- **Code-review check:** No `.ts`/`.tsx`/`.js` references `.env.example` for loading. **Verdict:** Correct file is `.env.local`; no mistaken “change to .env.example” in code.

---

## 4. Translation flow and issues

### 4.1 Detail page (Arabic locale)

- **File:** `components/dashboard/tender-detail-content.tsx`
- **When `locale === 'ar'` and `hasEvaluation && ev`:**
  - Builds `evaluationPhrases` from `ev.summary`, `ev.risks`, `ev.strengths`, `ev.missing_requirements`, `ev.action_items` (all trimmed).
  - Calls `translateEnglishToArabicBatch(evaluationPhrases)` (AI in `lib/ai/translate.ts`).
  - Map: `(s) => evalMap[s] ?? s` — **lookup by exact string only.** If DB or response has different whitespace/Unicode, no match → English shown.

### 4.2 Detail page (English locale)

- Entity/title: `translateArabicToEnglishBatch([entity, title])` (AI). Then `getDisplayText(..., translationMap)`.

### 4.3 Translation issues to fix

1. **Lookup robustness:** Use normalized key (e.g. `normalizeKey(s)`) as fallback when mapping evaluation text, so minor differences in whitespace/Unicode still resolve to the translated value.
2. **Consistency (optional):** Detail page uses AI; list uses LibreTranslate + DB cache. Consider aligning detail with cache + LibreTranslate in a follow-up.

---

## 5. Key files

| File | Role |
|------|------|
| `actions/evaluation.ts` | `runEvaluationAction`, `rerunEvaluationAction`; only V2 path |
| `lib/evaluation/rules.ts` | `scoreTenderV2`, `DEFAULT_CONFIG`, `DEFAULT_WEIGHTS_V2` |
| `lib/evaluation/config-loader.ts` | `loadScoringConfig()` from `config/scoring.config.json` |
| `lib/supabase/server.ts` | `createClient()`, `createServiceClient()` — service client throws if env missing |
| `lib/ai/translate.ts` | `translateArabicToEnglishBatch`, `translateEnglishToArabicBatch` (AI) |
| `components/dashboard/tender-detail-content.tsx` | Builds evaluation phrases; map `evalMap[s] ?? s` |
| `config/scoring.config.json` | Has `weights`, `rules`, `value_estimation`; no `weights_v2` → code uses `DEFAULT_WEIGHTS_V2` |

---

## 6. Debugger handover checklist

1. **Confirm env:** Ensure `C:\Dev\Builds\etmam-app\.env.local` exists and contains at least `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. If analysis fails with “SUPABASE_SERVICE_ROLE_KEY is not configured”, env is not loaded (wrong path or missing file).
2. **Reproduce analysis failure:** Run “Run analysis” on a tender; capture server logs and action return (`result.success` / `result.error`).
3. **Translation:** Apply normalized-key fallback in `tender-detail-content.tsx` for evaluation text map so `summaryDisplay`/`risksDisplay`/etc. resolve when key differs only by whitespace/Unicode.
4. **Re-run analysis and translation:** After fixes, run analysis again and open detail in both locales; confirm score, summary, and (where applicable) translated text display correctly.

---

## 7. Fixes applied (pre–debugger)

- **Translation lookup robustness:** In `components/dashboard/tender-detail-content.tsx`, evaluation text (summary, risks, strengths, etc.) is now resolved with a normalized-key fallback: we build `normalizedToTranslated` from `evalMap` (normalizeKey(phrase) → translated) and use `map(s) = evalMap[s] ?? normalizedToTranslated[normalizeKey(s)] ?? s` so minor whitespace/Unicode differences still resolve to the translated value.

---

## 8. Handover to /debugger

**Task for debugger:**

1. **Confirm env:** Verify `C:\Dev\Builds\etmam-app\.env.local` exists and contains `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. No code should load `.env.example`; Next.js loads `.env.local` automatically.
2. **Reproduce “analysis not working”:** On dashboard, open a tender and click “Run analysis”. Capture:
   - Server/terminal logs (e.g. “SUPABASE_SERVICE_ROLE_KEY is not configured”, or DB/RLS errors).
   - Action return: `result.success` vs `result.error` in `RunAnalysisButton` (error is shown under the button).
3. **If analysis fails on createServiceClient:** Ensure `.env.local` is in project root and vars are set; restart dev server.
4. **If analysis fails in scoreTenderV2:** Check `config/scoring.config.json`; if it has `weights_v2`, ensure the six weights sum to 1.0 (see `lib/evaluation/rules.ts`).
5. **Translation:** After the applied fix (normalized-key fallback), open a tender with evaluation in Arabic locale and confirm summary/risks/strengths show in Arabic when AI is configured; when AI is not configured, English is shown (expected).
6. **Verification loop:** Run analysis on a tender → open detail (en + ar) → confirm score, recommendation, summary, and (where applicable) translated text; repeat once more to ensure no regression.
