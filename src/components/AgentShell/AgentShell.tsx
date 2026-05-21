"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { A2uiClientAction } from "@a2ui/web_core/v0_9";
import {
  Button,
  Container,
  Label,
  Text,
  TextInput,
} from "@/components/GravityUI/GravityUI";
import type { GravityA2uiMessage } from "@/lib/agent/a2uiContract";
import type { AgentRequest, AgentSseEvent } from "@/lib/agent/protocol";
import {
  A2uiSurface,
  createGravityA2uiProcessor,
  type GravitySurface,
} from "./gravityA2uiCatalog";

type UserTurn = {
  id: string;
  role: "user";
  content: string;
};

type AssistantTurn = {
  id: string;
  role: "assistant";
  messages: GravityA2uiMessage[];
  status: string;
  error?: string;
  done: boolean;
};

type ChatTurn = UserTurn | AssistantTurn;

const starterPrompts = [
  "Build a compact incident triage panel with severity, owner, and next actions.",
  "Create an onboarding checklist for an AI product team.",
  "Draft a support escalation form with priority choices.",
] as const;

export function AgentShell() {
  const [conversationId] = useState(() => createId("conversation"));
  const [prompt, setPrompt] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const updateAssistantTurn = useCallback(
    (turnId: string, update: (turn: AssistantTurn) => AssistantTurn) => {
      setTurns((currentTurns) =>
        currentTurns.map((turn) =>
          turn.id === turnId && turn.role === "assistant"
            ? update(turn)
            : turn,
        ),
      );
    },
    [],
  );

  const sendAgentRequest = useCallback(
    async (request: AgentRequest, userContent?: string) => {
      const assistantId = createId("assistant");
      const nextTurns: ChatTurn[] = [];

      if (userContent) {
        nextTurns.push({
          id: createId("user"),
          role: "user",
          content: userContent,
        });
      }

      nextTurns.push({
        id: assistantId,
        role: "assistant",
        messages: [],
        status: "Starting",
        done: false,
      });

      setTurns((currentTurns) => [...currentTurns, ...nextTurns]);
      setIsStreaming(true);

      abortControllerRef.current?.abort();
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const response = await fetch("/api/agent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(request),
          signal: abortController.signal,
        });

        if (!response.ok || !response.body) {
          throw new Error(`Agent request failed with ${response.status}`);
        }

        await readAgentStream(response.body, (event) => {
          updateAssistantTurn(assistantId, (turn) => {
            if (event.type === "status") {
              return { ...turn, status: event.message };
            }

            if (event.type === "a2ui") {
              return {
                ...turn,
                messages: [...turn.messages, event.message],
                status: "Rendering",
              };
            }

            if (event.type === "error") {
              return {
                ...turn,
                error: event.message,
                status: "Error",
              };
            }

            return { ...turn, done: true, status: "Done" };
          });
        });
      } catch (error) {
        if (!abortController.signal.aborted) {
          updateAssistantTurn(assistantId, (turn) => ({
            ...turn,
            error:
              error instanceof Error
                ? error.message
                : "Agent request failed unexpectedly.",
            status: "Error",
          }));
        }
      } finally {
        if (abortControllerRef.current === abortController) {
          abortControllerRef.current = null;
          setIsStreaming(false);
        }
      }
    },
    [updateAssistantTurn],
  );

  const submitPrompt = useCallback(
    (value: string) => {
      const trimmedPrompt = value.trim();

      if (!trimmedPrompt || isStreaming) {
        return;
      }

      setPrompt("");
      void sendAgentRequest(
        {
          kind: "prompt",
          conversationId,
          prompt: trimmedPrompt,
        },
        trimmedPrompt,
      );
    },
    [conversationId, isStreaming, sendAgentRequest],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitPrompt(prompt);
  };

  const onAction = useCallback(
    (action: A2uiClientAction) => {
      void sendAgentRequest(
        {
          kind: "action",
          conversationId,
          surfaceId: action.surfaceId,
          action,
          context: action.context,
        },
        `Action: ${action.name}`,
      );
    },
    [conversationId, sendAgentRequest],
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return (
    <main className="agent-page">
      <Container maxWidth="xl" gutters={5}>
        <section className="agent-shell" aria-labelledby="agent-title">
          <header className="agent-shell__header">
            <div>
              <Label theme="info" size="m">
                A2UI shell
              </Label>
              <Text
                as="h1"
                id="agent-title"
                variant="display-2"
                className="agent-shell__title"
              >
                Gravity AI UI
              </Text>
            </div>
            <div className="agent-shell__status" aria-live="polite">
              <span className={isStreaming ? "is-active" : ""} />
              {isStreaming ? "Streaming" : "Ready"}
            </div>
          </header>

          <div className="agent-workbench">
            <section className="agent-timeline" aria-label="Conversation">
              {turns.length === 0 ? (
                <div className="agent-empty">
                  <Text as="h2" variant="header-1">
                    Compose a Gravity UI surface
                  </Text>
                  <Text as="p" variant="body-2" color="secondary">
                    Start with a product workflow, dashboard, form, or triage
                    task.
                  </Text>
                  <div className="agent-empty__prompts">
                    {starterPrompts.map((starterPrompt) => (
                      <Button
                        key={starterPrompt}
                        disabled={isStreaming}
                        onClick={() => submitPrompt(starterPrompt)}
                        size="m"
                        view="outlined"
                      >
                        {starterPrompt}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                turns.map((turn) =>
                  turn.role === "user" ? (
                    <UserMessage key={turn.id} turn={turn} />
                  ) : (
                    <AssistantMessage
                      key={turn.id}
                      onAction={onAction}
                      turn={turn}
                    />
                  ),
                )
              )}
            </section>

            <form className="agent-composer" onSubmit={onSubmit}>
              <TextInput
                disabled={isStreaming}
                hasClear
                onUpdate={setPrompt}
                placeholder="Build an incident dashboard with owners and next actions"
                size="xl"
                value={prompt}
              />
              <Button
                disabled={isStreaming || !prompt.trim()}
                size="xl"
                type="submit"
                view="action"
              >
                Send
              </Button>
            </form>
          </div>
        </section>
      </Container>
    </main>
  );
}

function UserMessage({ turn }: { turn: UserTurn }) {
  return (
    <article className="agent-turn agent-turn_user">
      <Text as="p" variant="body-2">
        {turn.content}
      </Text>
    </article>
  );
}

function AssistantMessage({
  onAction,
  turn,
}: {
  onAction: (action: A2uiClientAction) => void;
  turn: AssistantTurn;
}) {
  return (
    <article className="agent-turn agent-turn_assistant">
      <div className="agent-turn__meta">
        <span>{turn.status}</span>
      </div>
      {turn.messages.length > 0 ? (
        <A2uiMessageRenderer messages={turn.messages} onAction={onAction} />
      ) : null}
      {turn.error ? (
        <div className="agent-error" role="alert">
          <Text as="h2" variant="subheader-2">
            Interface rejected
          </Text>
          <Text as="p" variant="body-2" color="secondary">
            {turn.error}
          </Text>
        </div>
      ) : null}
      {!turn.done && !turn.error ? <div className="agent-loader" /> : null}
    </article>
  );
}

function A2uiMessageRenderer({
  messages,
  onAction,
}: {
  messages: GravityA2uiMessage[];
  onAction: (action: A2uiClientAction) => void;
}) {
  const processedCountRef = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [processor] = useState(() => createGravityA2uiProcessor(onAction));
  const [surfaces, setSurfaces] = useState<GravitySurface[]>(() =>
    Array.from(processor.model.surfacesMap.values()),
  );

  useEffect(() => {
    const syncSurfaces = () =>
      setSurfaces(Array.from(processor.model.surfacesMap.values()));
    const createdSubscription = processor.onSurfaceCreated(syncSurfaces);
    const deletedSubscription = processor.onSurfaceDeleted(syncSurfaces);

    return () => {
      createdSubscription.unsubscribe();
      deletedSubscription.unsubscribe();
    };
  }, [processor]);

  useEffect(() => {
    const nextMessages = messages.slice(processedCountRef.current);

    if (nextMessages.length === 0) {
      return;
    }

    try {
      processor.processMessages(nextMessages);
      processedCountRef.current = messages.length;
    } catch (processingError) {
      const nextError =
        processingError instanceof Error
          ? processingError.message
          : "A2UI rendering failed.";

      queueMicrotask(() => setError(nextError));
    }
  }, [messages, processor]);

  if (error) {
    return (
      <div className="agent-error" role="alert">
        <Text as="h2" variant="subheader-2">
          Renderer error
        </Text>
        <Text as="p" variant="body-2" color="secondary">
          {error}
        </Text>
      </div>
    );
  }

  return (
    <div className="agent-surfaces">
      {surfaces.map((surface) => (
        <div className="agent-surface" key={surface.id}>
          <A2uiSurface surface={surface} />
        </div>
      ))}
    </div>
  );
}

async function readAgentStream(
  stream: ReadableStream<Uint8Array>,
  onEvent: (event: AgentSseEvent) => void,
) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const event = parseSseEvent(part);

      if (event) {
        onEvent(event);
      }
    }
  }

  buffer += decoder.decode();
  const event = parseSseEvent(buffer);

  if (event) {
    onEvent(event);
  }
}

function parseSseEvent(rawEvent: string): AgentSseEvent | null {
  const data = rawEvent
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!data) {
    return null;
  }

  return JSON.parse(data) as AgentSseEvent;
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
