import { z } from "zod";
import {
  composedInterfaceArgumentsSchema,
  type ComposedInterfacePayload,
} from "@/lib/agent/composedInterface";
import type { GravityA2uiMessage } from "@/lib/agent/a2uiContract";

export const designFeedbackSchema = z
  .object({
    conversationId: z.string().min(1).max(120),
    turnId: z.string().min(1).max(160),
    rating: z.literal(1),
    prompt: z.string().max(6000).optional(),
    payload: composedInterfaceArgumentsSchema,
    messages: z.array(z.unknown()).max(12),
    dataModel: z.unknown().optional(),
  })
  .strict();

export type DesignFeedbackInput = z.infer<typeof designFeedbackSchema>;

export type SavedDesignFeedback = DesignFeedbackInput & {
  feedbackId: string;
  createdAtMs: number;
};

export type LikedDesignExample = {
  title: string;
  summary: string;
  prompt?: string;
  payload: ComposedInterfacePayload;
};

export function toSavedFeedback(
  input: DesignFeedbackInput,
): SavedDesignFeedback {
  return {
    ...input,
    feedbackId: createFeedbackId(input),
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
