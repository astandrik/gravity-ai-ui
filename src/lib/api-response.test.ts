import { describe, expect, it } from "vitest";
import {
  RATE_LIMIT_MAX_CALLER_KEYS,
  readAgentRateLimit,
  readAgentRateLimitKey,
  readAgentRateLimitStateCountForTests,
  resetAgentRateLimitForTests,
  withAgentResponseHeaders,
} from "@/lib/api-response";

describe("agent API response headers", () => {
  it("accounts for requests when building RateLimit headers", () => {
    resetAgentRateLimitForTests();

    const first = readAgentRateLimit({
      rateLimitKey: "client-a",
      nowMs: 1_000,
    });
    const second = readAgentRateLimit({
      rateLimitKey: "client-a",
      nowMs: 1_000,
    });

    expect(first).toEqual({
      limit: 60,
      remaining: 59,
      reset: 60,
    });
    expect(second).toEqual({
      limit: 60,
      remaining: 58,
      reset: 60,
    });
  });

  it("starts a new accounting window after reset time", () => {
    resetAgentRateLimitForTests();
    readAgentRateLimit({ rateLimitKey: "client-a", nowMs: 1_000 });

    const nextWindow = readAgentRateLimit({
      rateLimitKey: "client-a",
      nowMs: 61_000,
    });

    expect(nextWindow).toEqual({
      limit: 60,
      remaining: 59,
      reset: 60,
    });
  });

  it("uses the accounting result in response headers", () => {
    resetAgentRateLimitForTests();

    const first = withAgentResponseHeaders(undefined, {
      rateLimitKey: "client-a",
      nowMs: 1_000,
    });
    const second = withAgentResponseHeaders(undefined, {
      rateLimitKey: "client-a",
      nowMs: 1_000,
    });

    expect(first.get("RateLimit-Remaining")).toBe("59");
    expect(second.get("RateLimit-Remaining")).toBe("58");
  });

  it("does not share accounting between caller keys", () => {
    resetAgentRateLimitForTests();

    readAgentRateLimit({ rateLimitKey: "client-a", nowMs: 1_000 });
    const otherClient = readAgentRateLimit({
      rateLimitKey: "client-b",
      nowMs: 1_000,
    });

    expect(otherClient).toEqual({
      limit: 60,
      remaining: 59,
      reset: 60,
    });
  });

  it("prunes expired caller windows before storing new keys", () => {
    resetAgentRateLimitForTests();

    readAgentRateLimit({ rateLimitKey: "client-a", nowMs: 1_000 });
    readAgentRateLimit({ rateLimitKey: "client-b", nowMs: 1_000 });

    expect(readAgentRateLimitStateCountForTests()).toBe(2);

    readAgentRateLimit({ rateLimitKey: "client-c", nowMs: 61_000 });

    expect(readAgentRateLimitStateCountForTests()).toBe(1);
  });

  it("caps the number of tracked caller keys", () => {
    resetAgentRateLimitForTests();

    for (let index = 0; index < RATE_LIMIT_MAX_CALLER_KEYS + 2; index += 1) {
      readAgentRateLimit({
        rateLimitKey: `client-${index}`,
        nowMs: 1_000,
      });
    }

    expect(readAgentRateLimitStateCountForTests()).toBe(
      RATE_LIMIT_MAX_CALLER_KEYS,
    );
  });

  it("reads caller keys from proxy headers", () => {
    const request = new Request("https://gravity.example/api/agent", {
      headers: {
        "x-forwarded-for": "203.0.113.10, 198.51.100.2",
      },
    });

    expect(readAgentRateLimitKey(request)).toBe("203.0.113.10");
  });
});
