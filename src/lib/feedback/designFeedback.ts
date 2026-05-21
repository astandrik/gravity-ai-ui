import { z } from "zod";
import {
  renderInterfaceArgumentsSchema,
  type RenderInterfaceArguments,
} from "@/lib/agent/fixedInterface";
import type { GravityA2uiMessage } from "@/lib/agent/a2uiContract";

export const designFeedbackSchema = z
  .object({
    conversationId: z.string().min(1).max(120),
    turnId: z.string().min(1).max(160),
    rating: z.literal(1),
    prompt: z.string().max(6000).optional(),
    payload: renderInterfaceArgumentsSchema,
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
  payload: RenderInterfaceArguments;
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
