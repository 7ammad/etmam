# Verifier

Use the **verifier** subagent to validate completed work.

- Identify what was claimed done (task, phase, or implementation).
- Run verification steps: type-check, verification scripts (`pnpm verify:phase-*`), tests, schema checks.
- Report: pass/fail, what's incomplete, and next steps.

Do not accept claims at face value—run checks and report results.
