import { describe, expect, it } from "vitest";
import {
  readAgentRateLimit,
  resetAgentRateLimitForTests,
  withAgentResponseHeaders,
} from "@/lib/api-response";

describe("agent API response headers", () => {
  it("accounts for requests when building RateLimit headers", () => {
    resetAgentRateLimitForTests(1_000);

    const first = readAgentRateLimit(1_000);
    const second = readAgentRateLimit(1_000);

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
    resetAgentRateLimitForTests(1_000);
    readAgentRateLimit(1_000);

    const nextWindow = readAgentRateLimit(61_000);

    expect(nextWindow).toEqual({
      limit: 60,
      remaining: 59,
      reset: 60,
    });
  });

  it("uses the accounting result in response headers", () => {
    resetAgentRateLimitForTests(1_000);

    const first = withAgentResponseHeaders(undefined, 1_000);
    const second = withAgentResponseHeaders(undefined, 1_000);

    expect(first.get("RateLimit-Remaining")).toBe("59");
    expect(second.get("RateLimit-Remaining")).toBe("58");
  });
});
