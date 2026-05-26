# Ask AI for Gravity AI UI Implementation Plan

> For agentic workers: implement this plan task by task. Keep commits small. This plan is only for https://gravity-ai.ydb-qdrant.tech/.

**Goal:** Add an "Ask AI about Gravity AI UI" experience that helps product engineers, designers, and frontend developers evaluate the AI-agent interface shell and understand gallery examples.

**Architecture:** Add a compact Ask AI block to informational surfaces, add a gallery-detail prompt variant, and expand the existing llms.txt with suggested assistant tasks.

**Tech Stack:** Existing Gravity AI UI stack, likely Next.js/React with Gravity UI, A2UI, OpenAI, sitemap, llms.txt, and JSON-LD already present.

---

## Product Context

Gravity AI UI is an AI-agent interface shell.

Primary site:

- https://gravity-ai.ydb-qdrant.tech/

Existing AI-readable file:

- https://gravity-ai.ydb-qdrant.tech/llms.txt

Current positioning:

- Generate, preview, inspect, and reuse AI-built product interfaces.
- Uses A2UI, OpenAI, and Gravity UI.
- Has generator, gallery, docs, and about pages.

Do not turn the main generator UI into a marketing landing page. The Ask AI block should be useful but secondary.

## Provider Links

Implement provider links with URL-encoded prompt text.

Use these target URL formats:

- ChatGPT: `https://chat.openai.com/?q=${encodedPrompt}`
- Perplexity: `https://www.perplexity.ai/search/new?q=${encodedPrompt}`
- Claude: `https://claude.ai/new?q=${encodedPrompt}`
- Google AI Mode / Gemini: `https://www.google.com/search?udm=50&aep=11&q=${encodedPrompt}`
- Grok: `https://grok.com/?q=${encodedPrompt}`

All outbound links must use:

- `target="_blank"`
- `rel="noopener noreferrer"`

## Product-Level Copy

Block label:

Ask AI about Gravity AI UI

Helper text:

Open an AI assistant with a product evaluation prompt.

Accessible label pattern:

Ask ChatGPT about Gravity AI UI
Ask Perplexity about Gravity AI UI
Ask Claude about Gravity AI UI
Ask Google AI Mode about Gravity AI UI
Ask Grok about Gravity AI UI

## Gallery-Level Copy

Block label:

Ask AI about this interface

Helper text:

Ask an AI assistant to explain, critique, or adapt this generated UI.

## Product Prompt

Use this exact product-level prompt:

Act as a product engineer evaluating AI UI generation tools. Using current information from https://gravity-ai.ydb-qdrant.tech/, explain what Gravity AI UI does, how it uses A2UI, OpenAI, and Gravity UI, what the generator and gallery are for, what kind of product interfaces it can produce, what a developer or designer can reuse from it, and what limitations or trade-offs I should consider before trying it.

## Gallery Item Prompt

Generate this dynamically with the current canonical gallery item URL:

Using this Gravity AI UI gallery page, explain what interface was generated, what workflow it supports, what the visible UI structure implies, how the original prompt could be improved, and how I could adapt this UI for a real product. Use current information from the page URL: CURRENT_PAGE_URL.

Replace `CURRENT_PAGE_URL` with the canonical URL for the current gallery detail page.

## Tasks

### Task 1: Inspect the Codebase

- [ ] Find the app root.
- [ ] Find layout, footer, header, generator page, gallery page, gallery detail page, docs page, about page.
- [ ] Find llms.txt generation.
- [ ] Find sitemap generation.
- [ ] Find JSON-LD metadata.
- [ ] Find analytics helpers.

Useful commands:

- `rg --files`
- `rg "Gravity AI UI|A2UI|Gallery|Docs|About|llms|sitemap|application/ld|analytics|ym\\(|gtag|dataLayer"`

### Task 2: Add or Reuse Ask AI Component

- [ ] Create or reuse a compact Ask AI component.
- [ ] The component must accept:
  - `productName`
  - `prompt`
  - `page`
  - `promptVariant`
  - optional `contextId`
- [ ] It must encode prompt with `encodeURIComponent`.
- [ ] It must render the provider links listed above.
- [ ] It must support a compact visual mode suitable for footer/docs surfaces.

### Task 3: Add Product-Level Placement

- [ ] Add the product-level Ask AI block to the footer.
- [ ] Add it to `/about` or `/docs`.
- [ ] Keep it secondary to generator actions.
- [ ] Use the product prompt exactly.

### Task 4: Add Gallery Detail Placement

- [ ] Identify public gallery detail pages.
- [ ] Add `Ask AI about this interface` near the generated interface details, prompt, code, or share controls.
- [ ] Use the gallery item prompt.
- [ ] Inject the canonical current page URL into the prompt.
- [ ] If gallery detail pages do not expose canonical URLs, add canonical URL generation first.

### Task 5: Expand llms.txt

- [ ] Keep `/llms.txt` returning HTTP 200.
- [ ] Add a section titled `Suggested assistant tasks`.

Required tasks to list:

- Evaluate Gravity AI UI as an AI UI generation tool.
- Explain how A2UI, OpenAI, and Gravity UI fit together.
- Explain a public gallery item.
- Critique a generated interface.
- Adapt a generated UI for a real product.
- Improve a generation prompt.

Also ensure llms.txt includes:

- App URL
- Gallery URL
- Docs URL
- About URL
- Sitemap URL
- Robots URL

### Task 6: Improve Gallery Retrieval Quality

For public gallery detail pages, ensure server-rendered or crawlable HTML includes:

- title
- original prompt if public
- generated UI summary if available
- generated code if public
- tags or use case
- preview image or OpenGraph image

Do not expose private prompt history.

### Task 7: Add Analytics

Track Ask AI clicks:

- Event name: `ask_ai_click`
- Properties:
  - `product: "gravity-ai-ui"`
  - `page`
  - `provider`
  - `prompt_variant: "product_eval_v1"` or `"gallery_adapt_v1"`
  - `gallery_item_id` when available

Track follow-on actions if instrumentation exists:

- `prompt_submitted`
- `gallery_item_opened`
- `gallery_item_liked`
- `gallery_item_published`
- `generated_code_copied`

### Task 8: Verify

- [ ] Run the project's existing build/test/lint commands. Discover them from package files.
- [ ] Run smoke checks after deploy or local production build:

Commands:

- `curl -I https://gravity-ai.ydb-qdrant.tech/llms.txt`
- `curl -L https://gravity-ai.ydb-qdrant.tech/llms.txt | grep -i "Suggested assistant tasks"`
- `curl -L https://gravity-ai.ydb-qdrant.tech/ | grep -i "Ask AI"`
- `curl -L https://gravity-ai.ydb-qdrant.tech/about | grep -i "Ask AI"`
- `curl -L https://gravity-ai.ydb-qdrant.tech/docs | grep -i "Ask AI"`

Expected results:

- `/llms.txt` remains HTTP 200.
- Product-level Ask AI block appears on informational pages or footer.
- Gallery detail pages have item-specific prompts with the current page URL.
- Main generator UI remains focused on generating interfaces.

## Do Not Do

- Do not add marketing clutter to the generator workbench.
- Do not expose private prompt history.
- Do not make the prompt claim the tool is production-ready unless the docs already say that.
- Do not remove existing llms.txt machine-readable resources.
