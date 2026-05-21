<!-- Managed by agent: keep sections and order; edit content, not structure. Last updated: 2026-05-20 -->

# AGENTS.md - src

## Overview

Source tree for the `gravity-ai-ui` Next.js app: App Router pages, providers, reusable UI components, and global SCSS.

## Setup

- Framework: Next.js 16 App Router on React 19
- UI: Gravity UI
- Styles: SCSS with global tokens in `styles/_variables.scss`
- Path alias: `@/*` -> `src/*`

## Conventions

- Default to server components.
- Add `"use client"` only for hooks, browser APIs, or interactive components.
- Co-locate component SCSS next to the component when styles become component-specific.
- Keep global styles limited to tokens, base element rules, utilities, and Gravity UI overrides.
- Import shared Gravity UI components through `@/components/GravityUI/GravityUI`.
- Keep visible UI text concise and domain-specific.

## Verification

- `npm run lint`
- `npm test`
- `npm run typecheck`
- `npm run build`
- Browser verification for visible UI changes.
