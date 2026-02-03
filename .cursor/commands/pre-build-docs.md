# Pre-build docs

Use the **pre-build-docs** subagent to produce all required planning documentation and save it to the project.

- Gather scope (feature name, goals, constraints).
- Produce PRD, implementation plan, specs, acceptance criteria, architecture/runbook as needed.
- **Save every document** to `docs/`, `docs/<feature>/`, or `docs/reports/` following project layout.
- Return a list of created files and a one-line next step.

Documentation only—no code. Create and write markdown (and JSON for plans if the project uses it).
