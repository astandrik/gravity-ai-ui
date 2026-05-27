import { agentRequestSchema, createSseEncoder } from "@/lib/agent/protocol";
import { streamAgentResponse } from "@/lib/agent/openaiAgent";
import {
  jsonProblem,
  readAgentRateLimitKey,
  withAgentResponseHeaders,
} from "@/lib/api-response";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rateLimitKey = readAgentRateLimitKey(request);
  const body = await request.json().catch(() => null);
  const parsed = agentRequestSchema.safeParse(body);

  if (!parsed.success) {
    return jsonProblem(
      "invalid_agent_request",
      "Invalid agent request.",
      {
        status: 400,
        issues: parsed.error.flatten(),
      },
      { rateLimitKey },
    );
  }

  const encode = createSseEncoder();
  const apiKey = process.env.OPENAI_API_KEY;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (event: Parameters<typeof encode>[0]) => {
        controller.enqueue(encode(event));
      };

      void (async () => {
        try {
          if (!apiKey) {
            send({
              type: "error",
              message: "OPENAI_API_KEY is not configured.",
            });
            return;
          }

          await streamAgentResponse({
            request: parsed.data,
            apiKey,
            signal: request.signal,
            onEvent: send,
          });
        } catch (error) {
          send({
            type: "error",
            message:
              error instanceof Error
                ? error.message
                : "Agent stream failed unexpectedly.",
          });
        } finally {
          send({ type: "done" });
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: withAgentResponseHeaders(
      {
        "Cache-Control": "no-store, no-transform",
        Connection: "keep-alive",
        "Content-Type": "text/event-stream; charset=utf-8",
        "X-Accel-Buffering": "no",
      },
      { rateLimitKey },
    ),
  });
}
