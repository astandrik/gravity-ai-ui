import type { Metadata } from "next";
import { Container, Text } from "@/components/GravityUI/GravityUI";
import { toPublicUrl, withBasePath } from "@/lib/base-path";

import "@/components/AiVisibility/GuideArticle.scss";

export const metadata: Metadata = {
  title: "A2UI, OpenAI, and Gravity UI Integration Guide",
  description:
    "How Gravity AI UI uses OpenAI structured output, A2UI messages, and trusted Gravity UI components to build agent-generated product interfaces.",
  alternates: {
    canonical: withBasePath("/guides/a2ui-openai-gravity-ui"),
  },
};

const steps = [
  {
    title: "Model output",
    text: "OpenAI generation is constrained to the compose_gravity_interface payload shape instead of arbitrary JSX.",
  },
  {
    title: "Protocol boundary",
    text: "The server validates the payload and materializes A2UI messages for deterministic client rendering.",
  },
  {
    title: "Trusted UI",
    text: "The client renders only curated, trusted Gravity UI components from the local registry.",
  },
  {
    title: "Agent access",
    text: "The Streamable HTTP MCP server exposes search, fetch, generate, and refine tools for agent-native workflows.",
  },
] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "A2UI, OpenAI, and Gravity UI integration guide",
  url: toPublicUrl("/guides/a2ui-openai-gravity-ui"),
  about: ["A2UI", "OpenAI", "Gravity UI", "MCP", "Generative UI"],
};

export default function IntegrationGuidePage() {
  return (
    <main className="page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container maxWidth="xl" gutters={5}>
        <article className="integration-guide" aria-labelledby="guide-title">
          <header className="integration-guide__header">
            <Text as="h1" id="guide-title" variant="display-2">
              A2UI, OpenAI, and Gravity UI integration guide
            </Text>
            <Text
              as="p"
              variant="body-2"
              color="secondary"
              className="integration-guide__lead"
            >
              Gravity AI UI turns prompts into product interfaces by combining
              OpenAI generation, the compose_gravity_interface contract, A2UI
              transport messages, and trusted Gravity UI components.
            </Text>
          </header>

          <div className="integration-guide__steps">
            {steps.map((step) => (
              <section key={step.title} className="integration-step">
                <Text as="h2" variant="subheader-2">
                  {step.title}
                </Text>
                <Text
                  as="p"
                  variant="body-2"
                  color="secondary"
                  className="integration-step__copy"
                >
                  {step.text}
                </Text>
              </section>
            ))}
          </div>

          <section
            className="integration-guide__section"
            aria-labelledby="agent-integration-title"
          >
            <Text as="h2" id="agent-integration-title" variant="subheader-3">
              Streamable HTTP MCP
            </Text>
            <Text
              as="p"
              variant="body-2"
              color="secondary"
              className="integration-guide__lead"
            >
              Agents can use the public MCP server to call the same generation
              path without scraping the UI. The MCP response returns structured
              content, generated interface payloads, and copyable React code.
            </Text>
          </section>
        </article>
      </Container>
    </main>
  );
}
