"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { A2uiClientAction } from "@a2ui/web_core/v0_9";
import {
  Button,
  Card,
  Divider,
  Tab,
  TabList,
  TabProvider,
  Text,
} from "@/components/GravityUI/GravityUI";
import type { GravityA2uiMessage } from "@/lib/agent/a2uiContract";
import {
  buildComposedInterface,
  type ComposedInterfacePayload,
} from "@/lib/agent/composedInterface";
import { buildReactCode } from "@/lib/agent/reactCode";
import { trackGoal } from "@/lib/metrics/yandex";
import {
  A2uiSurface,
  createGravityA2uiProcessor,
  type GravitySurface,
} from "@/components/AgentShell/gravityA2uiCatalog";
import { getA2uiMessageUpdateMode } from "./a2uiMessageStream";

import "./InterfaceInspector.scss";

type InspectorTab = "preview" | "react" | "a2ui" | "data" | "payload";
type ThumbnailStyle = CSSProperties & { "--thumbnail-scale": string };
type GravityA2uiProcessor = ReturnType<typeof createGravityA2uiProcessor>;
type InitialRendererState = {
  error: string | null;
  processedCount: number;
  processedMessages: GravityA2uiMessage[];
  processor: GravityA2uiProcessor;
  surfaces: GravitySurface[];
};

const noopAction = () => undefined;

export function InterfaceInspector({
  messages = [],
  onAction = noopAction,
  payload,
}: {
  messages?: GravityA2uiMessage[];
  onAction?: (action: A2uiClientAction) => void;
  payload?: ComposedInterfacePayload;
}) {
  const [activeTab, setActiveTab] = useState<InspectorTab>("preview");
  const canonicalMessages = useCanonicalMessages(payload);
  const previewMessages =
    messages.length > 0 ? messages : (canonicalMessages ?? []);
  const a2uiMessages = canonicalMessages ?? messages;
  const dataModel =
    payload?.dataModel ?? getLatestDataModel(messages) ?? getLatestDataModel(a2uiMessages);
  const reactCode = payload ? buildReactCode(payload) : null;
  const hasRenderablePreview = previewMessages.length > 0;
  const updateActiveTab = useCallback(
    (value: string) => {
      const nextTab = value as InspectorTab;

      if (nextTab !== activeTab) {
        trackGoal("inspector_tab_change", {
          tab: nextTab,
          surfaceId: payload?.surfaceId,
        });
      }

      setActiveTab(nextTab);
    },
    [activeTab, payload?.surfaceId],
  );
  const tabs: Array<{
    id: InspectorTab;
    label: string;
    disabled?: boolean;
  }> = [
    { id: "preview", label: "Preview", disabled: !hasRenderablePreview },
    { id: "react", label: "React", disabled: !reactCode },
    { id: "a2ui", label: "A2UI", disabled: a2uiMessages.length === 0 },
    { id: "data", label: "Data", disabled: dataModel === undefined },
    { id: "payload", label: "Payload", disabled: !payload },
  ];

  return (
    <Card type="container" view="outlined" className="interface-inspector">
      <TabProvider value={activeTab} onUpdate={updateActiveTab}>
        <TabList className="interface-inspector__tabs" size="m">
          {tabs.map((tab) => (
            <Tab key={tab.id} value={tab.id} disabled={tab.disabled}>
              {tab.label}
            </Tab>
          ))}
        </TabList>
      </TabProvider>
      <Divider orientation="horizontal" />
      <div className="interface-inspector__panel" role="tabpanel">
        {activeTab === "preview" && hasRenderablePreview ? (
          <A2uiMessageRenderer messages={previewMessages} onAction={onAction} />
        ) : null}
        {activeTab === "a2ui" ? <JsonPanel value={a2uiMessages} /> : null}
        {activeTab === "react" && reactCode ? (
          <CodePanel value={reactCode} />
        ) : null}
        {activeTab === "data" ? <JsonPanel value={dataModel} /> : null}
        {activeTab === "payload" ? <JsonPanel value={payload ?? null} /> : null}
      </div>
    </Card>
  );
}

export function InterfacePreview({
  eagerClientRender = false,
  payload,
}: {
  eagerClientRender?: boolean;
  payload: ComposedInterfacePayload;
}) {
  const messages = useCanonicalMessages(payload) ?? [];
  const { contentRef, frameRef, thumbnailStyle } = useThumbnailScale(messages);

  return (
    <div
      className="interface-preview interface-preview_thumbnail"
      ref={frameRef}
      style={thumbnailStyle}
    >
      <div className="interface-preview__content" ref={contentRef}>
        <A2uiMessageRenderer
          eagerClientRender={eagerClientRender}
          messages={messages}
          onAction={noopAction}
        />
      </div>
    </div>
  );
}

function useThumbnailScale(messages: GravityA2uiMessage[]) {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [thumbnailScale, setThumbnailScale] = useState(0.42);
  const thumbnailStyle = useMemo<ThumbnailStyle>(
    () => ({ "--thumbnail-scale": thumbnailScale.toString() }),
    [thumbnailScale],
  );

  useEffect(() => {
    const frame = frameRef.current;
    const content = contentRef.current;

    if (!frame || !content) {
      return;
    }

    let animationFrame = 0;

    const updateScale = () => {
      animationFrame = 0;

      const frameWidth = frame.clientWidth;
      const frameHeight = frame.clientHeight;
      const contentWidth = content.scrollWidth || content.offsetWidth;
      const contentHeight = content.scrollHeight || content.offsetHeight;

      if (
        frameWidth <= 0 ||
        frameHeight <= 0 ||
        contentWidth <= 0 ||
        contentHeight <= 0
      ) {
        return;
      }

      const nextScale = Math.min(
        frameWidth / contentWidth,
        frameHeight / contentHeight,
        1,
      );
      const roundedScale = Number(nextScale.toFixed(3));

      setThumbnailScale((currentScale) =>
        Math.abs(currentScale - roundedScale) < 0.005
          ? currentScale
          : roundedScale,
      );
    };

    const scheduleUpdate = () => {
      if (animationFrame === 0) {
        animationFrame = requestAnimationFrame(updateScale);
      }
    };

    scheduleUpdate();

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(scheduleUpdate);

    resizeObserver?.observe(frame);
    resizeObserver?.observe(content);
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (animationFrame !== 0) {
        cancelAnimationFrame(animationFrame);
      }

      resizeObserver?.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [messages]);

  return { contentRef, frameRef, thumbnailStyle };
}

function useCanonicalMessages(payload: ComposedInterfacePayload | undefined) {
  return useMemo(
    () => (payload ? buildComposedInterface(payload).messages : null),
    [payload],
  );
}

function JsonPanel({ value }: { value: unknown }) {
  return (
    <pre className="interface-json">
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
    <div className="interface-code-panel">
      <div className="interface-code-panel__toolbar">
        <Button onClick={copyCode} size="s" view={copied ? "action" : "outlined"}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <pre className="interface-json">
        <code>{value}</code>
      </pre>
    </div>
  );
}

function A2uiMessageRenderer({
  eagerClientRender = false,
  messages,
  onAction,
}: {
  eagerClientRender?: boolean;
  messages: GravityA2uiMessage[];
  onAction: (action: A2uiClientAction) => void;
}) {
  const [initialRendererState] = useState(() =>
    createInitialRendererState(
      messages,
      onAction,
      eagerClientRender && typeof window !== "undefined",
    ),
  );
  const processedCountRef = useRef(initialRendererState.processedCount);
  const processedMessagesRef = useRef<GravityA2uiMessage[]>(
    initialRendererState.processedMessages,
  );
  const renderRequestRef = useRef(0);
  const [error, setError] = useState<string | null>(
    initialRendererState.error,
  );
  const createProcessor = useCallback(
    () => createGravityA2uiProcessor(onAction),
    [onAction],
  );
  const [processor, setProcessor] = useState(
    initialRendererState.processor,
  );
  const [renderVersion, setRenderVersion] = useState(0);
  const [surfaces, setSurfaces] = useState<GravitySurface[]>(
    initialRendererState.surfaces,
  );
  const syncRendererState = useCallback(
    (nextProcessor: GravityA2uiProcessor, nextError: string | null) => {
      const requestId = renderRequestRef.current + 1;
      renderRequestRef.current = requestId;

      queueMicrotask(() => {
        if (renderRequestRef.current !== requestId) {
          return;
        }

        setError(nextError);
        setSurfaces(Array.from(nextProcessor.model.surfacesMap.values()));
        setRenderVersion((currentVersion) => currentVersion + 1);
      });
    },
    [],
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
    const updateMode = getA2uiMessageUpdateMode(
      processedMessagesRef.current,
      messages,
    );

    if (updateMode === "same") {
      return;
    }

    const activeProcessor =
      updateMode === "replace" ? createProcessor() : processor;
    const nextMessages =
      updateMode === "append"
        ? messages.slice(processedCountRef.current)
        : messages;

    processedMessagesRef.current = messages;
    processedCountRef.current = messages.length;

    if (updateMode === "replace") {
      setProcessor(activeProcessor);
    }

    if (nextMessages.length === 0) {
      syncRendererState(activeProcessor, null);
      return;
    }

    try {
      activeProcessor.processMessages(nextMessages);
      syncRendererState(activeProcessor, null);
    } catch (processingError) {
      const nextError =
        processingError instanceof Error
          ? processingError.message
          : "A2UI rendering failed.";

      syncRendererState(activeProcessor, nextError);
    }
  }, [createProcessor, messages, processor, syncRendererState]);

  if (error) {
    return (
      <div className="interface-error" role="alert">
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
    <div className="interface-surfaces">
      {surfaces.map((surface) => (
        <div className="interface-surface" key={`${surface.id}-${renderVersion}`}>
          <A2uiSurface surface={surface} />
        </div>
      ))}
    </div>
  );
}

function createInitialRendererState(
  messages: GravityA2uiMessage[],
  onAction: (action: A2uiClientAction) => void,
  processInitialMessages: boolean,
): InitialRendererState {
  const processor = createGravityA2uiProcessor(onAction);
  let error: string | null = null;

  if (processInitialMessages && messages.length > 0) {
    try {
      processor.processMessages(messages);
    } catch (processingError) {
      error =
        processingError instanceof Error
          ? processingError.message
          : "A2UI rendering failed.";
    }
  }

  return {
    error,
    processedCount: processInitialMessages ? messages.length : 0,
    processedMessages: processInitialMessages ? messages : [],
    processor,
    surfaces: Array.from(processor.model.surfacesMap.values()),
  };
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

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
