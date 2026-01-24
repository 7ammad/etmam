---
name: skills-sh
description: Browse, search, and install skills from skills.sh directory. Use when the user wants to discover agent skills, install skills from skills.sh, search for relevant skills, or learn about the skills.sh ecosystem.
---

# Skills.sh Directory Helper

Helps discover, browse, and install skills from [skills.sh](https://skills.sh/) - the open agent skills ecosystem.

## Quick Reference

**Install a skill:**
```bash
npx skills add <owner/repo>
```

**Example:**
```bash
npx skills add vercel-labs/agent-skills
```

## When to Use This Skill

Use this skill when:
- User asks about skills.sh or wants to browse available skills
- User wants to install a skill from skills.sh
- User needs help finding relevant skills for their project
- User wants to understand the skills.sh ecosystem
- User mentions "skills directory", "agent skills", or "skills.sh"

## Skills.sh Overview

Skills.sh is a directory of reusable capabilities for AI agents. Skills can be installed with a single command and enhance agents with procedural knowledge.

### Key Features
- **10,000+ skills** available across multiple categories
- **One-command installation**: `npx skills add <owner/repo>`
- **Cross-agent support**: Works with Cursor, Claude Code, GitHub Copilot, and more
- **Leaderboard**: Track popular and trending skills

## Finding Skills

### By Category

**Frontend & Design:**
- `vercel-labs/agent-skills` - React best practices, web design guidelines
- `expo/skills` - React Native and Expo skills
- `hyf0/vue-skills` - Vue.js best practices
- `onmax/nuxt-skills` - Nuxt.js skills

**Backend & Database:**
- `supabase/agent-skills` - Supabase and PostgreSQL best practices
- `wshobson/agents` - API design, PostgreSQL, Node.js patterns
- `stripe/ai` - Stripe integration skills

**Development Workflow:**
- `obra/superpowers` - Planning, debugging, code review workflows
- `softaworks/agent-toolkit` - Daily workflows, testing, CI/CD

**Content & Marketing:**
- `coreyhaines31/marketingskills` - SEO, copywriting, marketing strategies
- `anthropics/skills` - PDF, DOCX, PPTX processing

**Testing & Quality:**
- `anthropics/skills` - Webapp testing
- `wshobson/agents` - E2E testing patterns

### Popular Skills (Top 10)

1. `vercel-labs/agent-skills/vercel-react-best-practices` (37.8K installs)
2. `vercel-labs/agent-skills/web-design-guidelines` (28.7K installs)
3. `remotion-dev/skills/remotion-best-practices` (19.0K installs)
4. `anthropics/skills/frontend-design` (7.6K installs)
5. `anthropics/skills/skill-creator` (3.8K installs)
6. `expo/skills/building-native-ui` (2.8K installs)
7. `vercel-labs/agent-browser/agent-browser` (2.7K installs)
8. `better-auth/skills/better-auth-best-practices` (2.3K installs)
9. `coreyhaines31/marketingskills/seo-audit` (2.3K installs)
10. `squirrelscan/skills/audit-website` (2.3K installs)

## Installation Workflow

### Step 1: Identify the Skill

When user wants a skill:
1. Search skills.sh website or use the leaderboard
2. Identify the skill's owner/repo format: `<owner>/<repo>` or `<owner>/<repo>/<skill-name>`
3. Verify it's compatible with Cursor

### Step 2: Install the Skill

**For a specific skill:**
```bash
npx skills add <owner/repo>/<skill-name>
```

**For an entire repo (multiple skills):**
```bash
npx skills add <owner/repo>
```

**Examples:**
```bash
# Install specific skill
npx skills add vercel-labs/agent-skills/vercel-react-best-practices

# Install entire repo
npx skills add vercel-labs/agent-skills
```

### Step 3: Verify Installation

After installation:
- Check if skill files appear in `.cursor/skills/` or project directory
- Verify skill metadata (name, description) is correct
- Test skill by referencing it in Cursor chat

## Skill Discovery Strategies

### By Project Type

**Next.js Projects:**
- `vercel-labs/agent-skills/vercel-react-best-practices`
- `wshobson/agents/nextjs-app-router-patterns`
- `langgenius/dify/vercel-react-best-practices`

**React Native Projects:**
- `expo/skills/building-native-ui`
- `expo/skills/native-data-fetching`
- `callstackincubator/agent-skills/react-native-best-practices`

**Vue/Nuxt Projects:**
- `hyf0/vue-skills/vue-best-practices`
- `onmax/nuxt-skills/nuxt`
- `hyf0/vue-skills/pinia-best-practices`

**Database Projects:**
- `supabase/agent-skills/supabase-postgres-best-practices`
- `wshobson/agents/postgresql-table-design`
- `wshobson/agents/sql-optimization-patterns`

**Testing Projects:**
- `anthropics/skills/webapp-testing`
- `wshobson/agents/e2e-testing-patterns`
- `wshobson/agents/javascript-testing-patterns`

### By Task Type

**Planning & Organization:**
- `obra/superpowers/writing-plans`
- `obra/superpowers/executing-plans`
- `othmanadi/planning-with-files/planning-with-files`

**Code Review:**
- `obra/superpowers/requesting-code-review`
- `obra/superpowers/receiving-code-review`
- `wshobson/agents/code-review-excellence`

**Debugging:**
- `obra/superpowers/systematic-debugging`
- `wshobson/agents/debugging-strategies`

**Documentation:**
- `anthropics/skills/doc-coauthoring`
- `softaworks/agent-toolkit/crafting-effective-readmes`

## Integration with Cursor

### Skill Storage Locations

Skills installed via `npx skills add` may be stored in:
- Project: `.cursor/skills/` or `.cursor/rules/`
- Personal: `~/.cursor/skills/`

### Using Installed Skills

Reference skills in Cursor chat:
```
@skill-name Help me with [task]
```

Or mention them in code comments:
```typescript
// @skill-name: Following best practices
```

## Common Use Cases

### Finding Skills for Current Project

When user asks "what skills should I use?":
1. Analyze project tech stack (Next.js, React Native, Vue, etc.)
2. Identify project needs (testing, design, database, etc.)
3. Recommend 3-5 relevant skills from skills.sh
4. Provide installation commands

### Installing Multiple Related Skills

For comprehensive coverage:
```bash
# Frontend development
npx skills add vercel-labs/agent-skills
npx skills add wshobson/agents

# Testing
npx skills add anthropics/skills/webapp-testing
npx skills add wshobson/agents/e2e-testing-patterns

# Database
npx skills add supabase/agent-skills
```

### Updating Skills

Skills are typically versioned via their GitHub repos. To update:
1. Check repo for latest version
2. Re-run `npx skills add <owner/repo>`
3. Or manually update files in `.cursor/skills/`

## Troubleshooting

### Skill Not Found
- Verify owner/repo name is correct
- Check skills.sh website for exact path
- Ensure repo is public and contains skill files

### Installation Fails
- Check Node.js version (18+ recommended)
- Verify network connection
- Try installing without `npx`: `npm install -g skills` then `skills add <owner/repo>`

### Skill Not Working
- Verify skill files are in correct location
- Check skill metadata (name, description) format
- Ensure Cursor can access skill directory

## Resources

- **Website**: https://skills.sh/
- **Trending Skills**: https://skills.sh/trending
- **All Skills**: https://skills.sh/ (browse leaderboard)
- **Documentation**: Check individual skill repos for usage

## Examples

**Example 1: User wants React best practices**
```
Recommend: vercel-labs/agent-skills/vercel-react-best-practices
Install: npx skills add vercel-labs/agent-skills/vercel-react-best-practices
```

**Example 2: User wants to improve code reviews**
```
Recommend: obra/superpowers/requesting-code-review
Install: npx skills add obra/superpowers/requesting-code-review
```

**Example 3: User building Next.js + Supabase app**
```
Recommend:
1. vercel-labs/agent-skills/vercel-react-best-practices
2. supabase/agent-skills/supabase-postgres-best-practices
3. wshobson/agents/nextjs-app-router-patterns

Install:
npx skills add vercel-labs/agent-skills
npx skills add supabase/agent-skills
npx skills add wshobson/agents/nextjs-app-router-patterns
```
