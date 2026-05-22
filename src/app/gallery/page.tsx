import type { Metadata } from "next";
import NextLink from "next/link";
import {
  Button,
  Container,
  Label,
  Text,
} from "@/components/GravityUI/GravityUI";
import { withBasePath } from "@/lib/base-path";
import type { PublishedDesign } from "@/lib/feedback/designFeedback";
import { listPublishedDesigns } from "@/lib/feedback/ydbFeedbackStore";
import { SITE_NAME } from "@/lib/site";

import "./page.scss";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: `Gallery - ${SITE_NAME}`,
  },
  description:
    "Liked Gravity AI UI interface drafts published from the generator.",
  alternates: {
    canonical: withBasePath("/gallery"),
  },
};

export default async function GalleryPage() {
  const { designs, loadError } = await loadPublishedDesigns();

  return (
    <main className="page-shell">
      <Container maxWidth="xl" gutters={5}>
        <section className="gallery-page" aria-labelledby="gallery-title">
          <div className="gallery-page__header">
            <div>
              <Text as="h1" id="gallery-title" variant="display-2">
                Liked interfaces
              </Text>
              <Text
                as="p"
                variant="body-2"
                color="secondary"
                className="gallery-page__lead"
              >
                Public interface drafts that were liked in the generator.
              </Text>
            </div>
            <Label theme="info" size="s">
              {designs.length === 1
                ? "1 published"
                : `${designs.length} published`}
            </Label>
          </div>

          {loadError ? (
            <div className="gallery-notice" role="status">
              <Text as="h2" variant="subheader-2">
                Gallery is temporarily unavailable
              </Text>
              <Text as="p" variant="body-2" color="secondary">
                The page is online, but the published interface list could not
                be loaded from storage.
              </Text>
            </div>
          ) : null}

          {!loadError && designs.length === 0 ? (
            <div className="gallery-notice">
              <Text as="h2" variant="subheader-2">
                No published interfaces yet
              </Text>
              <Text as="p" variant="body-2" color="secondary">
                Like and publish an interface from the generator to add it here.
              </Text>
              <Button view="outlined" href={withBasePath("/")}>
                Open generator
              </Button>
            </div>
          ) : null}

          {designs.length > 0 ? (
            <div className="gallery-grid">
              {designs.map((design) => (
                <GalleryCard key={design.id} design={design} />
              ))}
            </div>
          ) : null}
        </section>
      </Container>
    </main>
  );
}

async function loadPublishedDesigns() {
  try {
    return {
      designs: await listPublishedDesigns(),
      loadError: false,
    };
  } catch {
    return {
      designs: [],
      loadError: true,
    };
  }
}

function GalleryCard({ design }: { design: PublishedDesign }) {
  const routeHref = `/gallery/${design.id}`;
  const href = withBasePath(routeHref);

  return (
    <article className="gallery-card">
      <NextLink
        aria-label={`Open ${design.title}`}
        className="gallery-card__link"
        href={routeHref}
      />
      <GalleryCardThumbnail design={design} />
      <div className="gallery-card__body">
        <div className="gallery-card__copy">
          <Text as="h2" variant="subheader-2">
            {design.title}
          </Text>
          <Text as="p" variant="body-2" color="secondary">
            {design.summary}
          </Text>
        </div>
        <div className="gallery-card__meta">
          <time dateTime={new Date(design.createdAtMs).toISOString()}>
            {formatPublishedDate(design.createdAtMs)}
          </time>
          <Button
            className="gallery-card__open"
            view="outlined"
            size="s"
            href={href}
          >
            Open
          </Button>
        </div>
      </div>
    </article>
  );
}

function GalleryCardThumbnail({ design }: { design: PublishedDesign }) {
  if (!design.thumbnail) {
    return (
      <div className="gallery-card__thumbnail gallery-card__thumbnail_empty">
        <Text as="span" variant="caption-2">
          Thumbnail pending
        </Text>
      </div>
    );
  }

  return (
    <picture className="gallery-card__thumbnail">
      <source
        srcSet={withBasePath(design.thumbnail.webpPath)}
        type="image/webp"
      />
      <img
        alt=""
        height={design.thumbnail.height}
        loading="lazy"
        src={withBasePath(design.thumbnail.pngPath)}
        width={design.thumbnail.width}
      />
    </picture>
  );
}

function formatPublishedDate(createdAtMs: number) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(createdAtMs));
}
