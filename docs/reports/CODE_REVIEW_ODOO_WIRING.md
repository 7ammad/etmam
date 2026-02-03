# Code Review: Odoo CRM Wiring (Evaluation → Push)

**Date:** 2026-02-02  
**Scope:** `.env.example` Odoo block, `lib/crm/push-odoo.ts`, `actions/evaluation.ts` (post-evaluation auto-push).

---

## 1. What Was Reviewed

- **.env.example** — Appended Odoo env block (ODOO_BASE_URL, ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, ODOO_PUSH_ENABLED).
- **lib/crm/push-odoo.ts** — New `pushTenderToOdoo(tenderId)`; builds OpportunityData with predicted_value_sar → expected_revenue and description "Infratech Score: X | Exotech Score: Y | Recommendation: Z".
- **actions/evaluation.ts** — After successful upsert + status 'evaluated', if `isOdooPushEnabledFromEnv()` then `await pushTenderToOdoo(tenderId)`; on failure only log warning.

---

## 2. Correctness

| Check | Status | Notes |
|-------|--------|--------|
| **predicted_value_sar → expected_revenue** | OK | `push-odoo` sets `estimated_value` from `ev.predicted_value_sar`, then fallback to predicted_budget min/max midpoint, then `tender.estimated_value`. `opportunityToLeadFields` maps `data.estimated_value` → `expected_revenue`. |
| **Description block** | OK | `summary` is set to "Infratech Score: X \| Exotech Score: Y \| Recommendation: Z" (with ev.summary prepended when present). Odoo provider uses `data.summary` in description. |
| **isOdooPushEnabledFromEnv** | OK | Used in evaluation action; matches `actions/crm.ts` and supports `'true'` or `'1'`. |
| **Edge: no evaluation** | OK | `buildOpportunityData` still returns data (expectedRevenue from tender.estimated_value; Infratech/Exotech/Rec as "—"). Lead is created with fallback values. |
| **Edge: tender not found** | OK | `getTenderById` returns null → `buildOpportunityData` null → `pushTenderToOdoo` returns `{ success: false, error: 'Tender not found' }`. |
| **Edge: null predicted_value_sar** | OK | Fallback chain: predicted_budget min/max midpoint, then tender.estimated_value. |
| **Type safety** | OK | `ev` cast to `Record<string, unknown>`; numeric fields coerced with `Number()`; `OpportunityData` shape satisfied. |

---

## 3. Consistency with Existing Code

| Area | Finding |
|------|--------|
| **opportunityToLeadFields** | Uses `data.estimated_value`, `data.summary`, `data.recommendation`, `data.score` for lead fields. Our payload sets all of these; summary already contains Infratech/Exotech/Recommendation, so description is correct (provider also appends Recommendation/Score again — redundant but harmless). |
| **createOpportunity** | Same flow: authenticate → leadFields from opportunityToLeadFields → execute_kw create. No change required. |
| **pushToCRM (actions/crm.ts)** | Builds opportunityData with predicted_budget min/max (not predicted_value_sar). We intentionally prefer predicted_value_sar in push-odoo for post-evaluation push. |

---

## 4. Gaps and Recommendations

### 4.1 [Gap] Auto-push success not recorded

**Finding:** When `pushTenderToOdoo` succeeds, we do not:

- Insert into `crm_pushes` (no audit trail),
- Set tender `status` to `'pushed'`.

**Effect:** Auto-pushed tenders stay `status: 'evaluated'`; re-running evaluation could push again (duplicate Odoo leads). UI does not show "Pushed" for auto-pushed tenders.

**Recommendation:**

- **Option A (MVP):** Leave as-is; document that auto-push is best-effort and not audited. Rely on manual "Push to CRM" for audit and status.
- **Option B (Parity with manual push):** When auto-push succeeds, update tender status to `'pushed'` and, if you have a stable `crm_config_id` for env Odoo (e.g. system or first-active Odoo config), insert a `crm_pushes` row. That requires resolving a config id in `pushTenderToOdoo` (e.g. by user context or a dedicated "system" Odoo config).

### 4.2 [Minor] Duplicate Recommendation/Score in Odoo description

**Finding:** `opportunityToLeadFields` builds description from `[data.summary, Recommendation: …, Score: …]`. Our `summary` already contains "Recommendation: Z". So the lead description gets that line twice plus Score. Cosmetic only.

**Recommendation:** Optional: extend `OpportunityData` or Odoo mapping so a single "evaluation summary" field is used for description and the provider does not append Recommendation/Score again when that block is present. Low priority.

### 4.3 [OK] No user context in pushTenderToOdoo

**Finding:** `pushTenderToOdoo` uses `getOdooConfigFromEnv()` and `getTenderById` (service client). No request user. That is appropriate for a post-evaluation auto-push driven by env only; user-scoped push remains `pushToCRM` in actions/crm.ts.

---

## 5. Verdict

- **Logic and mapping:** Correct; predicted_value_sar and Infratech/Exotech/Recommendation are wired as specified.
- **Edge cases:** Handled (no evaluation, tender not found, nulls).
- **Gap:** Success path does not record `crm_pushes` or set status to `'pushed'`; accept for MVP or add per recommendation above.

No code changes required for correctness; only optional improvements for audit/UX parity with manual push.
