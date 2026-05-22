import { z } from "zod";
import type { GravityA2uiMessage } from "./a2uiContract";
import {
  composedInterfaceArgumentsSchema,
  type ComposedInterfacePayload,
} from "./composedInterface";

const historyItemSchema = z
  .object({
    role: z.enum(["user", "assistant"]),
    text: z.string().min(1).max(2000),
    surfaceId: z.string().min(1).max(80).optional(),
  })
  .strict();

const conversationContextSchema = z
  .object({
    history: z.array(historyItemSchema).max(12).optional(),
    latestSurfaceId: z.string().min(1).max(80).optional(),
    latestPayload: composedInterfaceArgumentsSchema.optional(),
    latestDataModel: z.unknown().optional(),
  })
  .strict();

const actionRequestSchema = z
  .object({
    kind: z.literal("action"),
    conversationId: z.string().min(1).max(120),
    surfaceId: z.string().min(1).max(80),
    action: z.unknown(),
    context: z.unknown().optional(),
    dataModel: z.unknown().optional(),
    conversationContext: conversationContextSchema.optional(),
  })
  .strict();

const promptRequestSchema = z
  .object({
    kind: z.literal("prompt"),
    conversationId: z.string().min(1).max(120),
    prompt: z.string().min(1).max(6000),
    conversationContext: conversationContextSchema.optional(),
  })
  .strict();

export const agentRequestSchema = z.union([
  promptRequestSchema,
  actionRequestSchema,
]);

export type AgentRequest = z.infer<typeof agentRequestSchema>;
export type ConversationContext = z.infer<typeof conversationContextSchema>;

export type AgentSseEvent =
  | { type: "status"; message: string }
  | { type: "payload"; payload: ComposedInterfacePayload }
  | { type: "a2ui"; message: GravityA2uiMessage }
  | { type: "error"; message: string }
  | { type: "done" };

export function encodeSseEvent(event: AgentSseEvent) {
  const payload = JSON.stringify(event);

  return `event: ${event.type}\ndata: ${payload}\n\n`;
}

export function createSseEncoder() {
  const encoder = new TextEncoder();

  return (event: AgentSseEvent) => encoder.encode(encodeSseEvent(event));
}
