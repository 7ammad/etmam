# Add Implementation Protocol v2.0 to Global User Rules

Use this so the agent follows the **Enhanced Cursor AI Agent Workflow - Implementation Protocol v2.0** automatically in **all projects**, without asking every time.

## How to add it (global)

1. Open **Cursor Settings** (Ctrl+, or File → Preferences → Cursor Settings).
2. Go to **Rules** → **User Rules** (or **Cursor Settings** → **Rules**).
3. Paste the block below into the **User Rules** text area. You can append it after your existing rules.
4. Save. The rule applies in every Cursor workspace.

---

## Block to paste into User Rules

Copy the entire markdown block below (between the triple backticks).

```markdown
---
# Implementation Protocol v2.0 (apply to implementation tasks)
---

## When to apply
For any implementation task (features, refactors, fixes): follow this protocol unless the user asks for a one-off or quick fix.

## Subtask workflow (each subtask)
1. **Research & planning**: Parse requirements; define or use acceptance criteria; gather context via MCPs (official docs, similar code, codebase); identify relevant skills, MCPs, subagents (Explorer, Bash, Browser, verifier, debugger, test-runner, security-auditor as needed).
2. **Implementation**: Use MCPs/skills/subagents; follow best practices; write clean, documented code; TDD when applicable; parallelize independent work.
3. **Quality assurance**: Run relevant test suites; use verifier for independent validation; security-auditor for auth/payments/data; debugger if issues found; verify code quality and functional correctness; check against acceptance criteria; fix gaps; run Agent Review on changes; final validation.
4. **Delivery**: Concise summary; proof of quality (reviews/tests); key decisions; no long reports unless requested.

## Phase completion (when all subtasks in a phase are done)
- Full code and logic review across the phase; architecture validation; integration + E2E + regression testing; performance and security checks if applicable; docs updated; verifier sign-off; gate check (PASS/FAIL/CONDITIONAL) before next phase.

## Project completion (when all phases are done)
- System-wide integration and full regression; cross-phase code review and architecture assessment; security/compliance and performance validation; implementation report in docs/reports/implementations/[project-name]-[date].md; runbook if applicable; production readiness checklist; stakeholder handoff as needed.

## Principles
- Never skip reviews; use verifier for unbiased checks; tests are mandatory.
- MCP-first: gather official docs and context before implementing.
- Use the right tool (skills for single-purpose, subagents for complex work); parallelize when possible.
- Concise by default; evidence-based (proof of passing reviews/tests); document decisions and debt.
- Validate against acceptance criteria at every checkpoint; fix issues immediately.
```

---

## Optional: project-only (this repo)

If you prefer the protocol to apply **only in this project**, do not paste into User Rules. Instead use the project rule already added at `.cursor/rules/implementation-protocol.mdc` (alwaysApply: true). For **global** use, paste the block above into User Rules and you can keep or remove the project rule.

## Full reference

The full workflow (checklists, tool reference, troubleshooting) is in the project root: **WORKFLOW.md**.
