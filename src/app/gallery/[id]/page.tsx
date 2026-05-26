import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  Button,
  Container,
  Label,
  Text,
} from "@/components/GravityUI/GravityUI";
import { AskAIPanel } from "@/components/AskAI/AskAIPanel";
import {
  ASK_AI_GALLERY_DETAIL,
  ASK_AI_PRODUCT_NAME,
  buildGalleryAskAIPrompt,
} from "@/components/AskAI/ask-ai-content";
import { InterfaceInspector } from "@/components/InterfaceInspector/InterfaceInspector";
import { buildReactCode } from "@/lib/agent/reactCode";
import { toPublicUrl, withBasePath } from "@/lib/base-path";
import type { PublishedDesign } from "@/lib/feedback/designFeedback";
import { getPublishedDesignById } from "@/lib/feedback/ydbFeedbackStore";
import {
  buildGalleryDesignJsonLd,
  serializeGalleryDesignJsonLd,
} from "@/lib/gallery/designJsonLd";
import {
  getSiteSocialImageUrl,
  SITE_IMAGE_ALT,
  SITE_NAME,
  SOCIAL_IMAGE,
} from "@/lib/site";

import "../page.scss";

type GalleryDesignPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: GalleryDesignPageProps): Promise<Metadata> {
  const { id } = await params;
  const design = await getPublishedDesignById(id).catch(() => null);

  if (!design) {
    return {
      title: {
        absolute: `Interface not found - ${SITE_NAME}`,
      },
      alternates: {
        canonical: withBasePath(`/gallery/${id}`),
      },
    };
  }

  const title = `${design.title} - Gallery - ${SITE_NAME}`;
  const canonicalPath = `/gallery/${design.id}`;
  const socialImage = getGalleryDesignSocialImage(design);

  return {
    title: {
      absolute: title,
    },
    description: design.summary,
    alternates: {
      canonical: withBasePath(canonicalPath),
    },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      title,
      description: design.summary,
      url: withBasePath(canonicalPath),
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: design.summary,
      images: [socialImage],
    },
  };
}

export default async function GalleryDesignPage({
  params,
}: GalleryDesignPageProps) {
  const { id } = await params;
  const result = await loadPublishedDesign(id);

  if (result.status === "not-found") {
    notFound();
  }

  if (result.status === "error") {
    return (
      <main className="page-shell">
        <Container maxWidth="xl" gutters={5}>
          <section className="gallery-detail" aria-labelledby="gallery-detail-title">
            <Button view="outlined" href={withBasePath("/gallery")}>
              Back to gallery
            </Button>
            <div className="gallery-notice" role="status">
              <Text as="h1" id="gallery-detail-title" variant="header-1">
                Interface is temporarily unavailable
              </Text>
              <Text as="p" variant="body-2" color="secondary">
                The published interface could not be loaded from storage.
              </Text>
            </div>
          </section>
        </Container>
      </main>
    );
  }

  const { design } = result;
  const canonicalPageUrl = toPublicUrl(`/gallery/${design.id}`);
  const socialImage = getGalleryDesignSocialImage(design);
  const reactCode = buildReactCode(design.payload);
  const jsonLd = buildGalleryDesignJsonLd({
    canonicalUrl: canonicalPageUrl,
    createdAtMs: design.createdAtMs,
    imageUrl: socialImage.url,
    summary: design.summary,
    title: design.title,
  });

  return (
    <main className="page-shell">
      <Container maxWidth="xl" gutters={5}>
        <article className="gallery-detail" aria-labelledby="gallery-detail-title">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: serializeGalleryDesignJsonLd(jsonLd),
            }}
          />
          <div className="gallery-detail__topbar">
            <Button view="outlined" href={withBasePath("/gallery")}>
              Back to gallery
            </Button>
            <Label theme="success" size="s">
              Published
            </Label>
          </div>

          <header className="gallery-detail__header">
            <Text as="h1" id="gallery-detail-title" variant="display-2">
              {design.title}
            </Text>
            <Text
              as="p"
              variant="body-2"
              color="secondary"
              className="gallery-detail__summary"
            >
              {design.summary}
            </Text>
            <time dateTime={new Date(design.createdAtMs).toISOString()}>
              {formatPublishedDate(design.createdAtMs)}
            </time>
          </header>

          <AskAIPanel
            productName={ASK_AI_PRODUCT_NAME}
            label={ASK_AI_GALLERY_DETAIL.label}
            helperText={ASK_AI_GALLERY_DETAIL.helperText}
            prompt={buildGalleryAskAIPrompt(canonicalPageUrl)}
            page={ASK_AI_GALLERY_DETAIL.page}
            promptVariant={ASK_AI_GALLERY_DETAIL.promptVariant}
            contextId={design.id}
          />

          <InterfaceInspector payload={design.payload} />

          <section
            className="gallery-detail__retrieval"
            aria-labelledby="gallery-retrieval-title"
          >
            <div className="gallery-detail__retrieval-copy">
              <Text as="h2" id="gallery-retrieval-title" variant="subheader-3">
                Public retrieval context
              </Text>
              <Text as="p" variant="body-2" color="secondary">
                This public gallery page exposes the generated interface title,
                summary, canonical URL, thumbnail, and React export. Original
                prompt history is not exposed.
              </Text>
            </div>
            <dl className="gallery-detail__retrieval-list">
              <div>
                <dt>Title</dt>
                <dd>{design.title}</dd>
              </div>
              <div>
                <dt>Use case summary</dt>
                <dd>{design.summary}</dd>
              </div>
              <div>
                <dt>Canonical URL</dt>
                <dd>
                  <a href={canonicalPageUrl}>{canonicalPageUrl}</a>
                </dd>
              </div>
              <div>
                <dt>Preview image</dt>
                <dd>
                  <a href={socialImage.url}>{socialImage.url}</a>
                </dd>
              </div>
            </dl>
            <details className="gallery-detail__code">
              <summary>Generated React code</summary>
              <pre>
                <code>{reactCode}</code>
              </pre>
            </details>
          </section>
        </article>
      </Container>
    </main>
  );
}

async function loadPublishedDesign(id: string) {
  try {
    const design = await getPublishedDesignById(id);

    if (!design) {
      return { status: "not-found" as const };
    }

    return { status: "ok" as const, design };
  } catch {
    return { status: "error" as const };
  }
}

function formatPublishedDate(createdAtMs: number) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(createdAtMs));
}

function getGalleryDesignSocialImage(design: PublishedDesign) {
  if (!design.thumbnail) {
    return {
      url: getSiteSocialImageUrl(),
      secureUrl: getSiteSocialImageUrl(),
      width: SOCIAL_IMAGE.width,
      height: SOCIAL_IMAGE.height,
      alt: SITE_IMAGE_ALT,
      type: "image/png",
    };
  }

  return {
    url: toPublicUrl(design.thumbnail.pngPath),
    secureUrl: toPublicUrl(design.thumbnail.pngPath),
    width: design.thumbnail.width,
    height: design.thumbnail.height,
    alt: `${design.title} interface thumbnail`,
    type: "image/png",
  };
}
