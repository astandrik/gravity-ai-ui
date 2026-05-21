<!-- FOR AI AGENTS - Human readability is a side effect, not a goal -->
<!-- Managed by agent: keep sections and order; edit content, not structure -->
<!-- Last updated: 2026-05-20 | Last verified: 2026-05-20 -->

# AGENTS.md

**Precedence:** the closest `AGENTS.md` to the files you edit wins. Root defines repo-wide defaults.

## Commands

| Task | Command |
|------|---------|
| Install deps | `npm install` |
| Dev server | `npm run dev -- --port 3000` |
| Typecheck | `npm run typecheck` |
| Lint | `npm run lint` |
| Test | `npm test` |
| Build | `npm run build` |

## Stack

- Next.js 16 App Router on React 19
- TypeScript strict with `@/*` mapped to `src/*`
- Gravity UI components and theme provider
- SCSS with global tokens and adjacent component styles
- npm and Node 24

## Workflow

1. Read nearest `AGENTS.md` before editing.
2. For `src/**`, check `./src/AGENTS.md`.
3. Prefer server components. Add `"use client"` only for hooks, browser APIs, or direct interactivity.
4. Run the smallest relevant check after each change.
5. Before claiming completion, provide evidence from lint, tests, typecheck, build, or browser verification.

## File Map

```text
src/app/          -> Next App Router pages, layouts, providers
src/components/   -> reusable UI components
src/styles/       -> global SCSS variables, mixins, utilities, overrides
public/           -> static assets
```

## Boundaries

- Keep diffs small and local to the requested feature.
- Reuse existing Gravity UI exports from `src/components/GravityUI/GravityUI.tsx`.
- Use `@/` imports for internal modules.
- Do not edit `.next/`, `node_modules/`, or `.playwright-mcp/`.
- Ask before adding production dependencies unless the task explicitly requires them.

## Index of scoped AGENTS.md

- [src/AGENTS.md](./src/AGENTS.md) — source-tree rules for App Router, components, and shared UI.
