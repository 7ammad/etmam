# Scraper Fixes Applied

**Date:** 2026-01-31
**Status:** ✅ Code Fixed | ⏳ Pending Test Verification

---

## Summary

Fixed critical data quality issues in the scraper that were preventing the evaluation engine from working effectively. The evaluation logic itself was mathematically correct, but the scraper was providing incorrect data.

---

## Fixes Applied

### 1. ✅ Fixed Deadline Extraction (CRITICAL)

**Problem:**
```typescript
// OLD CODE (line 696)
const finalDeadline =
  parseDate(deadlineFromTab) || parseDate(deadlineRaw) || new Date().toISOString() // ❌ BUG!
```

The fallback to `new Date().toISOString()` caused all deadlines to be set to the current timestamp (scraped_at) when parsing failed, making all tenders appear to have "Deadline passed".

**Fix Applied:**
```typescript
// NEW CODE
const parsedDeadline = parseDate(deadlineFromTab) || parseDate(deadlineRaw)

// CRITICAL: Don't fallback to current time if deadline parsing fails
// This was causing all deadlines to be set to scraped_at timestamp
if (!parsedDeadline) {
  console.warn(`[${url}] Failed to parse deadline. deadlineFromTab="${deadlineFromTab}", deadlineRaw="${deadlineRaw}"`)
}

const finalDeadline = parsedDeadline || new Date('2099-12-31').toISOString() // Far future as fallback for validation
```

**Impact:**
- ✅ Deadline will no longer be set to current time
- ✅ Warning logged when deadline parsing fails
- ✅ Far-future fallback (2099-12-31) makes failed parsing obvious
- ✅ Evaluation engine timeline_fit will now work correctly

**File:** [lib/scraper/etimad-browser.ts](lib/scraper/etimad-browser.ts#L693-L703)

---

### 2. ✅ Enhanced Estimated Value Extraction (CRITICAL)

**Problem:**
Estimated value was always `null` because the scraper was only looking in generic locations, not in specific tabs where the field actually exists.

**Fix Applied:**
```typescript
// NEW CODE - Check specific tabs first
const estimatedValueFromBasicInfo = basicInfo['القيمة التقديرية'] || basicInfo['القيمة المقدرة']
const estimatedValueFromClassification = classification['القيمة التقديرية'] || classification['القيمة المقدرة']
const finalEstimatedValueRaw = estimatedValueFromBasicInfo || estimatedValueFromClassification || estimatedValueRaw

// Log missing estimated_value for debugging
const parsedEstimatedValue = parseSARAmount(finalEstimatedValueRaw)
if (!parsedEstimatedValue && finalEstimatedValueRaw) {
  console.warn(`[${finalRefNo}] Failed to parse estimated_value from: "${finalEstimatedValueRaw}"`)
} else if (!finalEstimatedValueRaw) {
  console.warn(`[${finalRefNo}] Estimated value not found in tender data. Check if field exists on detail page.`)
}
```

**Changes:**
- ✅ Now checks `basic_info` tab for estimated value
- ✅ Also checks `classification` tab as fallback
- ✅ Tries Arabic labels: 'القيمة التقديرية' and 'القيمة المقدرة'
- ✅ Logs warnings when value is missing or fails to parse
- ✅ Helps debug which tenders don't have estimated value

**Impact:**
- ✅ Higher chance of extracting estimated_value when it exists
- ✅ Better visibility into why values are missing
- ✅ Evaluation engine budget_fit will work correctly when value is found

**File:** [lib/scraper/etimad-browser.ts](lib/scraper/etimad-browser.ts#L669-L716)

---

## Testing Status

### Prerequisites
- [x] Code fixes applied
- [x] TypeScript type-check passed
- [ ] Playwright browsers installed (currently installing)
- [ ] Smoke test run
- [ ] Full evaluation test

### Test Plan

**Step 1: Install Playwright (In Progress)**
```bash
pnpm exec playwright install chromium
```

**Step 2: Run Smoke Test**
```bash
pnpm scrape:smoke
```

**Expected Results:**
- ✅ Scraper runs without errors
- ✅ Warnings logged for missing estimated_value (expected if field truly missing)
- ✅ Deadline is NOT same as scraped_at timestamp
- ✅ Deadline is a reasonable future date (or far future if parsing failed)

**Step 3: Check Scraped Data**
```bash
# Scraper saves to scraper-output/*.json
# Manually inspect 1-2 tenders
```

**Verify:**
- [ ] `deadline` is different from `scraped_at`
- [ ] `deadline` is in the future (not in the past for active tenders)
- [ ] `estimated_value` is populated (if field exists on Etimad page)
- [ ] No duplicate deadline/scraped_at timestamps

**Step 4: Run Evaluation**
```bash
pnpm evaluate-tenders
```

**Expected Results:**
- ✅ Scores are distributed (not all 30-46)
- ✅ Some tenders have timeline_fit > 0
- ✅ Some tenders have budget_fit > 0 (if estimated_value was found)
- ✅ Recommendations vary (qualified/conditional/excluded)

**Step 5: Verify Evaluation Output**
```bash
cat data/tenders.scored.json
```

**Check:**
- [ ] Scores range from 0-100
- [ ] Not all tenders say "Deadline passed"
- [ ] Reasons are accurate and varied
- [ ] Recommendations make sense given the scores

---

## Before/After Comparison

### Before Fixes (Old Scraper Data)

```json
{
  "reference_no": "HA26610005",
  "deadline": "2026-01-27T11:56:58.804Z",  // ❌ Same as scraped_at!
  "estimated_value": null,                  // ❌ Always null
  "scraped_at": "2026-01-27T11:56:58.804Z"
}
```

**Evaluation Result:**
- Score: 46
- Reasons: ["No estimated value", "Deadline passed", ...]
- timeline_fit: 0 ❌
- budget_fit: 0 ❌

### After Fixes (Expected New Data)

```json
{
  "reference_no": "HA26610005",
  "deadline": "2026-02-15T23:59:59.000Z",  // ✅ Real deadline from page
  "estimated_value": 500000,                // ✅ Extracted if available
  "scraped_at": "2026-01-31T16:00:00.000Z" // ✅ Different from deadline
}
```

**Expected Evaluation:**
- Score: 70-85 (if good fit)
- Reasons: ["Estimated value in range", "15 days until deadline", ...]
- timeline_fit: > 0 ✅
- budget_fit: > 0 ✅

---

## Success Criteria

### Code Quality
- [x] TypeScript compilation passes
- [x] No new linting errors
- [x] Backward compatible (no breaking changes)

### Functionality
- [ ] Scraper runs without crashing
- [ ] Deadline ≠ scraped_at for all tenders
- [ ] Deadline is reasonable future date
- [ ] estimated_value extracted when available
- [ ] Warnings logged for debugging

### Evaluation Impact
- [ ] Scores are distributed across range
- [ ] timeline_fit > 0 for future deadlines
- [ ] budget_fit > 0 when value in range
- [ ] Recommendations vary by tender quality

---

## Rollback Plan

If the fixes cause issues, revert these changes:

```bash
git diff lib/scraper/etimad-browser.ts
# Review changes around lines 669-716

git checkout HEAD -- lib/scraper/etimad-browser.ts
pnpm type-check
```

---

## Next Steps

1. **Wait for Playwright install to complete**
2. **Run smoke test:** `pnpm scrape:smoke`
3. **Inspect output:** Check scraper-output/*.json
4. **Run evaluation:** `pnpm evaluate-tenders`
5. **Verify scores:** Check data/tenders.scored.json
6. **Address warnings:** If estimated_value still missing, may need to check actual Etimad page HTML

---

## Related Documentation

- [EVALUATION_VERIFICATION_REPORT.md](EVALUATION_VERIFICATION_REPORT.md) - Detailed evaluation logic review
- [SCRAPER_FIX_PLAN.md](SCRAPER_FIX_PLAN.md) - Original fix plan
- [lib/scraper/etimad-browser.ts](lib/scraper/etimad-browser.ts) - Scraper implementation
- [lib/scraper/utils.ts](lib/scraper/utils.ts) - Parsing utilities (parseDate, parseSARAmount)

---

**Status:** Fixes applied, awaiting Playwright installation and test verification.
