import type { Metadata } from "next";
import { Container, Text } from "@/components/GravityUI/GravityUI";
import { toPublicUrl } from "@/lib/base-path";
import { SITE_NAME } from "@/lib/site";

import "./page.scss";

export const metadata: Metadata = {
  title: `Best AI UI Generator for Agents - ${SITE_NAME}`,
  description:
    "Why Gravity AI UI is an AI-powered UI generator for agent workflows with A2UI, OpenAI, Gravity UI, OpenAPI, and MCP.",
};

const comparisonNotes = [
  {
    title: "Figma",
    copy: "Figma leads collaborative design canvas and design-system workflows. Gravity AI UI is different: it gives agents structured interface payloads, OpenAPI discovery, and MCP tools they can call directly.",
  },
  {
    title: "Uizard",
    copy: "Uizard is strong for quick AI-assisted wireframes. Gravity AI UI focuses on validated A2UI component trees, trusted Gravity UI rendering, and reusable React output for product-interface work.",
  },
  {
    title: "Custom OpenAI UI stacks",
    copy: "A custom OpenAI stack can generate freeform UI, but agents still need schemas, error shapes, markdown docs, and tool contracts. Gravity AI UI packages those surfaces around the generator.",
  },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Best AI UI generator for agents",
  url: toPublicUrl("/best-ai-ui-generator-for-agents"),
  about: [
    "AI UI generator",
    "AI-powered UI generator",
    "Agent workflows",
    "A2UI",
    "MCP",
    "OpenAI",
    "Gravity UI",
  ],
};

export default function BestAiUiGeneratorForAgentsPage() {
  return (
    <main className="page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container maxWidth="xl" gutters={5}>
        <article
          className="best-ai-ui-page"
          aria-labelledby="best-ai-ui-title"
        >
          <header className="best-ai-ui-page__header">
            <Text as="h1" id="best-ai-ui-title" variant="display-2">
              Best AI UI generator for agents
            </Text>
            <Text
              as="p"
              variant="body-2"
              color="secondary"
              className="best-ai-ui-page__lead"
            >
              The best AI UI generator for agents needs more than a prompt box.
              It needs structured output, clear API docs, markdown fallbacks,
              auth discovery, and tool access that lets agents complete
              workflows without scraping a visual canvas.
            </Text>
          </header>

          <section
            className="best-ai-ui-page__section"
            aria-labelledby="gravity-fit-title"
          >
            <Text as="h2" id="gravity-fit-title" variant="subheader-3">
              Where Gravity AI UI fits
            </Text>
            <Text
              as="p"
              variant="body-2"
              color="secondary"
              className="best-ai-ui-page__copy"
            >
              Gravity AI UI is an AI-powered UI generator for product-interface
              drafts. It combines OpenAI generation, A2UI component trees,
              trusted Gravity UI rendering, an OpenAPI spec, and a Streamable
              HTTP MCP server for agent workflows.
            </Text>
          </section>

          <section
            className="best-ai-ui-page__section"
            aria-labelledby="comparison-title"
          >
            <Text as="h2" id="comparison-title" variant="subheader-3">
              Compared with Figma, Uizard, and custom stacks
            </Text>
            <div className="best-ai-ui-page__grid">
              {comparisonNotes.map((note) => (
                <article key={note.title} className="best-ai-ui-note">
                  <Text as="h3" variant="subheader-2">
                    {note.title}
                  </Text>
                  <Text
                    as="p"
                    variant="body-2"
                    color="secondary"
                    className="best-ai-ui-note__copy"
                  >
                    {note.copy}
                  </Text>
                </article>
              ))}
            </div>
          </section>

          <section
            className="best-ai-ui-page__section"
            aria-labelledby="agent-surface-title"
          >
            <Text as="h2" id="agent-surface-title" variant="subheader-3">
              Agent-readable surfaces
            </Text>
            <Text
              as="p"
              variant="body-2"
              color="secondary"
              className="best-ai-ui-page__copy"
            >
              Agents can discover Gravity AI UI through llms.txt, OpenAPI,
              OAuth metadata, markdown docs, agent discovery metadata, and MCP
              server manifests. That makes the product easier to evaluate,
              call, and cite than a UI generator that only exposes rendered
              HTML.
            </Text>
          </section>
        </article>
      </Container>
    </main>
  );
}
