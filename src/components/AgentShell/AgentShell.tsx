"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { A2uiClientAction } from "@a2ui/web_core/v0_9";
import {
  Button,
  Card,
  Container,
  Divider,
  Flex,
  Label,
  Tab,
  TabList,
  TabProvider,
  Text,
  TextInput,
} from "@/components/GravityUI/GravityUI";
import type { GravityA2uiMessage } from "@/lib/agent/a2uiContract";
import type { RenderInterfaceArguments } from "@/lib/agent/fixedInterface";
import { buildReactCode } from "@/lib/agent/reactCode";
import type {
  AgentRequest,
  AgentSseEvent,
  ConversationContext,
} from "@/lib/agent/protocol";
import { trackGoal } from "@/lib/metrics/yandex";
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
  payload?: RenderInterfaceArguments;
  status: string;
  error?: string;
  done: boolean;
};

type ChatTurn = UserTurn | AssistantTurn;
type InspectorTab = "preview" | "react" | "a2ui" | "data" | "payload";
type PromptSource = "manual" | "starter";

export function AgentShell({
  starterPrompts,
}: {
  starterPrompts: readonly string[];
}) {
  const [conversationId] = useState(() => createId("conversation"));
  const [prompt, setPrompt] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [likedByTurnId, setLikedByTurnId] = useState<Record<string, boolean>>(
    {},
  );
  const [feedbackErrorByTurnId, setFeedbackErrorByTurnId] = useState<
    Record<string, string | undefined>
  >({});
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
      let generatedPayload = false;
      let streamError: string | undefined;

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

            if (event.type === "payload") {
              generatedPayload = true;

              return {
                ...turn,
                payload: event.payload,
                status: "Building preview",
              };
            }

            if (event.type === "error") {
              streamError = event.message;

              return {
                ...turn,
                error: event.message,
                status: "Error",
              };
            }

            return { ...turn, done: true, status: "Done" };
          });
        });

        if (streamError) {
          trackGoal("agent_interface_error", {
            kind: request.kind,
          });
        } else if (generatedPayload) {
          trackGoal("agent_interface_generated", {
            kind: request.kind,
          });
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          trackGoal("agent_interface_error", {
            kind: request.kind,
          });

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
    (value: string, source: PromptSource = "manual") => {
      const trimmedPrompt = value.trim();

      if (!trimmedPrompt || isStreaming) {
        return;
      }

      const conversationContext = buildConversationContext(turns);

      trackGoal("agent_prompt_submit", {
        source,
        promptLength: trimmedPrompt.length,
        historyTurns: turns.length,
      });

      setPrompt("");
      void sendAgentRequest(
        {
          kind: "prompt",
          conversationId,
          prompt: trimmedPrompt,
          ...(conversationContext ? { conversationContext } : {}),
        },
        trimmedPrompt,
      );
    },
    [conversationId, isStreaming, sendAgentRequest, turns],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submitPrompt(prompt, "manual");
  };

  const onAction = useCallback(
    (action: A2uiClientAction) => {
      const conversationContext = buildConversationContext(turns);
      const latestDataModel = conversationContext?.latestDataModel;

      trackGoal("agent_action_submit", {
        action: action.name,
        surfaceId: action.surfaceId,
        historyTurns: turns.length,
      });

      void sendAgentRequest(
        {
          kind: "action",
          conversationId,
          surfaceId: action.surfaceId,
          action,
          context: action.context,
          ...(latestDataModel !== undefined ? { dataModel: latestDataModel } : {}),
          ...(conversationContext ? { conversationContext } : {}),
        },
        `Action: ${action.name}`,
      );
    },
    [conversationId, sendAgentRequest, turns],
  );

  const sendDesignFeedback = useCallback(
    async (turn: AssistantTurn) => {
      const payload = turn.payload;

      if (!payload) {
        return;
      }

      setLikedByTurnId((current) => ({ ...current, [turn.id]: true }));
      setFeedbackErrorByTurnId((current) => ({
        ...current,
        [turn.id]: undefined,
      }));

      try {
        const response = await fetch("/api/design-feedback", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversationId,
            turnId: turn.id,
            rating: 1,
            prompt: getPromptBeforeTurn(turns, turn.id),
            payload,
            messages: turn.messages,
            dataModel: getLatestDataModel(turn.messages),
          }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => null);

          throw new Error(body?.error || `Feedback failed with ${response.status}`);
        }

        trackGoal("design_like", {
          surfaceId: payload.surfaceId,
        });
      } catch (error) {
        setLikedByTurnId((current) => {
          const next = { ...current };
          delete next[turn.id];

          return next;
        });
        setFeedbackErrorByTurnId((current) => ({
          ...current,
          [turn.id]:
            error instanceof Error ? error.message : "Feedback was not saved.",
        }));
      }
    },
    [conversationId, turns],
  );

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const latestAssistantTurn = getLatestAssistantTurn(turns);
  const userTurns = turns.filter((turn): turn is UserTurn => turn.role === "user");

  return (
    <main className="agent-page">
      <Container maxWidth="xl" gutters={5}>
        <section className="agent-shell" aria-labelledby="agent-title">
          <h1 id="agent-title" className="agent-shell__sr-title">
            Gravity AI UI generator
          </h1>
          <Card type="container" view="raised" className="agent-workbench">
            <aside className="agent-sidebar" aria-label="Conversation controls">
              <section className="agent-history" aria-label="Requests">
                <Flex
                  className="agent-sidebar__heading"
                  justifyContent="space-between"
                  alignItems="center"
                  gap="2"
                >
                  <Text as="h2" variant="subheader-2">
                    Requests
                  </Text>
                  <Label theme="unknown" size="s">
                    {turns.length === 0
                      ? "None yet"
                      : `${userTurns.length} sent`}
                  </Label>
                </Flex>

                {turns.length === 0 ? (
                  <div className="agent-starters">
                    {starterPrompts.map((starterPrompt) => (
                      <Button
                        key={starterPrompt}
                        disabled={isStreaming}
                        onClick={() => {
                          trackGoal("starter_prompt_click", {
                            promptLength: starterPrompt.length,
                          });
                          submitPrompt(starterPrompt, "starter");
                        }}
                        size="m"
                        view="outlined"
                      >
                        {starterPrompt}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="agent-history__list">
                    {turns.map((turn) => (
                      <ConversationItem key={turn.id} turn={turn} />
                    ))}
                  </div>
                )}
              </section>

              <Divider orientation="horizontal" />

              <form className="agent-composer" onSubmit={onSubmit}>
                <TextInput
                  disabled={isStreaming}
                  hasClear
                  onUpdate={setPrompt}
                  placeholder="Create an approval workflow"
                  size="xl"
                  value={prompt}
                />
                <Flex gap="2" justifyContent="flex-end">
                  <Button
                    disabled={isStreaming || !prompt.trim()}
                    size="xl"
                    type="submit"
                    view="action"
                    width="max"
                  >
                    Send
                  </Button>
                </Flex>
              </form>
            </aside>

            <Divider orientation="vertical" className="agent-workbench__divider" />

            <section className="agent-preview-pane" aria-label="Generated interface">
              {latestAssistantTurn ? (
                <AssistantMessage
                  feedbackError={feedbackErrorByTurnId[latestAssistantTurn.id]}
                  isLiked={Boolean(likedByTurnId[latestAssistantTurn.id])}
                  key={latestAssistantTurn.id}
                  onFeedback={sendDesignFeedback}
                  onAction={onAction}
                  turn={latestAssistantTurn}
                />
              ) : (
                <EmptyPreview />
              )}
            </section>
          </Card>
        </section>
      </Container>
    </main>
  );
}

function ConversationItem({ turn }: { turn: ChatTurn }) {
  if (turn.role === "user") {
    return <UserHistoryItem turn={turn} />;
  }

  return <AssistantHistoryItem turn={turn} />;
}

function UserHistoryItem({ turn }: { turn: UserTurn }) {
  return (
    <Card
      type="container"
      view="filled"
      theme="info"
      className="agent-history-item agent-history-item_user"
    >
      <Flex direction="column" gap="1">
        <Label theme="info" size="xs">User</Label>
        <Text variant="body-2" className="agent-history-item__text">
          {turn.content}
        </Text>
      </Flex>
    </Card>
  );
}

function AssistantHistoryItem({ turn }: { turn: AssistantTurn }) {
  const theme = turn.error ? "danger" : turn.done ? "success" : "utility";

  return (
    <Card
      type="container"
      view="outlined"
      className="agent-history-item agent-history-item_assistant"
    >
      <Flex direction="column" gap="1">
        <Label theme={theme} size="xs">
          {turn.status}
        </Label>
        <Text variant="body-2" className="agent-history-item__text">
          {turn.error ?? turn.payload?.title ?? "Generating interface"}
        </Text>
      </Flex>
    </Card>
  );
}

function AssistantMessage({
  feedbackError,
  isLiked,
  onFeedback,
  onAction,
  turn,
}: {
  feedbackError?: string;
  isLiked: boolean;
  onFeedback: (turn: AssistantTurn) => void;
  onAction: (action: A2uiClientAction) => void;
  turn: AssistantTurn;
}) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("preview");
  const dataModel = getLatestDataModel(turn.messages);
  const reactCode = turn.payload ? buildReactCode(turn.payload) : null;
  const hasRenderablePreview = turn.messages.length > 0;
  const updateActiveTab = useCallback(
    (value: string) => {
      const nextTab = value as InspectorTab;

      if (nextTab !== activeTab) {
        trackGoal("inspector_tab_change", {
          tab: nextTab,
          surfaceId: turn.payload?.surfaceId,
        });
      }

      setActiveTab(nextTab);
    },
    [activeTab, turn.payload?.surfaceId],
  );
  const tabs: Array<{
    id: InspectorTab;
    label: string;
    disabled?: boolean;
  }> = [
    { id: "preview", label: "Preview", disabled: !hasRenderablePreview },
    { id: "react", label: "React", disabled: !reactCode },
    { id: "a2ui", label: "A2UI", disabled: turn.messages.length === 0 },
    { id: "data", label: "Data", disabled: dataModel === undefined },
    { id: "payload", label: "Payload", disabled: !turn.payload },
  ];

  return (
    <article className="agent-turn agent-turn_assistant">
      <div className="agent-turn__meta">
        <span>{turn.status}</span>
        <div className="agent-feedback" aria-label="Design feedback">
          {feedbackError ? (
            <span className="agent-feedback__error">{feedbackError}</span>
          ) : null}
          <Button
            disabled={!turn.payload}
            onClick={() => onFeedback(turn)}
            size="s"
            view={isLiked ? "action" : "flat"}
          >
            Like
          </Button>
        </div>
      </div>
      {turn.payload || turn.messages.length > 0 ? (
        <Card type="container" view="outlined" className="agent-inspector">
          <TabProvider
            value={activeTab}
            onUpdate={updateActiveTab}
          >
            <TabList className="agent-inspector__tabs" size="m">
              {tabs.map((tab) => (
                <Tab key={tab.id} value={tab.id} disabled={tab.disabled}>
                  {tab.label}
                </Tab>
              ))}
            </TabList>
          </TabProvider>
          <Divider orientation="horizontal" />
          <div className="agent-inspector__panel" role="tabpanel">
            {activeTab === "preview" && hasRenderablePreview ? (
              <A2uiMessageRenderer
                messages={turn.messages}
                onAction={onAction}
              />
            ) : null}
            {activeTab === "a2ui" ? <JsonPanel value={turn.messages} /> : null}
            {activeTab === "react" && reactCode ? (
              <CodePanel value={reactCode} />
            ) : null}
            {activeTab === "data" ? <JsonPanel value={dataModel} /> : null}
            {activeTab === "payload" ? (
              <JsonPanel value={turn.payload ?? null} />
            ) : null}
          </div>
        </Card>
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

function EmptyPreview() {
  return (
    <Card
      type="container"
      view="outlined"
      className="agent-empty-preview"
    >
      <Flex direction="column" gap="2" alignItems="center" justifyContent="center">
        <Label theme="utility" size="s">Awaiting prompt</Label>
        <Text variant="header-1">Generated interface</Text>
        <Text variant="body-2" color="secondary">
          Pick a starter on the left or type a prompt to generate an interface.
        </Text>
      </Flex>
    </Card>
  );
}

function JsonPanel({ value }: { value: unknown }) {
  return (
    <pre className="agent-json">
      <code>{formatJson(value)}</code>
    </pre>
  );
}

function CodePanel({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copyCode = useCallback(async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    trackGoal("react_code_copy", {
      codeLength: value.length,
    });
    window.setTimeout(() => setCopied(false), 1200);
  }, [value]);

  return (
    <div className="agent-code-panel">
      <div className="agent-code-panel__toolbar">
        <Button onClick={copyCode} size="s" view={copied ? "action" : "outlined"}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="agent-json">
        <code>{value}</code>
      </pre>
    </div>
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
  const [renderVersion, setRenderVersion] = useState(0);
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
      queueMicrotask(() => {
        setSurfaces(Array.from(processor.model.surfacesMap.values()));
        setRenderVersion((currentVersion) => currentVersion + 1);
      });
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
        <div className="agent-surface" key={`${surface.id}-${renderVersion}`}>
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

function getLatestDataModel(messages: GravityA2uiMessage[]) {
  let dataModel: unknown;

  for (const message of messages) {
    if ("updateDataModel" in message) {
      dataModel = message.updateDataModel.value ?? null;
    }
  }

  return dataModel;
}

function getLatestAssistantTurn(turns: ChatTurn[]) {
  return [...turns]
    .reverse()
    .find((turn): turn is AssistantTurn => turn.role === "assistant");
}

function buildConversationContext(
  turns: ChatTurn[],
): ConversationContext | undefined {
  const history = turns
    .map((turn) => {
      if (turn.role === "user") {
        return {
          role: "user" as const,
          text: truncateForContext(turn.content),
        };
      }

      if (turn.payload) {
        return {
          role: "assistant" as const,
          text: summarizePayload(turn.payload),
          surfaceId: turn.payload.surfaceId,
        };
      }

      if (turn.error) {
        return {
          role: "assistant" as const,
          text: truncateForContext(`Error: ${turn.error}`),
        };
      }

      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .slice(-12);
  const latestAssistant = [...turns]
    .reverse()
    .find((turn): turn is AssistantTurn => turn.role === "assistant");
  const latestPayload = latestAssistant?.payload;
  const latestDataModel = latestAssistant
    ? getLatestDataModel(latestAssistant.messages)
    : undefined;
  const latestSurfaceId =
    latestPayload?.surfaceId ??
    (latestAssistant ? getLatestSurfaceId(latestAssistant.messages) : undefined);

  if (
    history.length === 0 &&
    !latestPayload &&
    latestDataModel === undefined &&
    !latestSurfaceId
  ) {
    return undefined;
  }

  return {
    ...(history.length > 0 ? { history } : {}),
    ...(latestSurfaceId ? { latestSurfaceId } : {}),
    ...(latestPayload ? { latestPayload } : {}),
    ...(latestDataModel !== undefined ? { latestDataModel } : {}),
  };
}

function getLatestSurfaceId(messages: GravityA2uiMessage[]) {
  let surfaceId: string | undefined;

  for (const message of messages) {
    if ("createSurface" in message) {
      surfaceId = message.createSurface.surfaceId;
    }

    if ("updateComponents" in message) {
      surfaceId = message.updateComponents.surfaceId;
    }

    if ("updateDataModel" in message) {
      surfaceId = message.updateDataModel.surfaceId;
    }
  }

  return surfaceId;
}

function getPromptBeforeTurn(turns: ChatTurn[], turnId: string) {
  let latestPrompt: string | undefined;

  for (const turn of turns) {
    if (turn.id === turnId) {
      return latestPrompt;
    }

    if (turn.role === "user") {
      latestPrompt = turn.content;
    }
  }

  return latestPrompt;
}

function summarizePayload(payload: RenderInterfaceArguments) {
  const parts = [
    payload.title,
    payload.summary,
    payload.sections.length > 0
      ? `Sections: ${payload.sections.map((section) => section.title).join(", ")}`
      : "",
    payload.metrics.length > 0
      ? `Metrics: ${payload.metrics.map((metric) => metric.label).join(", ")}`
      : "",
    payload.alerts.length > 0
      ? `Alerts: ${payload.alerts.map((alert) => alert.title).join(", ")}`
      : "",
    payload.tables.length > 0
      ? `Tables: ${payload.tables.map((table) => table.title).join(", ")}`
      : "",
    payload.fields.length > 0
      ? `Fields: ${payload.fields.map((field) => field.label).join(", ")}`
      : "",
    payload.actions.length > 0
      ? `Actions: ${payload.actions.map((action) => action.label).join(", ")}`
      : "",
  ].filter(Boolean);

  return truncateForContext(parts.join("\n"));
}

function truncateForContext(value: string) {
  return value.length > 2000 ? `${value.slice(0, 1997)}...` : value;
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
