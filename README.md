# Gravity AI UI

AI-agent interface shell for generating, previewing, inspecting, and reusing product UI ideas. The app asks an OpenAI model for a constrained interface description, validates it, converts it to A2UI, and renders it with trusted local Gravity UI components.

## Live Site

[gravity-ai.ydb-qdrant.tech](https://gravity-ai.ydb-qdrant.tech)

## Features

- Chat-first interface builder with conversation history.
- Generated UI preview rendered from a strict A2UI-compatible contract.
- Side-by-side inspector tabs for Preview, React, A2UI, Data, and Payload.
- Copyable React code for the latest generated interface.
- Gravity UI component catalog with cards, forms, metrics, alerts, tables, progress, links, users, icons, and navigation patterns.
- Starter prompt rotation for empty conversations.
- Design likes stored in YDB and reused as positive examples for later generations.
- SEO metadata, Open Graph image, sitemap, robots, `llms.txt`, IndexNow support, and Yandex Metrika goals.

## Architecture

- `src/app/api/agent/route.ts` streams agent responses over `text/event-stream`.
- `src/lib/agent/openaiAgent.ts` calls the OpenAI Responses API with a required tool call and `store: false`.
- `src/lib/agent/fixedInterface.ts` validates the model output before anything is rendered.
- `src/components/AgentShell/gravityA2uiCatalog.tsx` maps the safe interface contract to Gravity UI components.
- `src/lib/agent/reactCode.ts` generates the copyable React representation.
- `src/app/api/design-feedback/route.ts` stores liked designs through the YDB feedback store.

The model never emits arbitrary React, HTML, iframe, or markdown content for direct rendering. It emits structured interface data, and the application decides how that data maps to local components.

## Stack

- Next.js 16 App Router and React 19
- TypeScript strict mode
- Gravity UI, Gravity Icons, and Gravity Navigation
- A2UI React and web core packages
- OpenAI JavaScript SDK
- YDB JavaScript SDK
- Zod, SCSS, ESLint 9, and Vitest
- npm with Node 24

## Environment

Create a local `.env.local` file when running the agent locally. This file is ignored by git.

```bash
OPENAI_API_KEY=...

# Optional
OPENAI_MODEL=gpt-5.5
OPENAI_REASONING_EFFORT=none
OPENAI_MAX_OUTPUT_TOKENS=24000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_BASE_PATH=
INDEXNOW_KEY=
```

`OPENAI_REASONING_EFFORT` defaults to `none` to keep interface generation responsive on `gpt-5.5`.
`OPENAI_MAX_OUTPUT_TOKENS` defaults to `24000` and is clamped to `4000..64000` in code.
OpenAI requests use `service_tier: "priority"` for lower latency when the project has access to priority processing.

YDB is optional for basic interface generation. Without YDB, the app can still render generated interfaces, but saving likes and loading liked examples will be unavailable.

```bash
# Either provide a full connection string
YDB_CONNECTION_STRING=grpc://localhost:2136/local

# Or provide endpoint and database separately
YDB_ENDPOINT=grpc://localhost:2136
YDB_DATABASE=/local
YDB_FEEDBACK_TABLE=design_feedback

# Optional static credentials
YDB_STATIC_CREDENTIALS_USER=...
YDB_STATIC_CREDENTIALS_PASSWORD=...
YDB_STATIC_CREDENTIALS_PASSWORD_FILE=...
YDB_STATIC_CREDENTIALS_ENDPOINT=...
```

## Development

```bash
nvm use 24
npm install
npm run dev -- --port 3000
```

Open [localhost:3000](http://localhost:3000).

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Production Notes

The public deployment is configured outside the repository with host-specific runtime secrets and proxy settings. Keep deployment scripts, runtime env files, and infrastructure notes out of git unless they are explicitly sanitized.
