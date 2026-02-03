# Enhanced Cursor AI Agent Workflow - Implementation Protocol v2.0

Structured, quality-first implementation with research, testing, and validation at subtask, phase, and project levels.

---

## Subtask workflow (each subtask)

### Phase 1: Research & planning
- Parse requirements; define acceptance criteria (or create if missing); document ambiguities/assumptions.
- **Gather context**: MCPs for official docs, similar code, codebase; git history if relevant.
- **Resources**: Identify skills (`.cursor/skills/`), MCPs, subagents (Explorer, Bash, Browser, verifier, debugger, test-runner, security-auditor).

### Phase 2: Implementation
- Use MCPs, skills, subagents; follow best practices; clean, documented code; TDD when applicable; parallelize independent work.

### Phase 3: Quality assurance
- **Automated testing**: Run relevant test suites; test-runner subagent for coverage; all tests pass before proceeding.
- **Code & logic review**: Verifier for independent validation; security-auditor for auth/payments/data; debugger if issues found. Verify code quality and functional quality; check against acceptance criteria.
- **Corrections**: Fix gaps systematically; re-implement if needed; iterate until verifier confirms.
- **Final validation**: Agent Review on changes; confirm acceptance criteria; verify no regressions.

### Phase 4: Delivery
- Concise summary; proof of quality (reviews/tests); key decisions; no lengthy reports unless requested.

---

## Phase completion checkpoint (when all subtasks in a phase are done)

1. **Comprehensive phase review**: Full code review across phase; full logic review; architecture validation; Mermaid diagrams if helpful.
2. **End-to-end testing**: Integration between subtasks; E2E for phase workflows; full regression.
3. **Performance & quality**: Performance validation; security review if applicable; documentation check.
4. **Gate check**: All phase/subtask acceptance criteria met; verifier sign-off; **PASS** → next phase, **FAIL** → address, **CONDITIONAL** → document risks and get approval.

---

## Project completion protocol (when all phases are done)

1. **System-wide validation**: Full integration testing; full regression suite; UAT prep if applicable.
2. **Code & architecture review**: Cross-phase consistency; architecture assessment; security & compliance audit.
3. **Performance & scalability**: Benchmarks; scaling review; document characteristics.
4. **Documentation**: Full implementation report; save to `docs/reports/implementations/[project-name]-[date].md`; runbook (deployment, rollback, monitoring).
5. **Final validation**: Stakeholder review; production readiness checklist; team handoff.

---

## Quick reference checklists

**Per subtask:** Read request → acceptance criteria → MCPs/skills/subagents → implement → run tests → verifier review → fix gaps → Agent Review → final validation → concise feedback.

**Per phase:** All subtasks validated → full code/logic review → architecture → integration + E2E + regression → performance/security → docs → verifier sign-off → gate passed.

**Project end:** System integration + full regression → cross-phase review → architecture + security + performance → report + runbook → production checklist → stakeholder sign-off.

---

## Principles

- **Quality**: Never skip reviews; verifier for unbiased checks; tests mandatory; Agent Review before merge.
- **Context**: MCP-first; learn from similar implementations; apply research consistently.
- **Efficiency**: Right tool (skills vs subagents); parallelize when possible; use debugger, test-runner, verifier, security-auditor appropriately.
- **Communication**: Concise by default; evidence-based; document decisions and technical debt.
- **Improvement**: Validate against acceptance criteria at every checkpoint; fix immediately; iterate.

---

## Tool & agent reference

| Tool / subagent   | Use for                          |
|------------------|----------------------------------|
| Agent Review     | Catch bugs in diffs before merge |
| Explorer         | Codebase search & analysis      |
| Bash             | Commands, tests, git             |
| Browser          | UI testing & validation          |
| Verifier         | Independent validation           |
| Debugger         | Root cause analysis              |
| Test-runner      | Proactive test execution         |
| Security-auditor | Auth, payments, sensitive data  |

---

## File structure

```
project-root/
├── .cursor/
│   ├── agents/           # Custom subagents (verifier, debugger, etc.)
│   └── rules/            # implementation-protocol.mdc
├── docs/
│   └── reports/
│       └── implementations/   # Final reports
└── WORKFLOW.md           # This file
```

---

## Usage

- **Activate**: "Follow the Implementation Protocol v2.0 for this task: [describe task]"
- **With criteria**: "Follow Implementation Protocol v2.0 with these acceptance criteria: 1. … 2. …"
- **Detailed report**: "Follow Implementation Protocol v2.0 and provide a detailed implementation report"
- **Multi-phase**: "Follow Implementation Protocol v2.0 for [Phase Name]. After completion, wait for approval before next phase."

---

## Troubleshooting

| Issue                  | Solution                                                                 |
|------------------------|--------------------------------------------------------------------------|
| Subagents not available | Enable Max Mode or check `.cursor/agents/`                               |
| Agent Review not running | Cursor Settings → Agent Review                                          |
| Skills not detected     | Verify `.cursor/skills/` has SKILL.md files                              |
| Phase gate keeps failing | Strengthen acceptance criteria; add more specific tests                |
| Reports too verbose     | Say "provide concise summary only"                                      |

Version: v2.0. Full protocol; see also `.cursor/rules/implementation-protocol.mdc` and `docs/CURSOR-GLOBAL-RULE-IMPLEMENTATION-PROTOCOL.md`.
