import type { Metadata } from "next";
import { AskAIPanel } from "@/components/AskAI/AskAIPanel";
import {
  ASK_AI_PRODUCT_EVALUATION,
  ASK_AI_PRODUCT_NAME,
} from "@/components/AskAI/ask-ai-content";
import { Container, Text } from "@/components/GravityUI/GravityUI";
import { toPublicUrl } from "@/lib/base-path";

import "./page.scss";

const commands = [
  "npm run dev -- --port 3000",
  "npm run lint",
  "npm test",
  "npm run typecheck",
  "npm run build",
] as const;

const mcpTools = [
  "search_interfaces",
  "get_interface",
  "generate_interface",
  "refine_interface",
] as const;

export const metadata: Metadata = {
  title: "Developer Docs",
  description:
    "Gravity AI UI API docs with OpenAPI, MCP server, OAuth metadata, webhooks status, rate limits, and structured error guidance for AI agents.",
};

const apiNotes = [
  {
    title: "Rate limits",
    description:
      "The public demo is for low-volume interactive use. Agents should back off on transient failures and respect RateLimit-* or Retry-After headers when present.",
  },
  {
    title: "Errors",
    description:
      "Handled API and discovery routes return structured JSON with error.code, error.message, and docs links where useful.",
  },
  {
    title: "Idempotency",
    description:
      "Mutation endpoints document Idempotency-Key for agent retry planning. Durable idempotency is not enforced in this metadata-only pass.",
  },
] as const;

function getDeveloperResources() {
  return [
    {
      title: "OpenAPI spec",
      href: toPublicUrl("/openapi.json"),
      description:
        "OpenAPI 3.1 reference for /api/agent, /api/design-feedback, /mcp, OAuth discovery, and function-calling agents.",
    },
    {
      title: "OAuth",
      href: toPublicUrl("/.well-known/oauth-authorization-server"),
      description:
        "Metadata-only OAuth 2.0 and OpenID Connect discovery. Token issuance is not enabled in the current public demo.",
    },
    {
      title: "MCP server",
      href: toPublicUrl("/.well-known/mcp/server-card.json"),
      description:
        "Pre-connection MCP server card with Streamable HTTP transport details and the public tool list.",
    },
    {
      title: "Agent discovery",
      href: toPublicUrl("/.well-known/agent.json"),
      description:
        "Generic agent discovery document with product capabilities, OpenAPI, OAuth metadata, MCP links, and llms.txt.",
    },
    {
      title: "Markdown docs",
      href: toPublicUrl("/docs.md"),
      description:
        "Heading-led markdown fallback for agents that prefer text resources over rendered HTML pages.",
    },
    {
      title: "MCP UI generator guide",
      href: toPublicUrl("/guides/mcp-ui-generator"),
      description:
        "How to expose an AI UI generator through MCP with structured A2UI output, OpenAPI, markdown docs, and React export artifacts.",
    },
    {
      title: "Structured UI output guide",
      href: toPublicUrl("/guides/structured-ui-output-vs-jsx"),
      description:
        "Why structured A2UI-style output is safer and easier for agents to reuse than raw JSX or HTML generation.",
    },
    {
      title: "webhooks",
      href: toPublicUrl("/webhooks.md"),
      description:
        "Current webhook support status. Gravity AI UI does not support webhook registration yet; agents should use direct API or MCP calls.",
    },
  ] as const;
}

export default function DocsPage() {
  const mcpUrl = toPublicUrl("/mcp");
  const mcpCommand = `codex mcp add gravityAiUi --url ${mcpUrl}`;
  const developerResources = getDeveloperResources();

  return (
    <main className="page-shell">
      <Container maxWidth="xl" gutters={5}>
        <section className="docs-page" aria-labelledby="docs-title">
          <Text as="h1" id="docs-title" variant="display-2">
            Gravity AI UI Developer Docs
          </Text>
          <Text
            as="p"
            variant="body-2"
            color="secondary"
            className="docs-page__lead"
          >
            API docs for agents and developers integrating with Gravity AI UI.
            The public surfaces include an OpenAPI spec, a Streamable HTTP MCP
            server, OAuth discovery metadata, markdown docs, structured errors,
            and documented webhooks status.
          </Text>

          <div className="docs-page__resource-grid">
            {developerResources.map((resource) => (
              <article key={resource.title} className="docs-resource">
                <Text as="h2" variant="subheader-2">
                  {resource.title}
                </Text>
                <Text
                  as="p"
                  variant="body-2"
                  color="secondary"
                  className="docs-resource__description"
                >
                  {resource.description}
                </Text>
                <a
                  className="docs-resource__link"
                  href={resource.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {resource.href}
                </a>
              </article>
            ))}
          </div>

          <section className="docs-page__section" aria-labelledby="mcp-title">
            <Text as="h2" id="mcp-title" variant="subheader-3">
              Remote MCP
            </Text>
            <Text
              as="p"
              variant="body-2"
              color="secondary"
              className="docs-page__section-copy"
            >
              Connect coding agents to public gallery lookup and interface
              generation. Generated MCP results are returned to the caller only;
              they are not saved or published.
            </Text>
            <div className="docs-page__commands">
              <code>{mcpUrl}</code>
              <code>{mcpCommand}</code>
            </div>
            <div className="docs-page__tools" aria-label="MCP tools">
              {mcpTools.map((tool) => (
                <code key={tool}>{tool}</code>
              ))}
            </div>
          </section>

          <section className="docs-page__section" aria-labelledby="api-title">
            <Text as="h2" id="api-title" variant="subheader-3">
              API behavior for agents
            </Text>
            <div className="docs-page__notes">
              {apiNotes.map((note) => (
                <article key={note.title} className="docs-note">
                  <Text as="h3" variant="subheader-2">
                    {note.title}
                  </Text>
                  <Text
                    as="p"
                    variant="body-2"
                    color="secondary"
                    className="docs-note__description"
                  >
                    {note.description}
                  </Text>
                </article>
              ))}
            </div>
          </section>

          <section
            className="docs-page__section"
            aria-labelledby="local-commands-title"
          >
            <Text as="h2" id="local-commands-title" variant="subheader-3">
              Local verification commands
            </Text>
            <Text
              as="p"
              variant="body-2"
              color="secondary"
              className="docs-page__section-copy"
            >
              Baseline commands for local development and verification.
            </Text>
            <div className="docs-page__commands">
              {commands.map((command) => (
                <code key={command}>{command}</code>
              ))}
            </div>
          </section>

          <AskAIPanel
            productName={ASK_AI_PRODUCT_NAME}
            label={ASK_AI_PRODUCT_EVALUATION.label}
            helperText={ASK_AI_PRODUCT_EVALUATION.helperText}
            prompt={ASK_AI_PRODUCT_EVALUATION.prompt}
            page="docs"
            promptVariant={ASK_AI_PRODUCT_EVALUATION.promptVariant}
          />
        </section>
      </Container>
    </main>
  );
}
