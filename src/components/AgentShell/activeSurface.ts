import type { A2uiClientDataModel } from "@a2ui/web_core/v0_9";
import type { GravityA2uiMessage } from "@/lib/agent/a2uiContract";
import type { ComposedInterfacePayload } from "@/lib/agent/composedInterface";
import type { AgentSseEvent } from "@/lib/agent/protocol";

export type ActiveSurfaceState = {
  turnId: string;
  pendingTurnId?: string;
  messages: GravityA2uiMessage[];
  payload?: ComposedInterfacePayload;
  status: string;
  error?: string;
  done: boolean;
  isUpdating: boolean;
};

export function createActivePromptSurface(turnId: string): ActiveSurfaceState {
  return {
    turnId,
    messages: [],
    status: "Starting",
    done: false,
    isUpdating: false,
  };
}

export function startActiveSurfaceActionUpdate(
  current: ActiveSurfaceState | null,
  turnId: string,
): ActiveSurfaceState {
  if (!current) {
    return {
      ...createActivePromptSurface(turnId),
      isUpdating: true,
      status: "Updating",
    };
  }

  return {
    ...current,
    pendingTurnId: turnId,
    status: "Updating",
    error: undefined,
    done: false,
    isUpdating: true,
  };
}

export function applyActiveSurfaceEvent(
  current: ActiveSurfaceState,
  event: AgentSseEvent,
): ActiveSurfaceState {
  if (event.type === "status") {
    return {
      ...current,
      status: event.message,
      error: undefined,
    };
  }

  if (event.type === "a2ui") {
    return {
      ...current,
      messages: [...current.messages, event.message],
      status: "Rendering",
      error: undefined,
    };
  }

  if (event.type === "payload") {
    return {
      ...current,
      turnId: current.pendingTurnId ?? current.turnId,
      pendingTurnId: undefined,
      payload: event.payload,
      status: "Building preview",
      error: undefined,
    };
  }

  if (event.type === "error") {
    return {
      ...current,
      error: event.message,
      status: "Error",
      isUpdating: false,
    };
  }

  return {
    ...current,
    pendingTurnId: undefined,
    done: true,
    status: "Done",
    isUpdating: false,
  };
}

export function readClientSurfaceDataModel(
  clientDataModel: A2uiClientDataModel | undefined,
  surfaceId: string,
) {
  if (
    clientDataModel?.surfaces &&
    Object.prototype.hasOwnProperty.call(clientDataModel.surfaces, surfaceId)
  ) {
    return {
      found: true as const,
      value: clientDataModel.surfaces[surfaceId],
    };
  }

  return {
    found: false as const,
    value: undefined,
  };
}
