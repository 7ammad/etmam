# Fix-Issue: EV Fix – Commit & PR Steps

## 1. Commit

Use a conventional commit that references the fix (add `Fixes #N` in body if you have a GitHub issue):

```text
fix(ev): normalize halala to SAR and single canonical EV pipeline

- Add lib/currency.ts: toSar, normalizeToSar, normalizeTenderMoneyFields
- Sync API and calibrate script normalize money fields at boundary
- Add getEffectiveEstimatedValueSar; use before rule and AI scoring
- AI fallback receives effectiveValueSar in prompt; never sets EV
- Calibration loader in classifier (data/calibration-result.json)
- UI: Estimated/Provided badges on list and detail
- Script: verify-currency-normalization.ts; docs: EV_FIX_100X_CURRENCY.md

Fixes #<ISSUE_NUMBER>   # optional – replace with your issue number
```

PowerShell (no `&&`):

```powershell
git add -A
git status
git commit -m "fix(ev): normalize halala to SAR and single canonical EV pipeline" -m "- Add lib/currency.ts: toSar, normalizeToSar, normalizeTenderMoneyFields
- Sync API and calibrate script normalize money fields at boundary
- Add getEffectiveEstimatedValueSar; use before rule and AI scoring
- AI fallback receives effectiveValueSar in prompt; never sets EV
- Calibration loader in classifier (data/calibration-result.json)
- UI: Estimated/Provided badges on list and detail
- Script: verify-currency-normalization.ts; docs: EV_FIX_100X_CURRENCY.md"
```

## 2. Push & open PR

```powershell
git push origin HEAD
```

Then open a PR (e.g. `gh pr create` if you use GitHub CLI, or use the GitHub UI). In the PR description include:

- **Title**: `fix(ev): Normalize halala to SAR and single canonical EV pipeline`
- **Summary**: One canonical EV in SAR everywhere; 100× bug fixed at ingest; AI does not set EV.
- **Verification**: `pnpm type-check`, `pnpm verify:phase-1`, `pnpm verify:phase-2`, and `scripts/verify-currency-normalization.ts` (see `docs/EV_FIX_100X_CURRENCY.md`).
- **Note**: Existing DB rows synced before this fix may still have halala-as-SAR; re-sync or backfill to correct (see same doc).

If you have an issue number, add `Fixes #N` in the PR description so the issue closes on merge.
