import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("agent route", () => {
  it("returns a stream error when OPENAI_API_KEY is missing", async () => {
    const previousApiKey = process.env.OPENAI_API_KEY;

    delete process.env.OPENAI_API_KEY;

    try {
      const response = await POST(
        new Request("http://localhost/api/agent", {
          method: "POST",
          body: JSON.stringify({
            kind: "prompt",
            conversationId: "test-conversation",
            prompt: "Build a status panel",
          }),
        }),
      );

      expect(response.status).toBe(200);
      await expect(response.text()).resolves.toContain(
        "OPENAI_API_KEY is not configured",
      );
    } finally {
      if (previousApiKey) {
        process.env.OPENAI_API_KEY = previousApiKey;
      }
    }
  });

  it("rejects malformed requests", async () => {
    const response = await POST(
      new Request("http://localhost/api/agent", {
        method: "POST",
        body: JSON.stringify({
          kind: "prompt",
          conversationId: "test-conversation",
          prompt: "",
        }),
      }),
    );

    expect(response.status).toBe(400);
  });
});
