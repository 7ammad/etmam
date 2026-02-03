# Cursor Subagents — Reference

Quick reference for what subagents are, when to use them, and the most useful types. Sourced from [Cursor docs](https://cursor.com/docs/context/subagents) and project best practices.

---

## What Subagents Are

- **Specialized AI assistants** the main Agent can delegate to. Each runs in its **own context window**, does a specific kind of work, and returns a result to the parent.
- **Use them to:** break down complex tasks, run work in parallel, and keep the main chat focused (long/noisy work stays in the subagent).

### How they work

- Agent sees a complex task → can **launch a subagent** with a prompt + context.
- Subagent runs **autonomously** (no prior chat history; parent sends what’s needed).
- Subagent finishes → returns a **final message** to the parent.

### Foreground vs background

| Mode       | Behavior                                      | Best for                                      |
|-----------|------------------------------------------------|-----------------------------------------------|
| Foreground | Blocks until subagent completes; returns result | Sequential work where you need the output     |
| Background | Returns immediately; subagent keeps running    | Long-running or parallel workstreams         |

---

## Built-in Subagents (no config)

Cursor provides three; Agent uses them automatically when it makes sense:

| Subagent | Purpose                         | Why it’s a subagent |
|----------|---------------------------------|----------------------|
| **Explore** | Search and analyze codebase     | Exploration produces lots of intermediate output; uses a faster model and can run many parallel searches. |
| **Bash**    | Run sequences of shell commands | Command output is verbose; isolating it keeps the parent focused. |
| **Browser** | Control browser via MCP         | DOM snapshots and screenshots are noisy; subagent filters to relevant results. |

---

## When to Use Subagents vs Skills

| Prefer **subagents** when…              | Prefer **skills** when…                 |
|----------------------------------------|-----------------------------------------|
| You need **context isolation** (long research) | Task is **single-purpose** (changelog, format) |
| You want **parallel workstreams**      | You want a **quick, repeatable** action  |
| Task needs **specialized expertise** over many steps | Task **finishes in one shot**           |
| You want **independent verification** of work | You don’t need a separate context window |

Simple, one-shot tasks (e.g. “generate changelog”, “format imports”) → use a **skill**, not a subagent.

---

## Most Useful Subagent Types (custom)

These are the **highest-value patterns** for custom subagents across projects. Create them as `.cursor/agents/<name>.md` (or `~/.cursor/agents/` for user-wide).

### 1. Verifier

- **Purpose:** Check that completed work actually works.
- **Use for:** Phase sign-off, test runs, implementation validation, DB/script checks.
- **Pattern:** Skeptical validator; runs checks and reports pass/fail and gaps.
- **Model:** `fast` — quick, repeatable verification.

### 2. Code reviewer

- **Purpose:** Deep review of changes (PR, patch, refactor).
- **Use for:** PR reviews, quality audits, security/performance/maintainability.
- **Pattern:** Structured review (context → high-level → line-by-line); severity and recommendations.
- **Model:** `inherit` — needs full code and product context.

### 3. Debugger

- **Purpose:** Find root cause of bugs or test failures.
- **Use for:** Error investigation, test failure diagnosis, systematic evidence gathering.
- **Pattern:** Hypothesis → evidence → fix suggestions.
- **Model:** `fast` — focused, investigative.

### 4. Test runner

- **Purpose:** Run tests and interpret results.
- **Use for:** Running suites, analyzing failures, coverage checks.
- **Pattern:** Execute → summarize failures → suggest next steps.
- **Model:** `fast` — execution-heavy.

### 5. Security auditor

- **Purpose:** Security-focused review (auth, data, APIs).
- **Use for:** Auth flows, sensitive data handling, dependency/configuration risks.
- **Pattern:** Security checklist; severity and remediation.
- **Model:** `inherit` — needs full context.

### 6. Brainstorming / idea validator

- **Purpose:** Ideation and pre-implementation validation.
- **Use for:** New project ideas, validating concepts, reviewing plans/roadmaps before build.
- **Pattern:** Brainstorm → validate → review plans; no implementation.
- **Model:** `inherit` — needs full conversation and goals.

### 7. Explorer (custom)

- **Purpose:** Deep, targeted codebase or doc research.
- **Use for:** “Understand how X works”, “find all usages of Y”, multi-file analysis.
- **Pattern:** Searches + synthesis; returns summarized findings, not raw dumps.
- **Model:** `fast` — many searches, cheaper model.

### 8. Scraper / browser automation validator

- **Purpose:** Validate scraper or browser-automation output.
- **Use for:** Checking extraction quality, pipeline health, E2E-style checks.
- **Pattern:** Run or review runs → validate structure/content → report issues.
- **Model:** `fast` — output can be noisy; isolate in subagent.

---

## Best practices (custom subagents)

- **DO**
  - One clear responsibility per subagent.
  - Short, specific **description** (so Agent knows when to delegate).
  - `model: fast` for verification/analysis/runner tasks; `model: inherit` for review/context-heavy tasks.
  - Consider **background** for long-running or parallel work.
- **DON’T**
  - Use subagents for trivial, one-shot tasks (use skills).
  - Create vague or overlapping subagents.
  - Proliferate many subagents (e.g. keep to ~5–7 total that you actually use).

---

## Performance and cost

- Each subagent has **its own context** and token usage; e.g. 5 in parallel ≈ 5× tokens.
- Subagents add **startup overhead**; for very simple tasks the main Agent can be faster.
- Use subagents for **complex, long, or parallel** work; use the main Agent or skills for quick, simple steps.

---

## Where to define them

- **Project:** `.cursor/agents/*.md` (e.g. `verifier.md`, `code-reviewer.md`, `brainstorming.md`).
- **User-wide:** `~/.cursor/agents/*.md`.

Agent picks up all custom subagents from these locations and can delegate to them when the task matches their description.
