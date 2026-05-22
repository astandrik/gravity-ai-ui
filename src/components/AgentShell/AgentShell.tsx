"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { A2uiClientAction } from "@a2ui/web_core/v0_9";
import { Eraser } from "@gravity-ui/icons";
import {
  Button,
  Card,
  Container,
  Divider,
  Flex,
  Icon,
  Label,
  Tab,
  TabList,
  TabProvider,
  Text,
  TextInput,
} from "@/components/GravityUI/GravityUI";
import type { GravityA2uiMessage } from "@/lib/agent/a2uiContract";
import type { ComposedInterfacePayload } from "@/lib/agent/composedInterface";
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
  payload?: ComposedInterfacePayload;
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
  const [conversationId, setConversationId] = useState(() =>
    createId("conversation"),
  );
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

  const clearConversation = useCallback(() => {
    if (isStreaming || turns.length === 0) {
      return;
    }

    trackGoal("agent_conversation_clear", {
      historyTurns: turns.length,
    });
    setConversationId(createId("conversation"));
    setPrompt("");
    setTurns([]);
    setLikedByTurnId({});
    setFeedbackErrorByTurnId({});
  }, [isStreaming, turns.length]);

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
                  <Flex gap="2" alignItems="center">
                    <Label theme="unknown" size="s">
                      {turns.length === 0
                        ? "None yet"
                        : `${userTurns.length} sent`}
                    </Label>
                    <Button
                      aria-label="Clear conversation"
                      disabled={isStreaming || turns.length === 0}
                      onClick={clearConversation}
                      size="s"
                      view="flat-danger"
                    >
                      <Icon data={Eraser} size={14} />
                      Clear
                    </Button>
                  </Flex>
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
                <div className="agent-composer__actions">
                  <Button
                    className="agent-composer__send"
                    disabled={isStreaming || !prompt.trim()}
                    size="xl"
                    type="submit"
                    view="action"
                  >
                    Send
                  </Button>
                </div>
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
          {turn.error ??
            (turn.payload ? getPayloadTitle(turn.payload) : null) ??
            "Generating interface"}
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

function summarizePayload(payload: ComposedInterfacePayload) {
  const componentCounts = new Map<string, number>();

  for (const node of payload.nodes) {
    componentCounts.set(
      node.component,
      (componentCounts.get(node.component) ?? 0) + 1,
    );
  }

  const topLevel = payload.nodes
    .filter((node) => node.parentId === "root" || node.parentId === null)
    .sort((left, right) =>
      left.order === right.order
        ? left.id.localeCompare(right.id)
        : left.order - right.order,
    )
    .map((node) => node.component);
  const counts = [...componentCounts.entries()]
    .sort((left, right) =>
      right[1] === left[1]
        ? left[0].localeCompare(right[0])
        : right[1] - left[1],
    )
    .slice(0, 8)
    .map(([component, count]) => `${component} x${count}`);
  const snippets = collectVisibleText(payload).slice(0, 5);
  const actions = collectActionLabels(payload).slice(0, 6);
  const parts = [
    getPayloadTitle(payload),
    `Components: ${payload.nodes.length}${counts.length ? ` (${counts.join(", ")})` : ""}`,
    topLevel.length > 0 ? `Top level: ${topLevel.join(", ")}` : "",
    snippets.length > 0 ? `Text: ${snippets.join(" · ")}` : "",
    actions.length > 0 ? `Actions: ${actions.join(", ")}` : "",
  ].filter(Boolean);

  return truncateForContext(parts.join("\n"));
}

function getPayloadTitle(payload: ComposedInterfacePayload) {
  const heading = payload.nodes.find((node) => {
    if (node.component !== "Text") {
      return false;
    }

    const variant = node.props.variant;

    return variant === "h1" || variant === "h2" || variant === "h3";
  });
  const headingText = heading
    ? readPayloadString(heading.props.text, payload.dataModel)
    : null;

  if (headingText) {
    return headingText;
  }

  for (const node of payload.nodes) {
    const title = readPayloadString(node.props.title, payload.dataModel);

    if (title) {
      return title;
    }
  }

  for (const node of payload.nodes) {
    if (node.component === "Text") {
      const text = readPayloadString(node.props.text, payload.dataModel);

      if (text) {
        return text;
      }
    }
  }

  return "Generated interface";
}

function collectVisibleText(payload: ComposedInterfacePayload) {
  const snippets: string[] = [];

  for (const node of payload.nodes) {
    for (const value of [
      node.props.text,
      node.props.title,
      node.props.label,
      node.props.body,
      node.props.message,
    ]) {
      const text = readStaticString(value);

      if (text) {
        snippets.push(text);
      }
    }

    if (Array.isArray(node.props.items)) {
      for (const item of node.props.items) {
        if (!isRecord(item)) {
          continue;
        }

        const text = readStaticString(item.title ?? item.label ?? item.name);

        if (text) {
          snippets.push(text);
        }
      }
    }
  }

  return [...new Set(snippets)].map((snippet) =>
    snippet.length > 120 ? `${snippet.slice(0, 117)}...` : snippet,
  );
}

function collectActionLabels(payload: ComposedInterfacePayload) {
  const labels: string[] = [];

  for (const node of payload.nodes) {
    if (node.component === "Button") {
      const text = readStaticString(node.props.text);
      const actionName = readActionName(node.props.action);

      if (text || actionName) {
        labels.push(text ?? actionName ?? "");
      }
    }

    for (const value of [node.props.actions, node.props.items]) {
      if (!Array.isArray(value)) {
        continue;
      }

      for (const item of value) {
        if (!isRecord(item)) {
          continue;
        }

        if (Array.isArray(item.actions)) {
          for (const action of item.actions) {
            if (!isRecord(action)) {
              continue;
            }

            const label = readStaticString(action.label);

            if (label) {
              labels.push(label);
            }
          }
        }

        const label = readStaticString(item.label);

        if (label && item.action) {
          labels.push(label);
        }
      }
    }
  }

  return [...new Set(labels.filter(Boolean))];
}

function readStaticString(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";

  return text || null;
}

function readPayloadString(value: unknown, dataModel: unknown) {
  if (isRecord(value) && typeof value.path === "string") {
    return readStaticString(readJsonPointer(dataModel, value.path));
  }

  return readStaticString(value);
}

function readJsonPointer(source: unknown, path: string) {
  if (path === "/") {
    return source;
  }

  return path
    .split("/")
    .slice(1)
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce<unknown>((current, key) => {
      if (!isRecord(current) && !Array.isArray(current)) {
        return undefined;
      }

      return (current as Record<string, unknown>)[key];
    }, source);
}

function readActionName(value: unknown) {
  if (!isRecord(value) || !isRecord(value.event)) {
    return null;
  }

  return readStaticString(value.event.name);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
