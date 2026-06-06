export type ComparisonSlug =
  | "gravity-ai-ui-vs-v0"
  | "gravity-ai-ui-vs-lovable"
  | "gravity-ai-ui-vs-figma"
  | "gravity-ai-ui-vs-uizard";

export type GuideSlug = "mcp-ui-generator" | "structured-ui-output-vs-jsx";

export type ComparisonPageContent = {
  slug: ComparisonSlug;
  competitor: string;
  path: string;
  markdownPath: string;
  title: string;
  description: string;
  competitorFit: string;
  chooseGravity: string;
  chooseCompetitor: string;
  reusable: string;
  limitation: string;
};

export type GuidePageContent = {
  slug: GuideSlug;
  path: string;
  markdownPath: string;
  title: string;
  description: string;
  sections: ReadonlyArray<{
    title: string;
    body: string;
  }>;
};

export const COMPARISON_PAGES: readonly ComparisonPageContent[] = [
  {
    slug: "gravity-ai-ui-vs-v0",
    competitor: "Vercel v0",
    path: "/compare/gravity-ai-ui-vs-v0",
    markdownPath: "/compare/gravity-ai-ui-vs-v0.md",
    title: "Gravity AI UI vs Vercel v0",
    description:
      "Compare Gravity AI UI with Vercel v0 for agent-readable UI generation, MCP access, A2UI payloads, OpenAPI docs, and React export workflows.",
    competitorFit:
      "Vercel v0 is a strong fit for fast React UI drafts and code-first product prototyping inside a Vercel-centered frontend workflow.",
    chooseGravity:
      "Choose Gravity AI UI when an AI agent needs a structured A2UI contract, MCP tools, OpenAPI discovery, markdown fallbacks, trusted Gravity UI rendering, and a React export it can inspect without scraping a visual canvas.",
    chooseCompetitor:
      "Choose Vercel v0 when the main job is producing front-end code drafts quickly and the agent does not need a remote MCP server or constrained Gravity UI component registry.",
    reusable:
      "Agents can reuse the composed payload, A2UI messages, public gallery metadata, generated React export, OpenAPI spec, and MCP tools.",
    limitation:
      "Gravity AI UI is narrower than v0: it focuses on product-interface surfaces and agent workflows rather than broad app scaffolding.",
  },
  {
    slug: "gravity-ai-ui-vs-lovable",
    competitor: "Lovable",
    path: "/compare/gravity-ai-ui-vs-lovable",
    markdownPath: "/compare/gravity-ai-ui-vs-lovable.md",
    title: "Gravity AI UI vs Lovable",
    description:
      "Compare Gravity AI UI with Lovable for AI-generated product interfaces, agent-readable output, MCP access, OpenAPI docs, and React export reuse.",
    competitorFit:
      "Lovable is a strong fit for prompt-to-app prototyping where the desired output is a broader working application concept.",
    chooseGravity:
      "Choose Gravity AI UI when the output needs to stay inside a validated A2UI component tree, render through trusted Gravity UI components, and expose machine-readable MCP and OpenAPI surfaces for agents.",
    chooseCompetitor:
      "Choose Lovable when the goal is a larger app prototype and the agent does not need to inspect a constrained interface payload or call a dedicated MCP UI-generation server.",
    reusable:
      "Agents can reuse the generated React export, A2UI transport messages, gallery detail context, OpenAPI contract, and MCP tool responses.",
    limitation:
      "Gravity AI UI does not try to replace full-app builders; it is optimized for inspectable interface drafts and agent reuse.",
  },
  {
    slug: "gravity-ai-ui-vs-figma",
    competitor: "Figma",
    path: "/compare/gravity-ai-ui-vs-figma",
    markdownPath: "/compare/gravity-ai-ui-vs-figma.md",
    title: "Gravity AI UI vs Figma",
    description:
      "Compare Gravity AI UI with Figma for design workflows, AI-generated interface payloads, A2UI, MCP access, OpenAPI docs, and React export handoff.",
    competitorFit:
      "Figma is the stronger collaborative design canvas for visual design systems, handoff, prototyping, and team review.",
    chooseGravity:
      "Choose Gravity AI UI when an agent needs to generate, refine, fetch, and cite interface output through MCP, OpenAPI, markdown docs, A2UI payloads, and React export data.",
    chooseCompetitor:
      "Choose Figma when the core workflow is visual collaboration, design-system editing, pixel-level layout work, or stakeholder review inside a canvas.",
    reusable:
      "Agents can reuse the structured payload, rendered Gravity UI screen, generated React export, public gallery metadata, and machine-readable API resources.",
    limitation:
      "Gravity AI UI complements Figma rather than replacing it; it prioritizes agent-readable generation over collaborative canvas editing.",
  },
  {
    slug: "gravity-ai-ui-vs-uizard",
    competitor: "Uizard",
    path: "/compare/gravity-ai-ui-vs-uizard",
    markdownPath: "/compare/gravity-ai-ui-vs-uizard.md",
    title: "Gravity AI UI vs Uizard",
    description:
      "Compare Gravity AI UI with Uizard for AI wireframes, agent-readable A2UI output, MCP tool access, OpenAPI docs, and React export reuse.",
    competitorFit:
      "Uizard is a strong fit for fast AI-assisted wireframes, mockups, and early product concept exploration.",
    chooseGravity:
      "Choose Gravity AI UI when agents need a validated component tree, trusted Gravity UI rendering, MCP tool access, OpenAPI docs, markdown fallbacks, and a React export for reuse.",
    chooseCompetitor:
      "Choose Uizard when the priority is quick visual wireframing and the output does not need to be fetched or refined through an agent-native tool protocol.",
    reusable:
      "Agents can reuse public gallery context, A2UI messages, the generated React export, component metadata, OpenAPI docs, and MCP tool outputs.",
    limitation:
      "Gravity AI UI is less focused on freeform mockup breadth and more focused on structured product-interface surfaces.",
  },
] as const;

export const GUIDE_PAGES: readonly GuidePageContent[] = [
  {
    slug: "mcp-ui-generator",
    path: "/guides/mcp-ui-generator",
    markdownPath: "/guides/mcp-ui-generator.md",
    title: "How to expose an AI UI generator through MCP",
    description:
      "A practical guide to exposing AI-generated UI through MCP with structured A2UI output, OpenAPI discovery, markdown docs, and reusable React export artifacts.",
    sections: [
      {
        title: "Define the generated interface contract",
        body: "Start with a constrained payload instead of raw HTML or raw JSX. Gravity AI UI uses a composed A2UI component tree so the server can validate nodes, props, data bindings, and surface updates before anything renders.",
      },
      {
        title: "Publish agent-readable discovery",
        body: "Expose predictable docs for agents: an MCP server card, tools/list support, OpenAPI, llms.txt, markdown guides, and canonical public URLs. The goal is to let an assistant evaluate and call the generator without scraping the app.",
      },
      {
        title: "Return reusable UI artifacts",
        body: "A useful MCP UI generator should return structured content, generated interface metadata, A2UI messages, and a React export. Gravity AI UI keeps those artifacts close to every generated surface.",
      },
      {
        title: "Keep public and private context separate",
        body: "Public gallery pages can expose title, summary, thumbnail, canonical URL, React export, and retrieval context. Private prompt history should stay private unless the user explicitly publishes it.",
      },
    ],
  },
  {
    slug: "structured-ui-output-vs-jsx",
    path: "/guides/structured-ui-output-vs-jsx",
    markdownPath: "/guides/structured-ui-output-vs-jsx.md",
    title: "Structured UI output vs raw JSX",
    description:
      "Why agent-generated product interfaces are safer and easier to reuse when models emit structured A2UI-style payloads instead of raw JSX or HTML.",
    sections: [
      {
        title: "Structured output gives agents a contract",
        body: "Raw JSX can be expressive, but it is hard for an agent to inspect reliably. A structured A2UI payload gives the server and client a typed contract for components, layout, data, and actions.",
      },
      {
        title: "Validation happens before rendering",
        body: "Gravity AI UI validates the composed payload before rendering through trusted Gravity UI components. That avoids arbitrary markup execution and keeps generated screens inside a known design-system boundary.",
      },
      {
        title: "Reuse is easier to automate",
        body: "Structured UI output can be searched, fetched through MCP, summarized in markdown, converted into a React export, and cited by assistants. Raw JSX usually needs extra parsing before an agent can trust it.",
      },
      {
        title: "Raw JSX still fits code-first prototyping",
        body: "Raw JSX is useful when the job is direct component code drafting. Structured output is the better default when the workflow needs A2UI messages, OpenAPI docs, MCP tools, public gallery context, and repeatable agent inspection.",
      },
    ],
  },
] as const;

export function getComparisonPage(slug: ComparisonSlug): ComparisonPageContent {
  const page = COMPARISON_PAGES.find((item) => item.slug === slug);

  if (!page) {
    throw new Error(`Unknown comparison page: ${slug}`);
  }

  return page;
}

export function getGuidePage(slug: GuideSlug): GuidePageContent {
  const page = GUIDE_PAGES.find((item) => item.slug === slug);

  if (!page) {
    throw new Error(`Unknown guide page: ${slug}`);
  }

  return page;
}
