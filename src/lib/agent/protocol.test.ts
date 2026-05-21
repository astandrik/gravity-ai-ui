import { describe, expect, it } from "vitest";
import { encodeSseEvent } from "./protocol";

describe("agent SSE protocol", () => {
  it("encodes named server-sent events", () => {
    expect(encodeSseEvent({ type: "status", message: "Rendering" })).toBe(
      'event: status\ndata: {"type":"status","message":"Rendering"}\n\n',
    );
  });
});
