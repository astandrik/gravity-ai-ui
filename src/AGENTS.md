<!-- Managed by agent: keep sections and order; edit content, not structure. Last updated: 2026-05-22 -->

# AGENTS.md - src

## Overview

Source tree for the `gravity-ai-ui` Next.js app: App Router pages, providers, reusable UI components, and global SCSS.
Agent-generated UI is rendered through a safe composed A2UI tree, not arbitrary JSX or raw Gravity UI.

## Setup

- Framework: Next.js 16 App Router on React 19
- UI: Gravity UI
- Renderer: curated A2UI registry in `components/AgentShell/gravityA2uiCatalog.tsx`
- Agent schema: normalized `compose_gravity_interface` payloads in `lib/agent/composedInterface.ts`
- Styles: SCSS with global tokens in `styles/_variables.scss`
- Path alias: `@/*` -> `src/*`

## Conventions

- Default to server components.
- Add `"use client"` only for hooks, browser APIs, or interactive components.
- Co-locate component SCSS next to the component when styles become component-specific.
- Keep global styles limited to tokens, base element rules, utilities, and Gravity UI overrides.
- Import shared Gravity UI components through `@/components/GravityUI/GravityUI`.
- Keep visible UI text concise and domain-specific.
- Keep generated interfaces on the composed path: `openaiAgent.ts` should accept `compose_gravity_interface`, `protocol.ts` should carry composed payloads, and `reactCode.ts` should export from the composed component tree.
- Use `a2uiContract.ts` and `composeComponentCatalog.ts` as the source of truth for curated A2UI component props. The generated Gravity UI catalog is prompt context for raw library docs, not a runtime renderer contract.
- Layout containers (`Column`, `Row`, `Card`, `NavigationBar`) receive children through normalized `parentId` links. Do not add fixed top-level slots or put heading copy in container props; create child `Text` nodes.
- Keep `HeroBlock`, `FilterBar`, `FeaturePanelGrid`, and `CardGrid` as optional registry components, not required templates.
- Keep liked design feedback as stored feedback only unless a task explicitly changes that behavior.

## Verification

- `npm run lint`
- `npm test`
- `npm run typecheck`
- `npm run build`
- `npm run check:gravity-capabilities` when Gravity UI generated metadata or docs-aware prompt context changes
- Browser verification for visible UI changes.
