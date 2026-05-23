import { describe, expect, it } from "vitest";
import { A2UI_VERSION, GRAVITY_A2UI_CATALOG_ID } from "@/lib/agent/a2uiContract";
import type { ComposedInterfacePayload } from "@/lib/agent/composedInterface";
import {
  applyActiveSurfaceEvent,
  createActivePromptSurface,
  readClientSurfaceDataModel,
  startActiveSurfaceActionUpdate,
} from "./activeSurface";

const message = {
  version: A2UI_VERSION,
  createSurface: {
    surfaceId: "main",
    catalogId: GRAVITY_A2UI_CATALOG_ID,
    sendDataModel: true,
  },
} as const;

const payload = {
  sequence: 0,
  surfaceId: "main",
  dataModel: {
    title: "Review",
  },
  root: {
    component: "Column",
    props: {
      align: "stretch",
      gap: "normal",
    },
  },
  nodes: [],
} satisfies ComposedInterfacePayload;

describe("active A2UI surface state", () => {
  it("keeps rendered messages and payload while an action update is pending", () => {
    const initial = {
      ...createActivePromptSurface("assistant-1"),
      messages: [message],
      payload,
      done: true,
      status: "Done",
    };

    const pending = startActiveSurfaceActionUpdate(initial, "assistant-2");

    expect(pending).toMatchObject({
      turnId: "assistant-1",
      pendingTurnId: "assistant-2",
      messages: [message],
      payload,
      isUpdating: true,
    });
  });

  it("moves feedback ownership to the action turn after a payload arrives", () => {
    const pending = startActiveSurfaceActionUpdate(
      {
        ...createActivePromptSurface("assistant-1"),
        messages: [message],
        payload,
        done: true,
      },
      "assistant-2",
    );
    const updated = applyActiveSurfaceEvent(pending, {
      type: "payload",
      payload: {
        ...payload,
        dataModel: {
          title: "Approved",
        },
      },
    });

    expect(updated).toMatchObject({
      turnId: "assistant-2",
      pendingTurnId: undefined,
      payload: {
        dataModel: {
          title: "Approved",
        },
      },
    });
  });

  it("reads the edited model for the dispatched action surface", () => {
    const dataModel = readClientSurfaceDataModel(
      {
        version: "v0.9",
        surfaces: {
          main: {
            title: "Edited in the form",
          },
        },
      },
      "main",
    );

    expect(dataModel).toEqual({
      found: true,
      value: {
        title: "Edited in the form",
      },
    });
  });
});
