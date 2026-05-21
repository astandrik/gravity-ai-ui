import { describe, expect, it } from "vitest";
import {
  GRAVITY_A2UI_CATALOG_ID,
  parseEmitA2uiToolArguments,
  validateGravityA2uiMessage,
} from "./a2uiContract";

const createSurfaceMessage = {
  version: "v0.9",
  createSurface: {
    surfaceId: "main",
    catalogId: GRAVITY_A2UI_CATALOG_ID,
    sendDataModel: true,
  },
};

const updateComponentsMessage = {
  version: "v0.9",
  updateComponents: {
    surfaceId: "main",
    components: [
      {
        id: "root",
        component: "Column",
        children: ["title", "cta"],
      },
      {
        id: "title",
        component: "Text",
        text: { path: "/title" },
        variant: "h2",
      },
      {
        id: "cta",
        component: "Button",
        text: "Continue",
        variant: "outlined-warning",
        loading: true,
        selected: true,
        action: {
          event: {
            name: "next",
          },
        },
      },
    ],
  },
};

describe("A2UI contract validation", () => {
  it("accepts Gravity catalog surface and component messages", () => {
    expect(validateGravityA2uiMessage(createSurfaceMessage)).toEqual(
      createSurfaceMessage,
    );
    expect(validateGravityA2uiMessage(updateComponentsMessage)).toEqual(
      updateComponentsMessage,
    );
  });

  it("rejects unknown components", () => {
    expect(() =>
      validateGravityA2uiMessage({
        version: "v0.9",
        updateComponents: {
          surfaceId: "main",
          components: [
            {
              id: "root",
              component: "Image",
              src: "https://example.com/image.png",
            },
          ],
        },
      }),
    ).toThrow();
  });

  it("rejects duplicate component IDs", () => {
    expect(() =>
      validateGravityA2uiMessage({
        version: "v0.9",
        updateComponents: {
          surfaceId: "main",
          components: [
            {
              id: "root",
              component: "Column",
              children: ["item"],
            },
            {
              id: "item",
              component: "Text",
              text: "First",
            },
            {
              id: "item",
              component: "Text",
              text: "Second",
            },
          ],
        },
      }),
    ).toThrow("Duplicate component id");
  });

  it("rejects missing root and broken child references", () => {
    expect(() =>
      validateGravityA2uiMessage({
        version: "v0.9",
        updateComponents: {
          surfaceId: "main",
          components: [
            {
              id: "title",
              component: "Text",
              text: "Missing root",
            },
          ],
        },
      }),
    ).toThrow("root");

    expect(() =>
      validateGravityA2uiMessage({
        version: "v0.9",
        updateComponents: {
          surfaceId: "main",
          components: [
            {
              id: "root",
              component: "Column",
              children: ["missing"],
            },
          ],
        },
      }),
    ).toThrow("unknown child");
  });

  it("parses and validates streamed tool arguments", () => {
    expect(
      parseEmitA2uiToolArguments(
        JSON.stringify({
          sequence: 0,
          messageJson: JSON.stringify(createSurfaceMessage),
        }),
      ),
    ).toEqual({
      sequence: 0,
      message: createSurfaceMessage,
    });
  });
});
