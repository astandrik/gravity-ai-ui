import { describe, expect, it } from "vitest";
import {
  pickRandomStarterPrompts,
  POPULAR_STARTER_PROMPTS,
} from "./starterPrompts";

describe("starter prompts", () => {
  it("contains exactly 300 unique prompts", () => {
    expect(POPULAR_STARTER_PROMPTS).toHaveLength(300);
    expect(new Set(POPULAR_STARTER_PROMPTS).size).toBe(300);
    expect(POPULAR_STARTER_PROMPTS.every((prompt) => prompt.length > 20)).toBe(
      true,
    );
  });

  it("returns three distinct random prompts by default", () => {
    const prompts = pickRandomStarterPrompts(3, () => 0.42);

    expect(prompts).toHaveLength(3);
    expect(new Set(prompts).size).toBe(3);
    prompts.forEach((prompt) => {
      expect(POPULAR_STARTER_PROMPTS).toContain(prompt);
    });
  });
});
