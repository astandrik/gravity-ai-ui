import { describe, expect, it, vi } from "vitest";

const resourceRoutes = [
  ["llms-full.txt", "@/app/llms-full.txt/route"],
  ["developers.md", "@/app/developers.md/route"],
  ["index.md", "@/app/index.md/route"],
  ["docs.md", "@/app/docs.md/route"],
  ["compare.md", "@/app/compare.md/route"],
  ["gravity-ai-ui-vs-v0.md", "@/app/compare/gravity-ai-ui-vs-v0.md/route"],
  [
    "gravity-ai-ui-vs-lovable.md",
    "@/app/compare/gravity-ai-ui-vs-lovable.md/route",
  ],
  [
    "gravity-ai-ui-vs-figma.md",
    "@/app/compare/gravity-ai-ui-vs-figma.md/route",
  ],
  [
    "gravity-ai-ui-vs-uizard.md",
    "@/app/compare/gravity-ai-ui-vs-uizard.md/route",
  ],
  [
    "a2ui-openai-gravity-ui.md",
    "@/app/guides/a2ui-openai-gravity-ui.md/route",
  ],
  ["mcp-ui-generator.md", "@/app/guides/mcp-ui-generator.md/route"],
  [
    "structured-ui-output-vs-jsx.md",
    "@/app/guides/structured-ui-output-vs-jsx.md/route",
  ],
  [
    "best-ai-ui-generator-for-agents.md",
    "@/app/best-ai-ui-generator-for-agents.md/route",
  ],
  ["auth.md", "@/app/auth.md/route"],
  ["webhooks.md", "@/app/webhooks.md/route"],
  ["mcp.md", "@/app/mcp.md/route"],
] as const;

describe("agent-readable documentation routes", () => {
  it.each(resourceRoutes)("serves %s as markdown/plain text", async (_name, route) => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import(route);

    const response = await GET();
    const body = await response.text();

    expect(response.headers.get("Content-Type")).toMatch(/text\/(plain|markdown)/);
    expect(body).toContain("Gravity AI UI");
    expect(body).toContain("OpenAPI");
    expect(body).toContain("MCP");
  });

  it("llms-full.txt includes API, auth, webhook, and quickstart coverage", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import("@/app/llms-full.txt/route");

    const body = await (await GET()).text();
    const nonEmptyLines = body.split("\n").filter((line) => line.trim()).length;

    expect(nonEmptyLines).toBeGreaterThanOrEqual(20);
    expect(body).toContain("Gravity AI UI API docs");
    expect(body).toContain("https://gravity.example/openapi.json");
    expect(body).toContain("OAuth metadata");
    expect(body).toContain("Webhooks are not currently supported");
    expect(body).toContain("https://gravity.example/.well-known/agent.json");
    expect(body).not.toContain(
      "https://gravity.example/.well-known/agent-card.json",
    );
    expect(body).toContain("https://gravity.example/.well-known/mcp.json");
    expect(body).toContain("https://gravity.example/index.md");
    expect(body).toContain(
      "https://gravity.example/best-ai-ui-generator-for-agents",
    );
    expect(body).toContain(
      "https://gravity.example/compare/gravity-ai-ui-vs-v0",
    );
    expect(body).toContain(
      "https://gravity.example/guides/mcp-ui-generator",
    );
    expect(body).toContain(
      "https://gravity.example/guides/structured-ui-output-vs-jsx",
    );
    expect(body).toContain("curl -X POST https://gravity.example/mcp");
  });
});
