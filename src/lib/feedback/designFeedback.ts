import { z } from "zod";
import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import {
  composedInterfaceArgumentsSchema,
  type ComposedInterfacePayload,
} from "@/lib/agent/composedInterface";
import type { GravityA2uiMessage } from "@/lib/agent/a2uiContract";

const MAX_STORED_FEEDBACK_MESSAGES = 12;

const feedbackMessagesSchema = z.preprocess(
  (value) =>
    Array.isArray(value)
      ? value.slice(-MAX_STORED_FEEDBACK_MESSAGES)
      : value,
  z.array(z.unknown()).max(MAX_STORED_FEEDBACK_MESSAGES).default([]),
);

export const designFeedbackSchema = z
  .object({
    conversationId: z.string().min(1).max(120),
    turnId: z.string().min(1).max(160),
    rating: z.literal(1),
    publish: z.literal(true),
    prompt: z.string().max(6000).optional(),
    payload: composedInterfaceArgumentsSchema,
    messages: feedbackMessagesSchema,
    dataModel: z.unknown().optional(),
  })
  .strict();

export type DesignFeedbackInput = z.infer<typeof designFeedbackSchema>;

export type SavedDesignFeedback = DesignFeedbackInput & {
  feedbackId: string;
  gallerySlug: string;
  createdAtMs: number;
};

export type LikedDesignExample = {
  title: string;
  summary: string;
  prompt?: string;
  payload: ComposedInterfacePayload;
};

export type PublishedDesign = {
  id: string;
  title: string;
  summary: string;
  prompt?: string;
  payload: ComposedInterfacePayload;
  surfaceId: string;
  createdAtMs: number;
  thumbnail?: PublishedDesignThumbnail;
};

export type PublishedDesignThumbnail = {
  width: number;
  height: number;
  generatedAtMs: number;
  webpPath: string;
  pngPath: string;
};

export function toSavedFeedback(
  input: DesignFeedbackInput,
): SavedDesignFeedback {
  const feedbackId = createFeedbackId(input);

  return {
    ...input,
    feedbackId,
    gallerySlug: createPublishedDesignSlug(
      getFeedbackPayloadTitle(input.payload),
      feedbackId,
    ),
    createdAtMs: Date.now(),
    messages: input.messages as GravityA2uiMessage[],
  };
}

function createFeedbackId(input: DesignFeedbackInput) {
  const suffix =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `${input.conversationId}:${input.turnId}:${input.rating}:${suffix}`;
}

export function encodePublishedDesignId(feedbackId: string) {
  return Buffer.from(feedbackId, "utf8").toString("base64url");
}

export function createPublishedDesignSlug(title: string, feedbackId: string) {
  const base = slugifyTitle(title);
  const token = getFeedbackIdToken(feedbackId);

  return `${base}-${token}`;
}

export function isPublishedDesignSlug(id: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*-[a-z0-9]{10,16}$/.test(id);
}

export function decodePublishedDesignId(id: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    return null;
  }

  const feedbackId = Buffer.from(id, "base64url").toString("utf8");

  if (
    !feedbackId ||
    feedbackId.length > 512 ||
    /[\u0000-\u001f]/.test(feedbackId) ||
    encodePublishedDesignId(feedbackId) !== id
  ) {
    return null;
  }

  return feedbackId;
}

function slugifyTitle(title: string) {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 72)
    .replace(/-+$/g, "");

  return slug || "interface";
}

function getFeedbackIdToken(feedbackId: string) {
  const suffix = feedbackId.split(":").at(-1) ?? feedbackId;
  const compactSuffix = suffix.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (compactSuffix.length >= 10) {
    return compactSuffix.slice(0, 12);
  }

  return createHash("sha256").update(feedbackId).digest("hex").slice(0, 12);
}

export function getFeedbackPayloadTitle(payload: ComposedInterfacePayload) {
  const heading = payload.nodes.find(
    (node) =>
      node.component === "Text" &&
      (node.props.variant === "h1" ||
        node.props.variant === "h2" ||
        node.props.variant === "h3"),
  );
  const headingText = readPayloadString(heading?.props.text, payload.dataModel);

  if (headingText) {
    return headingText;
  }

  for (const node of payload.nodes) {
    const title = readPayloadString(node.props.title, payload.dataModel);

    if (title) {
      return title;
    }
  }

  return "Generated interface";
}

export function getFeedbackPayloadSummary(payload: ComposedInterfacePayload) {
  const counts = new Map<string, number>();

  for (const node of payload.nodes) {
    counts.set(node.component, (counts.get(node.component) ?? 0) + 1);
  }

  const topCounts = [...counts.entries()]
    .sort((left, right) =>
      right[1] === left[1]
        ? left[0].localeCompare(right[0])
        : right[1] - left[1],
    )
    .slice(0, 6)
    .map(([component, count]) => `${component} x${count}`);

  return topCounts.length > 0
    ? `Composed tree with ${payload.nodes.length} nodes: ${topCounts.join(", ")}.`
    : "Composed tree with no visible nodes.";
}

function readString(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";

  return text || null;
}

function readPayloadString(value: unknown, dataModel: unknown) {
  if (isRecord(value) && typeof value.path === "string") {
    return readString(readJsonPointer(dataModel, value.path));
  }

  return readString(value);
}

function readJsonPointer(source: unknown, path: string) {
  if (path === "/") {
    return source;
  }

  return path
    .split("/")
    .slice(1)
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce<unknown>((current, key) => {
      if (!isRecord(current) && !Array.isArray(current)) {
        return undefined;
      }

      return (current as Record<string, unknown>)[key];
    }, source);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
