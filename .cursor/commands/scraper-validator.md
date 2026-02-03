# Scraper validator

Use the **scraper-validator** subagent to validate scraper or browser-automation output.

- Determine what to validate (latest run, output file, sync result) and expected schema (from `types/`, `docs/`).
- Check structure, required fields, content quality, and pipeline health.
- Report: overall pass/fail, checks list, issues by severity, and next steps.

Validation only—no code changes. Use project types and docs as source of truth.
