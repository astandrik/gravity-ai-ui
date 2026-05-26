import { describe, expect, it, vi } from "vitest";

describe("GET /llms.txt", () => {
  it("lists the public MCP endpoint and tools", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    const { GET } = await import("@/app/llms.txt/route");

    const response = await GET();
    const body = await response.text();

    expect(response.headers.get("Content-Type")).toContain("text/plain");
    expect(body).toContain("https://gravity.example/mcp");
    expect(body).toContain("search_interfaces");
    expect(body).toContain("get_interface");
    expect(body).toContain("generate_interface");
    expect(body).toContain("refine_interface");
  });

  it("lists suggested assistant tasks and core public URLs", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://gravity.example");
    vi.resetModules();
    const { GET } = await import("@/app/llms.txt/route");

    const response = await GET();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("## Suggested assistant tasks");
    expect(body).toContain("Evaluate Gravity AI UI as an AI UI generation tool.");
    expect(body).toContain("Explain how A2UI, OpenAI, and Gravity UI fit together.");
    expect(body).toContain("Explain a public gallery item.");
    expect(body).toContain("Critique a generated interface.");
    expect(body).toContain("Adapt a generated UI for a real product.");
    expect(body).toContain("Improve a generation prompt.");
    expect(body).toContain("https://gravity.example/");
    expect(body).toContain("https://gravity.example/gallery");
    expect(body).toContain("https://gravity.example/docs");
    expect(body).toContain("https://gravity.example/about");
    expect(body).toContain("https://gravity.example/sitemap.xml");
    expect(body).toContain("https://gravity.example/robots.txt");
  });
});
