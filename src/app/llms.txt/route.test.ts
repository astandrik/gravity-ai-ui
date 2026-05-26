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
});
