import { toPublicUrl } from "@/lib/base-path";

export const API_VERSION = "1";
export const RATE_LIMIT_LIMIT = 60;
export const RATE_LIMIT_WINDOW_SECONDS = 60;
export const RATE_LIMIT_MAX_CALLER_KEYS = 2048;

type AgentRateLimit = {
  limit: number;
  remaining: number;
  reset: number;
};

type AgentRateLimitOptions = {
  rateLimitKey?: string;
  nowMs?: number;
};

type AgentRateLimitState = {
  windowStartedAtMs: number;
  used: number;
};

const DEFAULT_RATE_LIMIT_KEY = "anonymous";
const agentRateLimitStates = new Map<string, AgentRateLimitState>();

export function readAgentRateLimit(
  options: AgentRateLimitOptions = {},
): AgentRateLimit {
  const { rateLimitKey = DEFAULT_RATE_LIMIT_KEY, nowMs = Date.now() } = options;
  const windowMs = RATE_LIMIT_WINDOW_SECONDS * 1000;

  pruneExpiredRateLimitWindows(nowMs, windowMs);

  const currentState = agentRateLimitStates.get(rateLimitKey) ?? {
    windowStartedAtMs: nowMs,
    used: 0,
  };

  const nextState =
    nowMs >= currentState.windowStartedAtMs + windowMs
      ? {
          windowStartedAtMs: nowMs,
          used: 1,
        }
      : {
          windowStartedAtMs: currentState.windowStartedAtMs,
          used: currentState.used + 1,
        };

  agentRateLimitStates.set(rateLimitKey, nextState);
  pruneOldestRateLimitWindows();

  return {
    limit: RATE_LIMIT_LIMIT,
    remaining: Math.max(0, RATE_LIMIT_LIMIT - nextState.used),
    reset: Math.max(
      1,
      Math.ceil((nextState.windowStartedAtMs + windowMs - nowMs) / 1000),
    ),
  };
}

export function readAgentRateLimitKey(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    DEFAULT_RATE_LIMIT_KEY
  );
}

export function resetAgentRateLimitForTests(): void {
  agentRateLimitStates.clear();
}

export function readAgentRateLimitStateCountForTests(): number {
  return agentRateLimitStates.size;
}

export function withAgentResponseHeaders(
  headers?: HeadersInit,
  options: AgentRateLimitOptions = {},
): Headers {
  const merged = new Headers(headers);
  const rateLimit = readAgentRateLimit(options);

  merged.set("RateLimit-Limit", String(rateLimit.limit));
  merged.set("RateLimit-Remaining", String(rateLimit.remaining));
  merged.set("RateLimit-Reset", String(rateLimit.reset));
  merged.set("API-Version", API_VERSION);

  return merged;
}

export function jsonWithAgentHeaders(
  body: unknown,
  init: ResponseInit = {},
  options: AgentRateLimitOptions = {},
): Response {
  return Response.json(body, {
    ...init,
    headers: withAgentResponseHeaders(init.headers, options),
  });
}

export function jsonProblem(
  code: string,
  message: string,
  init: ResponseInit & {
    docs?: string;
    issues?: unknown;
  } = {},
  options: AgentRateLimitOptions = {},
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
    options,
  );
}

export function attachAgentHeaders(
  response: Response,
  options: AgentRateLimitOptions = {},
): Response {
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: withAgentResponseHeaders(response.headers, options),
  });
}

function pruneExpiredRateLimitWindows(nowMs: number, windowMs: number): void {
  for (const [key, state] of agentRateLimitStates) {
    if (nowMs >= state.windowStartedAtMs + windowMs) {
      agentRateLimitStates.delete(key);
    }
  }
}

function pruneOldestRateLimitWindows(): void {
  for (const key of agentRateLimitStates.keys()) {
    if (agentRateLimitStates.size <= RATE_LIMIT_MAX_CALLER_KEYS) {
      return;
    }

    agentRateLimitStates.delete(key);
  }
}
