# Implementation Protocol v2.0

Follow this workflow for the user's implementation task (feature, refactor, or fix). Skip only if they ask for a one-off or quick fix.

---

## Per subtask (repeat for each subtask)

1. **Research & planning**  
   Parse requirements; define or use acceptance criteria; gather context via MCPs (docs, similar code, codebase); identify skills, MCPs, subagents (Explorer, Bash, Browser, verifier, debugger, test-runner, security-auditor as needed).

2. **Implementation**  
   Use MCPs/skills/subagents; follow best practices; write clean, documented code; TDD when applicable; parallelize independent work.

3. **Quality assurance**  
   Run relevant test suites; use verifier for independent validation; security-auditor for auth/payments/data; debugger if issues found; verify code quality and functional correctness; check against acceptance criteria; fix gaps; run Agent Review on changes; final validation.

4. **Delivery**  
   Concise summary; proof of quality (reviews/tests); key decisions; no long reports unless requested.

---

## Phase completion (when all subtasks in a phase are done)

- Full code and logic review across the phase; architecture validation; integration + E2E + regression testing; performance and security checks if applicable; docs updated; verifier sign-off; gate check (PASS/FAIL/CONDITIONAL) before next phase.

---

## Project completion (when all phases are done)

- System-wide integration and full regression; cross-phase code review and architecture assessment; security/compliance and performance validation; implementation report in `docs/reports/implementations/[project-name]-[date].md`; runbook if applicable; production readiness checklist; stakeholder handoff as needed.

---

## Principles

- Never skip reviews; use verifier for unbiased checks; tests are mandatory.
- MCP-first: gather official docs and context before implementing.
- Right tool: skills for single-purpose, subagents for complex work; parallelize when possible.
- Concise by default; evidence-based (proof of passing reviews/tests); document decisions and debt.
- Validate against acceptance criteria at every checkpoint; fix issues immediately.

---

**Reference:** `WORKFLOW.md` (project root), `.cursor/rules/implementation-protocol.mdc`
