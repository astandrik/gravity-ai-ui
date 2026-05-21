import { z } from "zod";
import type { GravityA2uiMessage } from "./a2uiContract";

const actionRequestSchema = z
  .object({
    kind: z.literal("action"),
    conversationId: z.string().min(1).max(120),
    surfaceId: z.string().min(1).max(80),
    action: z.unknown(),
    context: z.unknown().optional(),
    dataModel: z.unknown().optional(),
  })
  .strict();

const promptRequestSchema = z
  .object({
    kind: z.literal("prompt"),
    conversationId: z.string().min(1).max(120),
    prompt: z.string().min(1).max(6000),
  })
  .strict();

export const agentRequestSchema = z.union([
  promptRequestSchema,
  actionRequestSchema,
]);

export type AgentRequest = z.infer<typeof agentRequestSchema>;

export type AgentSseEvent =
  | { type: "status"; message: string }
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
