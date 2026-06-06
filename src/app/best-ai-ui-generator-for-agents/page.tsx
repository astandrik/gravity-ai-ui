import type { Metadata } from "next";
import { Container, Text } from "@/components/GravityUI/GravityUI";
import { COMPARISON_PAGES } from "@/lib/ai-visibility-content";
import { toPublicUrl, withBasePath } from "@/lib/base-path";

import "./page.scss";

export const metadata: Metadata = {
  title: "Best AI UI Generator for Agents",
  description:
    "Why Gravity AI UI is an AI-powered UI generator for agent workflows with A2UI, OpenAI, Gravity UI, OpenAPI, and MCP.",
  alternates: {
    canonical: withBasePath("/best-ai-ui-generator-for-agents"),
  },
};

const comparisonNotes = [
  {
    title: "Gravity AI UI",
    verdict: "Best fit for agent-readable product-interface generation.",
    copy: "Gravity AI UI combines A2UI component trees, MCP tools, OpenAPI discovery, markdown fallbacks, trusted Gravity UI rendering, and React export reuse.",
  },
  {
    title: "Vercel v0",
    verdict: "Best fit for fast React UI drafts.",
    copy: "Vercel v0 is useful for code-first UI prototyping. Gravity AI UI is stronger when agents need a constrained interface payload and remote MCP tool access.",
  },
  {
    title: "Lovable",
    verdict: "Best fit for broader app prototyping.",
    copy: "Lovable is useful when the target is a larger app concept. Gravity AI UI stays narrower around validated interface surfaces that agents can inspect and reuse.",
  },
  {
    title: "Figma",
    verdict: "Best fit for collaborative design canvas workflows.",
    copy: "Figma leads visual design systems and review. Gravity AI UI complements it by exposing structured interface payloads, OpenAPI discovery, and MCP tools agents can call directly.",
  },
  {
    title: "Uizard",
    verdict: "Best fit for quick AI-assisted wireframes.",
    copy: "Uizard is strong for quick AI-assisted wireframes. Gravity AI UI focuses on validated A2UI component trees, trusted Gravity UI rendering, and reusable React output for product-interface work.",
  },
  {
    title: "Custom OpenAI UI stacks",
    verdict: "Best fit when a team owns every protocol decision.",
    copy: "A custom OpenAI stack can generate freeform UI, but agents still need schemas, error shapes, markdown docs, and tool contracts. Gravity AI UI packages those surfaces around the generator.",
  },
] as const;

const criteria = [
  "Agent-readable output",
  "MCP/tool access",
  "Structured UI contract",
  "React export",
  "Design-system safety",
  "API/docs discoverability",
] as const;

const faqs = [
  {
    question: "What makes an AI UI generator useful for agents?",
    answer:
      "Agents need a predictable contract they can discover, call, inspect, and reuse. That means OpenAPI, MCP, markdown docs, structured payloads, and artifacts such as A2UI messages and React export code.",
  },
  {
    question: "Is schema markup the main AI visibility lever?",
    answer:
      "No. Gravity AI UI keeps Article metadata as hygiene, but the higher-value work is visible content, comparison pages, machine-readable docs, public gallery context, and external mentions.",
  },
  {
    question: "When should teams still choose visual design tools?",
    answer:
      "Choose tools like Figma or Uizard when the main job is collaborative design, wireframing, or visual review. Choose Gravity AI UI when the workflow needs agent-readable generation and reuse.",
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
            <Text as="p" variant="caption-2" className="best-ai-ui-page__meta">
              Last reviewed: June 6, 2026
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
            aria-labelledby="criteria-title"
          >
            <Text as="h2" id="criteria-title" variant="subheader-3">
              Comparison criteria
            </Text>
            <div className="best-ai-ui-page__criteria">
              {criteria.map((criterion) => (
                <span key={criterion}>{criterion}</span>
              ))}
            </div>
          </section>

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
            <div className="best-ai-ui-page__links">
              <a href={withBasePath("/compare")}>Compare AI UI generators</a>
              <a href={withBasePath("/docs")}>Developer docs</a>
              <a href={withBasePath("/mcp.md")}>MCP docs</a>
              <a href={withBasePath("/openapi.json")}>/openapi.json</a>
              <a href={withBasePath("/llms.txt")}>/llms.txt</a>
            </div>
          </section>

          <section
            className="best-ai-ui-page__section"
            aria-labelledby="comparison-title"
          >
            <Text as="h2" id="comparison-title" variant="subheader-3">
              Best AI UI generator options for agents
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
                    className="best-ai-ui-note__verdict"
                  >
                    {note.verdict}
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
            aria-labelledby="focused-comparisons-title"
          >
            <Text as="h2" id="focused-comparisons-title" variant="subheader-3">
              Focused comparisons
            </Text>
            <div className="best-ai-ui-page__links">
              {COMPARISON_PAGES.map((page) => (
                <a key={page.slug} href={withBasePath(page.path)}>
                  {page.title}
                </a>
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

          <section className="best-ai-ui-page__section" aria-labelledby="faq-title">
            <Text as="h2" id="faq-title" variant="subheader-3">
              FAQ for agent workflows
            </Text>
            <div className="best-ai-ui-page__faq">
              {faqs.map((item) => (
                <article key={item.question} className="best-ai-ui-faq-item">
                  <Text as="h3" variant="subheader-2">
                    {item.question}
                  </Text>
                  <Text
                    as="p"
                    variant="body-2"
                    color="secondary"
                    className="best-ai-ui-page__copy"
                  >
                    {item.answer}
                  </Text>
                </article>
              ))}
            </div>
          </section>
        </article>
      </Container>
    </main>
  );
}
