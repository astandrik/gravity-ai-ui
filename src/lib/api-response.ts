import { toPublicUrl } from "@/lib/base-path";

export const API_VERSION = "1";
export const RATE_LIMIT_LIMIT = 60;
export const RATE_LIMIT_WINDOW_SECONDS = 60;

type AgentRateLimit = {
  limit: number;
  remaining: number;
  reset: number;
};

type AgentRateLimitState = {
  windowStartedAtMs: number;
  used: number;
};

let agentRateLimitState: AgentRateLimitState = {
  windowStartedAtMs: Date.now(),
  used: 0,
};

export function readAgentRateLimit(nowMs = Date.now()): AgentRateLimit {
  const windowMs = RATE_LIMIT_WINDOW_SECONDS * 1000;

  if (nowMs >= agentRateLimitState.windowStartedAtMs + windowMs) {
    agentRateLimitState = {
      windowStartedAtMs: nowMs,
      used: 0,
    };
  }

  agentRateLimitState.used += 1;

  return {
    limit: RATE_LIMIT_LIMIT,
    remaining: Math.max(0, RATE_LIMIT_LIMIT - agentRateLimitState.used),
    reset: Math.max(
      1,
      Math.ceil((agentRateLimitState.windowStartedAtMs + windowMs - nowMs) / 1000),
    ),
  };
}

export function resetAgentRateLimitForTests(nowMs = Date.now()): void {
  agentRateLimitState = {
    windowStartedAtMs: nowMs,
    used: 0,
  };
}

export function withAgentResponseHeaders(
  headers?: HeadersInit,
  nowMs = Date.now(),
): Headers {
  const merged = new Headers(headers);
  const rateLimit = readAgentRateLimit(nowMs);

  merged.set("RateLimit-Limit", String(rateLimit.limit));
  merged.set("RateLimit-Remaining", String(rateLimit.remaining));
  merged.set("RateLimit-Reset", String(rateLimit.reset));
  merged.set("API-Version", API_VERSION);

  return merged;
}

export function jsonWithAgentHeaders(
  body: unknown,
  init: ResponseInit = {},
): Response {
  return Response.json(body, {
    ...init,
    headers: withAgentResponseHeaders(init.headers),
  });
}

export function jsonProblem(
  code: string,
  message: string,
  init: ResponseInit & {
    docs?: string;
    issues?: unknown;
  } = {},
): Response {
  const { docs = toPublicUrl("/docs"), issues, ...responseInit } = init;

  return jsonWithAgentHeaders(
    {
      error: {
        code,
        message,
        docs,
        ...(issues === undefined ? {} : { issues }),
      },
    },
    responseInit,
  );
}

export function attachAgentHeaders(response: Response): Response {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: withAgentResponseHeaders(response.headers),
  });
}
