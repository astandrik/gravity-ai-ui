import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const aiVisibilityComponents = [
  "ComparisonArticle.tsx",
  "GuideArticle.tsx",
] as const;

describe("AiVisibility style imports", () => {
  it.each(aiVisibilityComponents)(
    "%s does not depend on route-level page styles",
    (fileName) => {
      const source = readFileSync(
        join(process.cwd(), "src/components/AiVisibility", fileName),
        "utf8",
      );

      expect(source).not.toMatch(/@\/app\/.+\/page\.scss/);
    },
  );
});
