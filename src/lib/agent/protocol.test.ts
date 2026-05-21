import { describe, expect, it } from "vitest";
import { agentRequestSchema, encodeSseEvent } from "./protocol";

describe("agent SSE protocol", () => {
  it("encodes named server-sent events", () => {
    expect(encodeSseEvent({ type: "status", message: "Rendering" })).toBe(
      'event: status\ndata: {"type":"status","message":"Rendering"}\n\n',
    );
  });

  it("encodes fixed interface payload events", () => {
    const payload = {
      sequence: 0,
      surfaceId: "main",
      title: "Review",
      titleIcon: null,
      summary: "Generated shell payload",
      tone: "info" as const,
      layout: {
        density: "comfortable" as const,
        sectionDividers: "minimal" as const,
      },
      alerts: [],
      metrics: [],
      sections: [],
      fields: [],
      tables: [],
      progress: [],
      descriptions: [],
      links: [],
      users: [],
      labels: [],
      tabs: [],
      emptyStates: [],
      loadingStates: [],
      breadcrumbs: [],
      steppers: [],
      accordions: [],
      copyLists: [],
      actions: [],
      navigation: [],
    };

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
              text: "Launch checklist\nActions: Continue",
              surfaceId: "main",
            },
          ],
          latestSurfaceId: "main",
          latestPayload: {
            sequence: 0,
            surfaceId: "main",
            title: "Launch checklist",
            titleIcon: null,
            summary: "Review launch readiness.",
            tone: "info",
            layout: {
              density: "comfortable",
              sectionDividers: "minimal",
            },
            alerts: [],
            metrics: [],
            sections: [],
            fields: [],
            tables: [],
            progress: [],
            descriptions: [],
            links: [],
            users: [],
            labels: [],
            tabs: [],
            emptyStates: [],
            loadingStates: [],
            breadcrumbs: [],
            steppers: [],
            accordions: [],
            copyLists: [],
            actions: [],
            navigation: [],
          },
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
