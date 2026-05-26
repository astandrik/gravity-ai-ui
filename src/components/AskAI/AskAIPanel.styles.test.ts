import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(new URL("./AskAIPanel.scss", import.meta.url), "utf8");

describe("AskAIPanel styles", () => {
  it("keeps mobile and desktop breakpoints non-overlapping", () => {
    expect(styles).toContain("@media (min-width: 768px)");
    expect(styles).toContain("@media (max-width: 767.98px)");
    expect(styles).not.toContain("@media (max-width: 768px)");
  });
});
