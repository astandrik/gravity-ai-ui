import { describe, expect, it } from "vitest";
import { getA2uiMessageUpdateMode } from "./a2uiMessageStream";

describe("A2UI message stream updates", () => {
  it("treats a shared-prefix extension as append-only", () => {
    const first = { id: "first" };
    const second = { id: "second" };

    expect(getA2uiMessageUpdateMode([first], [first, second])).toBe("append");
  });

  it("treats identical message references as unchanged", () => {
    const first = { id: "first" };
    const second = { id: "second" };

    expect(getA2uiMessageUpdateMode([first, second], [first, second])).toBe(
      "same",
    );
  });

  it("treats shorter or replaced message lists as source replacements", () => {
    const first = { id: "first" };
    const second = { id: "second" };

    expect(getA2uiMessageUpdateMode([first, second], [first])).toBe("replace");
    expect(getA2uiMessageUpdateMode([first], [{ id: "first" }])).toBe(
      "replace",
    );
  });
});
