import { describe, expect, it } from "vitest";
import { agentRequestSchema, encodeSseEvent } from "./protocol";

const payload = {
  sequence: 0,
  surfaceId: "main",
  dataModel: {
    title: "Review",
  },
  root: {
    component: "Column" as const,
    props: {
      gap: "normal" as const,
      align: "stretch" as const,
    },
  },
  nodes: [
    {
      id: "title",
      parentId: "root",
      order: 0,
      component: "Text" as const,
      props: {
        text: { path: "/title" },
        variant: "h2",
      },
    },
  ],
};

describe("agent SSE protocol", () => {
  it("encodes named server-sent events", () => {
    expect(encodeSseEvent({ type: "status", message: "Rendering" })).toBe(
      'event: status\ndata: {"type":"status","message":"Rendering"}\n\n',
    );
  });

  it("encodes composed interface payload events", () => {
    expect(encodeSseEvent({ type: "payload", payload })).toBe(
      `event: payload\ndata: ${JSON.stringify({ type: "payload", payload })}\n\n`,
    );
  });

  it("accepts compact conversation context on prompt requests", () => {
    expect(
      agentRequestSchema.parse({
        kind: "prompt",
        conversationId: "conversation_1",
        prompt: "Refine this interface",
        conversationContext: {
          history: [
            {
              role: "user",
              text: "Create a launch checklist",
            },
            {
              role: "assistant",
              text: "Launch checklist\nComponents: Text x1",
              surfaceId: "main",
            },
          ],
          latestSurfaceId: "main",
          latestPayload: payload,
          latestDataModel: {
            title: "Launch checklist",
          },
        },
      }),
    ).toMatchObject({
      kind: "prompt",
      conversationContext: {
        latestSurfaceId: "main",
        history: expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            text: "Create a launch checklist",
          }),
        ]),
      },
    });
  });
});
