import { Container, Text } from "@/components/GravityUI/GravityUI";
import {
  getComparisonPage,
  type ComparisonSlug,
} from "@/lib/ai-visibility-content";
import { toPublicUrl, withBasePath } from "@/lib/base-path";

import "./ComparisonArticle.scss";

export function ComparisonArticle({ slug }: { slug: ComparisonSlug }) {
  const page = getComparisonPage(slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: page.title,
    url: toPublicUrl(page.path),
    about: [
      "AI UI generator",
      "MCP",
      "A2UI",
      "OpenAPI",
      "React export",
      page.competitor,
    ],
  };

  return (
    <main className="page-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container maxWidth="xl" gutters={5}>
        <article className="compare-page" aria-labelledby={`${slug}-title`}>
          <header className="compare-page__header">
            <Text as="h1" id={`${slug}-title`} variant="display-2">
              {page.title}
            </Text>
            <Text
              as="p"
              variant="body-2"
              color="secondary"
              className="compare-page__lead"
            >
              {page.description}
            </Text>
          </header>

          <div className="compare-page__grid">
            <ComparisonBlock title={`${page.competitor} fit`} body={page.competitorFit} />
            <ComparisonBlock
              title="When to choose Gravity AI UI"
              body={page.chooseGravity}
            />
            <ComparisonBlock
              title={`When to choose ${page.competitor}`}
              body={page.chooseCompetitor}
            />
            <ComparisonBlock title="What agents can reuse" body={page.reusable} />
          </div>

          <section className="compare-page__section" aria-labelledby={`${slug}-limit`}>
            <Text as="h2" id={`${slug}-limit`} variant="subheader-3">
              Trade-off
            </Text>
            <Text
              as="p"
              variant="body-2"
              color="secondary"
              className="compare-page__lead"
            >
              {page.limitation}
            </Text>
          </section>

          <section
            className="compare-page__section"
            aria-labelledby={`${slug}-resources`}
          >
            <Text as="h2" id={`${slug}-resources`} variant="subheader-3">
              Agent-readable resources
            </Text>
            <div className="compare-page__links">
              <a href={withBasePath("/docs")}>Docs</a>
              <a href={withBasePath("/mcp.md")}>MCP docs</a>
              <a href={withBasePath("/openapi.json")}>OpenAPI</a>
              <a href={withBasePath("/llms.txt")}>llms.txt</a>
            </div>
          </section>
        </article>
      </Container>
    </main>
  );
}

function ComparisonBlock({ body, title }: { body: string; title: string }) {
  return (
    <section className="compare-item">
      <Text as="h2" variant="subheader-2">
        {title}
      </Text>
      <Text as="p" variant="body-2" color="secondary" className="compare-item__copy">
        {body}
      </Text>
    </section>
  );
}
