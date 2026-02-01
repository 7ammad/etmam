# Scraper Data Quality Fix Plan

**Priority:** CRITICAL - Blocks effective use of evaluation engine
**Created:** 2026-01-31
**Status:** Pending Implementation

---

## Issues to Fix

### 1. Deadline Extraction (CRITICAL)

**Current Problem:**
```typescript
// Scraper is doing this:
deadline: scraped_at  // ❌ Wrong!

// Should be doing this:
deadline: parseDeadlineFromPage()  // ✅ Correct
```

**Evidence:**
All tenders have identical deadline and scraped_at timestamps:
```json
{
  "deadline": "2026-01-27T11:56:58.804Z",
  "scraped_at": "2026-01-27T11:56:58.804Z"  // Same!
}
```

**Fix Location:**
- File: `lib/scraper/etimad-browser.ts` or detail page scraper
- Look for deadline extraction logic
- Check Arabic label matching for deadline field

**Arabic Labels to Look For:**
From `types/scraper.ts`:
```typescript
arabicLabels: {
  deadline: string[]  // Look for these labels
}
```

**Fix Steps:**
1. Find where deadline is extracted from detail page
2. Ensure it's not falling back to `new Date()` or `scraped_at`
3. Parse the Arabic date string correctly
4. Convert to ISO format
5. Validate the parsed date is reasonable (not in distant past/future)

**Test:**
After fix, verify:
- Deadline is different from scraped_at
- Deadline is in the future for active tenders
- Deadline matches what's shown on the Etimad portal

---

### 2. Estimated Value Extraction (CRITICAL)

**Current Problem:**
All tenders have `estimated_value: null`

**Expected Field:**
```typescript
estimated_value: z.number().nullable().optional()
```

**Fix Location:**
- File: `lib/scraper/etimad-browser.ts` (detail page)
- Arabic labels config in selectors

**Arabic Labels to Look For:**
```typescript
arabicLabels: {
  estimatedValue: string[]  // e.g., ["القيمة التقديرية", "القيمة المتوقعة"]
}
```

**Fix Steps:**
1. Verify the label name for estimated value in Arabic
2. Check if field exists on detail page (might be on a specific tab)
3. Parse the numeric value correctly (handle commas, currency symbols)
4. Convert to number (SAR)
5. Set to null if truly not present (don't default to 0)

**Test:**
After fix, verify:
- Some tenders have estimated_value populated
- Values are reasonable (positive numbers in SAR)
- Null is only used when value is truly missing

---

### 3. Data Validation (RECOMMENDED)

**Add validation after scraping:**

```typescript
function validateScrapedTender(tender: ScrapedTender): ValidationResult {
  const warnings: string[] = []

  // Deadline sanity check
  const deadline = new Date(tender.deadline)
  const scraped = new Date(tender.scraped_at)
  if (Math.abs(deadline.getTime() - scraped.getTime()) < 60000) {
    warnings.push('Deadline too close to scrape time (possible extraction error)')
  }

  // Estimated value check
  if (tender.estimated_value === null) {
    warnings.push('Estimated value missing')
  } else if (tender.estimated_value < 1000) {
    warnings.push('Estimated value suspiciously low')
  } else if (tender.estimated_value > 1000000000) {
    warnings.push('Estimated value suspiciously high (>1B SAR)')
  }

  // Booklet price check
  if (tender.booklet_price && tender.booklet_price > 200000) {
    warnings.push('Booklet price suspiciously high (>200K SAR)')
  }

  return { valid: warnings.length === 0, warnings }
}
```

**Add to scraper output:**
```json
{
  "metadata": {
    "validation_warnings": [
      "HA26610005: Deadline too close to scrape time",
      "046847: Estimated value missing"
    ]
  }
}
```

---

## Testing Plan

### Test 1: Spot Check
1. Run scraper on 1-2 tenders
2. Manually compare scraped data to Etimad portal
3. Verify deadline and estimated_value match

### Test 2: Validation
1. Run `pnpm review:scraped` after fix
2. Check for validation warnings
3. Inspect tenders with warnings

### Test 3: Evaluation
1. Run `pnpm evaluate-tenders`
2. Verify scores are distributed (not all 30-46)
3. Check that timeline_fit and budget_fit are non-zero

### Test 4: Type Safety
1. Run `pnpm type-check`
2. Should pass with no errors

---

## Implementation Order

1. **Fix deadline extraction** (30 min)
   - Highest impact on scoring
   - Easiest to verify

2. **Fix estimated_value extraction** (30 min)
   - Second highest impact
   - May need to find the right tab/section

3. **Add validation warnings** (15 min)
   - Helps catch future issues
   - Low effort, high value

4. **Test and verify** (30 min)
   - Run all verification scripts
   - Spot check against portal

**Total Estimated Time:** ~2 hours

---

## Success Criteria

✅ Deadline is parsed from tender page (not scraped_at)
✅ Estimated value is extracted when available
✅ Scores are distributed (not all clustered 30-46)
✅ Timeline_fit > 0 for future deadlines
✅ Budget_fit > 0 when value is in range
✅ All verification scripts pass
✅ Manual spot check confirms accuracy

---

## Related Files

- [EVALUATION_VERIFICATION_REPORT.md](EVALUATION_VERIFICATION_REPORT.md) - Detailed findings
- lib/scraper/etimad-browser.ts - Scraper implementation
- lib/scraper/config.ts - Selectors and labels
- types/scraper.ts - Schema definition
- scripts/review-scraped-data.ts - Data quality checker
