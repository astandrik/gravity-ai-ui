import { Container, Text } from "@/components/GravityUI/GravityUI";
import { getGuidePage, type GuideSlug } from "@/lib/ai-visibility-content";
import { toPublicUrl, withBasePath } from "@/lib/base-path";

import "@/app/guides/a2ui-openai-gravity-ui/page.scss";

export function GuideArticle({ slug }: { slug: GuideSlug }) {
  const page = getGuidePage(slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: page.title,
    url: toPublicUrl(page.path),
    about: ["AI UI generator", "A2UI", "MCP", "OpenAPI", "React export"],
  };

  return (
    <main className="page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container maxWidth="xl" gutters={5}>
        <article className="integration-guide" aria-labelledby={`${slug}-title`}>
          <header className="integration-guide__header">
            <Text as="h1" id={`${slug}-title`} variant="display-2">
              {page.title}
            </Text>
            <Text
              as="p"
              variant="body-2"
              color="secondary"
              className="integration-guide__lead"
            >
              {page.description}
            </Text>
          </header>

          <div className="integration-guide__steps">
            {page.sections.map((section) => (
              <section key={section.title} className="integration-step">
                <Text as="h2" variant="subheader-2">
                  {section.title}
                </Text>
                <Text
                  as="p"
                  variant="body-2"
                  color="secondary"
                  className="integration-step__copy"
                >
                  {section.body}
                </Text>
              </section>
            ))}
          </div>

          <section
            className="integration-guide__section"
            aria-labelledby={`${slug}-resources`}
          >
            <Text as="h2" id={`${slug}-resources`} variant="subheader-3">
              Related resources
            </Text>
            <div className="integration-guide__links">
              <a href={withBasePath("/docs")}>Docs</a>
              <a href={withBasePath("/mcp.md")}>MCP docs</a>
              <a href={withBasePath("/openapi.json")}>OpenAPI</a>
              <a href={withBasePath("/best-ai-ui-generator-for-agents")}>
                Best AI UI generator for agents
              </a>
            </div>
          </section>
        </article>
      </Container>
    </main>
  );
}
