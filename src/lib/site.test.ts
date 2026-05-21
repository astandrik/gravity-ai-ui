import { describe, expect, it } from "vitest";
import { SITE_NAME, SITE_STACK } from "./site";

describe("site metadata", () => {
  it("defines a named Gravity UI stack", () => {
    expect(SITE_NAME).toBe("Gravity AI UI");
    expect(SITE_STACK).toContain("Gravity UI");
  });
});
