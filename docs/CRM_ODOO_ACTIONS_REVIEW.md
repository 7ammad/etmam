# CRM Odoo Provider & Actions — Code, Logic & Design Review

**Date:** 2026-01-31  
**Scope:** `lib/crm/providers/odoo.ts`, `actions/crm.ts`  
**Method:** Code-review-excellence (logic, design, security, edge cases); verification-before-completion.

---

## 1. Review summary

| Area | Result | Notes |
|------|--------|--------|
| **Odoo provider** | ✅ Fixed + documented | Config guard strengthened; invalid date handled. |
| **CRM actions** | ✅ Fixed + documented | Env used once; effectiveConfig semantics clarified; revalidatePath corrected; insert/update casts documented. |
| **Logic & design** | ✅ Aligned | Odoo env used only when `use_env` is set; no silent override of stored credentials. |
| **Verification** | ✅ type-check | Pass (see below). |

---

## 2. lib/crm/providers/odoo.ts

### 2.1 What was reviewed

- **API alignment:** JSON-RPC with `common.authenticate` and `object.execute_kw` for `crm.lead` create matches Odoo external API.
- **Config guard:** `isOdooConfig` must ensure all required fields are strings so RPC never receives wrong types.
- **Date handling:** `opportunityToLeadFields` must not call `.toISOString()` on invalid dates (e.g. `new Date('invalid')`).
- **Error handling:** HTTP and RPC errors are thrown with clear messages; caller can catch and map to user-facing messages.

### 2.2 Fixes applied

1. **Config guard (`isOdooConfig`)**  
   - **Before:** Checked presence of `db`, `username`, `password` only.  
   - **After:** Requires `typeof r.db === 'string'`, `typeof r.username === 'string'`, `typeof r.password === 'string'` so only valid strings are passed to RPC.

2. **Invalid deadline in `opportunityToLeadFields`**  
   - **Before:** `new Date(data.deadline).toISOString().slice(0, 10)` could throw or produce `"Invalid Date"` for bad input.  
   - **After:** Single `Date` conversion; if `getTime()` is `NaN`, use today’s date for `date_deadline` so Odoo always receives a valid YYYY-MM-DD string.

### 2.3 Design notes (no change)

- **Auth per request:** Each `createOpportunity` calls `odooAuthenticate`; no long-lived session. Acceptable for MVP; consider token/session reuse later if needed.
- **No fetch timeout:** `odooJsonRpc` has no `AbortSignal`/timeout; slow Odoo can hang. Documented as potential improvement (timeout or retries).

---

## 3. actions/crm.ts

### 3.1 What was reviewed

- **Connection resolution:** Stored config vs Odoo env; when env overrides stored credentials.
- **Effective config for Odoo:** When to use `getOdooConfigFromEnv()` vs stored `connection.config`.
- **Idempotent env read:** Avoid calling `getOdooConfigFromEnv()` twice in the same block.
- **RevalidatePath:** Paths must match app routes (e.g. `/[locale]/dashboard/[tenderId]`, not `/[locale]/tenders/[tenderId]`).
- **Supabase types:** Insert/update for `crm_pushes` and `tenders`; workaround where client infers `never`.

### 3.2 Fixes applied

1. **Odoo env config read once**  
   - **Before:** `getOdooConfigFromEnv()` called twice when building the “virtual” Odoo connection.  
   - **After:** Single call stored in `odooEnvConfig` and reused.

2. **Effective config semantics for Odoo**  
   - **Before:** `if (stored?.use_env === true || envConfig)` — env was used whenever env was set, even if user had saved DB credentials.  
   - **After:** Env is used only when `stored?.use_env === true`. Otherwise `connection.config` (stored credentials) is used. Stored credentials are no longer overridden by env.

3. **RevalidatePath for tender detail**  
   - **Before:** `revalidatePath(\`/[locale]/tenders/${tenderId}\`, 'page')` (no such route).  
   - **After:** `revalidatePath(\`/[locale]/dashboard/${tenderId}\`, 'page')` to match `app/[locale]/dashboard/[tenderId]`.

4. **Success record and tender update**  
   - **Before:** `response_data: result as any`; `(supabase.from('tenders') as any).update(...)`.  
   - **After:** `response_data` set to `{ success, externalId }`; tender update uses `(supabase.from('tenders') as any).update({ status: 'pushed' }).eq('id', tenderId)` with a short comment that the cast is for Supabase client typing when it infers `never` for these tables.

### 3.3 Logic & design notes

- **Odoo “virtual” connection:** When using env-only Odoo, the code still expects a `crm_configs` row for the user (with `provider = 'odoo'`) so that `crm_pushes` has a valid `crm_config_id`. Design is “stub row + env credentials”; documented in comments.
- **Dry-run vs push:** Dry-run and push share the same connection-resolution logic (DB configs first, then env fallback when push is enabled and config exists). Consistent.

---

## 4. Gaps / follow-ups (not blocking)

| Item | Priority | Description |
|------|----------|-------------|
| **Fetch timeout** | Low | Add `AbortSignal` + timeout in `odooJsonRpc` to avoid indefinite hang on slow Odoo. |
| **Supabase typings** | Low | If `from('crm_pushes').insert` / `from('tenders').update` infer `never`, regenerate or adjust `Database` types so casts can be removed. |
| **saveCRMConnection** | Nit | Reduce `as any` on upsert payload/select result where types allow. |

---

## 5. Verification

- **Type-check:** `pnpm type-check` (see run below).
- **Lint:** No linter errors on `lib/crm/providers/odoo.ts` or `actions/crm.ts` after changes.

---

*Review used: code-review-excellence (logic, security, design); verification-before-completion (evidence before claims).*
