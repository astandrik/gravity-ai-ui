import type { Metadata } from "next";
import Image from "next/image";
import { LogoGithub } from "@gravity-ui/icons";
import { Button, Container, Text } from "@/components/GravityUI/GravityUI";
import { withBasePath } from "@/lib/base-path";

import "./page.scss";

const GITHUB_REPOSITORY_URL = "https://github.com/astandrik/gravity-ai-ui";
const LOCAL_YDB_TOOLKIT_URL = "https://github.com/astandrik/local-ydb-toolkit";

export const metadata: Metadata = {
  title: "About",
  description:
    "How Gravity AI UI combines A2UI, Gravity UI, and YDB into a trusted interface preview shell.",
};

const integrations = [
  {
    label: "Interface protocol",
    name: "A2UI",
    description:
      "Carries agent intent as structured interface messages that the page can render predictably.",
    href: "https://a2ui.org/",
    image: "/assets/a2ui-logo.svg",
    imageAlt: "A2UI",
  },
  {
    label: "Built with",
    name: "gravity-ui/uikit",
    description:
      "Provides the local component set used to turn generated interface plans into familiar product UI.",
    href: "https://github.com/gravity-ui/uikit",
    image: "/assets/gravity-ui-favicon.png",
    imageAlt: "Gravity UI",
  },
  {
    label: "Data layer",
    name: "YDB",
    description:
      "Uses local-ydb for the development data layer, with a durable path for product data, interaction signals, and future workflows.",
    href: "https://ydb.tech/",
    image: "/assets/ydb-icon.svg",
    imageAlt: "YDB",
    relatedLink: {
      href: LOCAL_YDB_TOOLKIT_URL,
      label: "local-ydb-toolkit on GitHub",
    },
  },
] as const;

const projectNotes = [
  {
    label: "GenUI flow",
    title: "Interfaces are composed, not pasted",
    description:
      "The agent returns a normalized component tree. The server validates it, materializes A2UI messages, and renders them with the local Gravity UI registry instead of accepting arbitrary JSX.",
  },
  {
    label: "Progressive rendering",
    title: "Useful structure appears before the final snapshot",
    description:
      "While tool arguments stream in, complete ancestor chains can already become renderable A2UI updates. The user sees status and partial structure without waiting for the whole interface payload.",
  },
  {
    label: "Feedback loop",
    title: "Every generated screen stays inspectable",
    description:
      "Rendered surfaces keep the payload, data model, React export, and feedback signals close together, so iterations can improve real product UI instead of one-off mockups.",
  },
] as const;

const localYdbProjects = [
  {
    name: "Codex Pets",
    description:
      "An animated companion project backed by the same local-ydb development workflow.",
    href: "https://pets.ydb-qdrant.tech/",
  },
  {
    name: "YDB Qdrant",
    description:
      "A Qdrant-compatible API layer that uses YDB as the durable vector storage engine.",
    href: "https://ydb-qdrant.tech/",
  },
] as const;

export default function AboutPage() {
  return (
    <main className="page-shell">
      <Container maxWidth="xl" gutters={5}>
        <section className="about-page" aria-labelledby="about-title">
          <header className="about-page__header">
            <Text as="h1" id="about-title" variant="display-2">
              About Gravity AI UI
            </Text>
            <Text
              as="p"
              variant="body-2"
              color="secondary"
              className="about-page__lead"
            >
              Gravity AI UI is a GenUI playground where model output becomes a
              validated A2UI component tree, streams as progressive interface
              snapshots, and renders through trusted local Gravity UI components.
            </Text>
          </header>

          <div
            className="about-page__section"
            aria-labelledby="about-principles-title"
          >
            <div className="about-page__section-title">
              <Text as="span" variant="caption-2" className="about-page__eyebrow">
                Principles
              </Text>
              <Text as="h2" id="about-principles-title" variant="subheader-3">
                How the project works
              </Text>
            </div>
            <div className="about-page__notes" aria-label="Project details">
              {projectNotes.map((note) => (
                <article key={note.label} className="about-note">
                  <Text
                    as="span"
                    variant="caption-2"
                    className="about-note__label"
                  >
                    {note.label}
                  </Text>
                  <Text as="h3" variant="subheader-2">
                    {note.title}
                  </Text>
                  <Text
                    as="p"
                    variant="body-2"
                    color="secondary"
                    className="about-note__description"
                  >
                    {note.description}
                  </Text>
                </article>
              ))}
            </div>
          </div>

          <div
            className="about-page__section"
            aria-labelledby="about-stack-title"
          >
            <div className="about-page__section-title">
              <Text as="span" variant="caption-2" className="about-page__eyebrow">
                Stack
              </Text>
              <Text as="h2" id="about-stack-title" variant="subheader-3">
                Integrations
              </Text>
            </div>
            <div className="about-page__integrations">
              {integrations.map((integration) => (
                <article key={integration.name} className="about-integration">
                  <a
                    aria-label={`Open ${integration.name}`}
                    className="about-integration__overlay"
                    href={integration.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                  <span className="about-integration__icon">
                    <Image
                      src={withBasePath(integration.image)}
                      alt={integration.imageAlt}
                      width={32}
                      height={32}
                      unoptimized
                    />
                  </span>
                  <span className="about-integration__body">
                    <Text
                      as="span"
                      variant="caption-2"
                      className="about-integration__label"
                    >
                      {integration.label}
                    </Text>
                    <Text as="span" variant="subheader-2">
                      {integration.name}
                    </Text>
                    <Text
                      as="span"
                      variant="body-2"
                      color="secondary"
                      className="about-integration__description"
                    >
                      {integration.description}
                    </Text>
                    {"relatedLink" in integration ? (
                      <a
                        className="about-integration__related"
                        href={integration.relatedLink.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {integration.relatedLink.label}
                      </a>
                    ) : null}
                  </span>
                </article>
              ))}
            </div>
          </div>

          <div
            className="about-page__section"
            aria-labelledby="about-local-ydb-title"
          >
            <div className="about-page__section-title">
              <Text as="span" variant="caption-2" className="about-page__eyebrow">
                Ecosystem
              </Text>
              <Text as="h2" id="about-local-ydb-title" variant="subheader-3">
                Other projects using local-ydb
              </Text>
            </div>
            <div className="about-page__projects">
              {localYdbProjects.map((project) => (
                <article key={project.name} className="about-project">
                  <a
                    aria-label={`Open ${project.name}`}
                    className="about-project__overlay"
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                  <Text as="h3" variant="subheader-2">
                    {project.name}
                  </Text>
                  <Text
                    as="p"
                    variant="body-2"
                    color="secondary"
                    className="about-project__description"
                  >
                    {project.description}
                  </Text>
                  <span className="about-project__link" aria-hidden="true">
                    Open project
                  </span>
                </article>
              ))}
            </div>
          </div>

          <div className="about-page__actions">
            <Button
              view="outlined"
              size="l"
              href={GITHUB_REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <LogoGithub />
              GitHub
            </Button>
          </div>
        </section>
      </Container>
    </main>
  );
}
