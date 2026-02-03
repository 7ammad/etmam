# Debugger task: Tender analysis + translation (2026-02-03)

**Context:** Explorer + code-review identified why analysis might fail and which translation issues to fix. One code fix (translation lookup robustness) is already applied. Debugger should verify env, reproduce any analysis failure, and run the verification loop.

---

## 1. Env check

- **Correct file:** `C:\Dev\Builds\etmam-app\.env.local` (project root).
- **Next.js:** Loads `.env*` automatically; **does not** load `.env.example`. No code in the repo reads `.env.example` for runtime.
- **Required for analysis:** `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (used by `createServiceClient()` in `lib/supabase/server.ts`). If either is missing, `upsertEvaluation` throws and analysis returns error.

**Action:** Confirm `.env.local` exists and has these two vars. If analysis fails with “SUPABASE_SERVICE_ROLE_KEY is not configured” or “NEXT_PUBLIC_SUPABASE_URL is not configured”, fix env and restart dev server.

---

## 2. Reproduce “analysis not working”

1. Run app: `pnpm dev`.
2. Open dashboard, select a tender, click **Run analysis** (or **Re-run analysis**).
3. Capture:
   - Error text under the button (from `result.error`).
   - Server/terminal logs (Supabase errors, `scoreTenderV2` throws, etc.).

**Common causes:**

| Symptom | Likely cause | Fix |
|--------|----------------|-----|
| “SUPABASE_SERVICE_ROLE_KEY is not configured” | Env not loaded | Set in `.env.local`, restart dev |
| “NEXT_PUBLIC_SUPABASE_URL is not configured” | Same | Set in `.env.local`, restart dev |
| “V2 weights must sum to 1.0” | Invalid `config/scoring.config.json` | Fix or remove `weights_v2` (code uses `DEFAULT_WEIGHTS_V2`) |
| “Tender not found” | RLS or wrong tender ID | Check `getTenderById` and RLS for `tenders` |
| DB error on update/insert | RLS on `evaluations` or permissions | Check service role and RLS policies |

---

## 3. Translation

- **Fix applied:** `tender-detail-content.tsx` now uses a normalized-key fallback when mapping evaluation text (summary, risks, strengths, etc.) so minor whitespace/Unicode differences still resolve to the translated string.
- **Detail page:** Uses AI (`lib/ai/translate.ts`) for entity/title (en) and evaluation text (ar). If `DEEPSEEK_API_KEY` / `OPENAI_API_KEY` not set, translation returns original text (no crash).

**Action:** Open a tender that has an evaluation; switch to Arabic; confirm summary/risks/strengths display (in Arabic if AI configured, else in English). If a phrase still shows in English while others are Arabic, check that the phrase was included in `evaluationPhrases` and that the AI response had a matching line (same order).

---

## 4. Verification loop

1. Run analysis on a tender (pending or re-run).
2. Open tender detail in **English**: confirm score, recommendation, summary, breakdown; entity/title translated if AI configured.
3. Open same tender detail in **Arabic**: confirm summary/risks/strengths in Arabic (or English if no AI).
4. Run analysis on another tender and repeat steps 2–3.
5. Confirm no new errors in console or server logs.

---

## 5. Key files

- `actions/evaluation.ts` — `runEvaluationAction`, `rerunEvaluationAction`
- `lib/supabase/server.ts` — `createServiceClient()` (throws if env missing)
- `lib/evaluation/rules.ts` — `scoreTenderV2`, `DEFAULT_WEIGHTS_V2`
- `lib/evaluation/config-loader.ts` — `loadScoringConfig()` from `config/scoring.config.json`
- `components/dashboard/tender-detail-content.tsx` — translation + normalized-key fallback
- `components/dashboard/run-analysis-button.tsx` — displays `result.error`

Full findings: `docs/reports/implementations/explorer-code-review-analysis-translation-2026-02-03.md`

---

## 6. Debugger completion (2026-02-03)

- **Env check:** `.env.local` exists; `pnpm exec tsx scripts/verify-env-analysis.ts` confirmed `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set. Exit 0.
- **Analysis failure:** Not reproduced. No env/config/DB fixes required.
- **Verification loop:** Run 1 — `pnpm exec playwright test tests/e2e/crm-push.spec.ts` (9 passed), including "push button visible on tender detail when evaluated" (dashboard → tender detail → Run analysis → push button visible). Run 2 — `pnpm exec playwright test tests/e2e/dashboard.spec.ts tests/e2e/crm-push.spec.ts` (17 passed), covering dashboard en/ar, tender detail, Run analysis, and push flow.
- **Config:** `config/scoring.config.json` has no `weights_v2`; code uses `DEFAULT_WEIGHTS_V2`. No change made.
- **Script added:** `scripts/verify-env-analysis.ts` for future env checks (loads `.env.local`, checks the two required vars, does not print secrets).
