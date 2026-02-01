# Quality Protocol

## Required workflow

1) Plan split using subagent-advisor  
2) Implement  
3) Verify using verifier  
4) Review using code-reviewer  

## Required verification gates before calling a step Done

- pnpm type-check  
- pnpm verify:phase-1  
- pnpm verify:phase-2  

## Evidence rule

When reporting completion, include:

- the command list that was run  
- the exit status summary  
- the output artifact paths that were produced  
