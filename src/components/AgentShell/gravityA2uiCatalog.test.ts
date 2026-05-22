import { describe, expect, it } from "vitest";
import { getGravityIconData } from "./gravityIconData";

describe("Gravity A2UI catalog icon mapping", () => {
  it("normalizes action-like icon aliases at render time", () => {
    expect(getGravityIconData("open_details")).toBe(
      getGravityIconData("arrowRight"),
    );
  });

  it("omits unknown runtime icon names", () => {
    expect(getGravityIconData("unknown_icon")).toBeNull();
    expect(getGravityIconData("toString")).toBeNull();
    expect(getGravityIconData("constructor")).toBeNull();
  });
});
