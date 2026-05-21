import type { Metadata } from "next";
import Image from "next/image";
import { Container, Text } from "@/components/GravityUI/GravityUI";
import { withBasePath } from "@/lib/base-path";
import { SITE_NAME } from "@/lib/site";

import "./page.scss";

export const metadata: Metadata = {
  title: `About - ${SITE_NAME}`,
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
      "Provides a durable foundation for product data, interaction signals, and future interface workflows.",
    href: "https://ydb.tech/",
    image: "/assets/ydb-icon.svg",
    imageAlt: "YDB",
  },
] as const;

export default function AboutPage() {
  return (
    <main className="page-shell">
      <Container maxWidth="xl" gutters={5}>
        <section className="about-page" aria-labelledby="about-title">
          <Text as="h1" id="about-title" variant="display-2">
            About Gravity AI UI
          </Text>
          <Text
            as="p"
            variant="body-2"
            color="secondary"
            className="about-page__lead"
          >
            Agent-generated interfaces rendered with trusted local components.
          </Text>

          <div className="about-page__integrations">
            {integrations.map((integration) => (
              <a
                key={integration.name}
                className="about-integration"
                href={integration.href}
                target="_blank"
                rel="noopener noreferrer"
              >
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
                    color="secondary"
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
                </span>
              </a>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
