# Code Review: Dual-Track Classifier (Phase 3 — Task 3.1 & 3.2)

**Scope:** `lib/evaluation/classifier.ts` — `detectWorkType`, `calculateDualScore`, related types and exports.  
**Plan reference:** `docs/ev-ce-final-plan.md` (Phase 3: Dual-Track Classifier).  
**Date:** 2026-02-02.

---

## 1. Requirements vs implementation

### Task 3.1: `detectWorkType(text: string)`

| Requirement | Status | Notes |
|-------------|--------|--------|
| Returns `'Commodity'` if any BLOCKLIST_KEYWORDS in text | Met | Loop over `BLOCKLIST_KEYWORDS`, `lower.includes(keyword.toLowerCase())` |
| Else returns `'Professional Services'` | Met | Default return after loop |
| Case-insensitive | Met | `(text ?? '').toLowerCase()`, `keyword.toLowerCase()` |
| Return type | Met | `WorkTypeCommodityOrPro` = `'Commodity' \| 'Professional Services'` (stricter than plan’s `string`) |

**Edge:** `text` null/undefined → `(text ?? '')` → `''` → no matches → `'Professional Services'`. Correct.

---

### Task 3.2: `calculateDualScore(text: string, entity: string)`

| Requirement | Status | Notes |
|-------------|--------|--------|
| **Infratech:** start 30 | Met | `infratech_score = 30` |
| **Infratech:** +15 per INFRATECH_KEYWORDS match | Met | Loop, `lowerText.includes(keyword.toLowerCase())` → +15 per keyword |
| **Infratech:** +20 if entity in STRATEGIC_ENTITIES | Met | Loop over `STRATEGIC_ENTITIES`, `lowerEntity.includes(strategic.toLowerCase())` → +20, then `break` (once) |
| **Infratech:** cap 100 | Met | `Math.min(100, infratech_score)` |
| **Exotech:** start 20 | Met | `exotech_score = 20` |
| **Exotech:** +25 per EXOTECH_KEYWORDS match | Met | Loop, +25 per keyword |
| **Exotech:** +15 for “Platform” AND “Development” (or منصة and تطوير) | Met | `hasPlatform = /platform\|منصة/i`, `hasDevelopment = /development\|تطوير/i`; +15 only when both true |
| **Exotech:** cap 100 | Met | `Math.min(100, exotech_score)` |
| Return `{ infratech_score, exotech_score }` | Met | `DualScoreResult` |
| Case-insensitive | Met | All matching via lowercased text/entity and `.toLowerCase()` on constants |

**Edge:** Empty `text`/`entity` → `(text ?? '')`, `(entity ?? '')` → base scores 30 and 20 (no keyword/strategic/platform bonuses). Correct.

---

## 2. Imports and exports

- **Imports from `./constants`:** `BLOCKLIST_KEYWORDS`, `INFRATECH_KEYWORDS`, `EXOTECH_KEYWORDS`, `STRATEGIC_ENTITIES`. All used; no extra imports.
- **Exports from classifier:** `WorkTypeCommodityOrPro`, `detectWorkType`, `DualScoreResult`, `calculateDualScore`.
- **Re-exports from `lib/evaluation/index.ts`:** All four above are re-exported. Correct.

---

## 3. Correctness and edge cases

- **Keyword counting:** One +15 (Infratech) or +25 (Exotech) per *keyword* that appears in text, not per occurrence. Multiple occurrences of the same word do not stack. Intended and consistent with “add points for each match” in the plan.
- **Strategic entity:** +20 applied at most once (`break` after first match). Plan does not say “per entity”; single bonus is correct.
- **Platform/Dev bonus:** Requires both “platform” (or منصة) and “development” (or تطوير) in text. Aligns with plan (“Platform” AND “Development” / منصة and تطوير).
- **Null/undefined:** Handled via `(text ?? '')` and `(entity ?? '')`; no throws, base scores for empty input.

---

## 4. Possible improvements (optional)

1. **JSDoc return type (Task 3.1):** Plan says `detectWorkType(text: string): string`. Implementation returns a union type. Consider documenting: “Returns `'Commodity'` or `'Professional Services'`” so it’s explicit that it’s not an arbitrary string.
2. **Strategic entity matching:** Current logic is “entity string contains any strategic string”. If you later need “entity name is exactly X” or “entity normalized key is in set”, you’d add a separate helper; current behavior matches the plan.
3. **Tests:** No unit tests found for `detectWorkType` / `calculateDualScore`. Adding tests for (1) blocklist → Commodity, (2) no blocklist → Professional Services, (3) Infratech/Exotech base scores, (4) keyword and strategic bonuses, (5) caps at 100, (6) Platform+Development bonus would lock behavior and guard regressions.

---

## 5. Verdict

- **Requirements:** Task 3.1 and Task 3.2 requirements from the plan are met.
- **Correctness:** Scoring logic and caps match the spec; edge cases (null/empty) handled.
- **Exports/imports:** Correct; no regressions observed in existing classifier exports.
- **Recommendation:** Accept as-is for Phase 3. Optionally add JSDoc clarification and unit tests as above.
