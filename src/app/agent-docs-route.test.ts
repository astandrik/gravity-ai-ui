import { describe, expect, it, vi } from "vitest";

const resourceRoutes = [
  ["llms-full.txt", "@/app/llms-full.txt/route"],
  ["developers.md", "@/app/developers.md/route"],
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
    expect(body).toContain("curl -X POST https://gravity.example/mcp");
  });
});
