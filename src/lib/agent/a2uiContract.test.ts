import {
  Catalog,
  CommonSchemas,
  ComponentContext,
  ComponentModel,
  GenericBinder,
  SurfaceModel,
} from "@a2ui/web_core/v0_9";
import { z } from "zod";
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
        children: [
          "title",
          "breadcrumbs",
          "chips",
          "cards",
          "stepper",
          "tabs",
          "accordion",
          "empty",
          "loading",
          "copy",
          "cta",
        ],
      },
      {
        id: "title",
        component: "Text",
        text: { path: "/title" },
        variant: "h2",
      },
      {
        id: "breadcrumbs",
        component: "BreadcrumbTrail",
        title: "Location",
        showRoot: true,
        items: [
          { label: "Deployments", href: "/deployments" },
          { label: "Review", href: null },
        ],
      },
      {
        id: "chips",
        component: "LabelGroup",
        items: [
          {
            label: "Status",
            value: "Ready",
            tone: "success",
            type: "default",
          },
        ],
      },
      {
        id: "cards",
        component: "CardGrid",
        items: [
          {
            title: "Starter plan",
            subtitle: "For small teams",
            body: "Includes the core launch checklist.",
            imageLabel: "Plan",
            value: "$19",
            meta: "Billed monthly",
            tone: "info",
            labels: [
              {
                label: "Popular",
                value: null,
                tone: "info",
                type: "default",
              },
            ],
            actions: [
              {
                label: "Choose",
                icon: "check",
                variant: "primary",
                disabled: false,
                loading: false,
                selected: false,
                action: {
                  event: {
                    name: "select",
                  },
                },
              },
            ],
          },
        ],
      },
      {
        id: "stepper",
        component: "StepperBlock",
        title: "Flow",
        size: "m",
        items: [
          {
            label: "Plan",
            value: "plan",
            view: "success",
            disabled: false,
            active: false,
          },
          {
            label: "Review",
            value: "review",
            view: "idle",
            disabled: false,
            active: true,
          },
        ],
      },
      {
        id: "tabs",
        component: "TabsBlock",
        title: "Views",
        size: "m",
        items: [
          {
            label: "Summary",
            value: "summary",
            body: "Deployment summary.",
            counter: null,
            tone: "normal",
            active: true,
          },
          {
            label: "Risks",
            value: "risks",
            body: "Open risk list.",
            counter: "1",
            tone: "warning",
            active: false,
          },
        ],
      },
      {
        id: "accordion",
        component: "AccordionBlock",
        title: "Details",
        size: "m",
        view: "solid",
        arrowPosition: "end",
        items: [
          {
            title: "Rollback",
            body: "Rollback instructions.",
            expanded: true,
            disabled: false,
          },
        ],
      },
      {
        id: "empty",
        component: "EmptyStateList",
        items: [
          {
            title: "No blockers",
            description: "Blocking checks will appear here.",
            icon: "check",
            tone: "success",
            size: "m",
          },
        ],
      },
      {
        id: "loading",
        component: "LoadingStateList",
        items: [
          {
            label: "Checking",
            description: "Waiting for probe results.",
            size: "s",
          },
        ],
      },
      {
        id: "copy",
        component: "CopyList",
        title: "Commands",
        items: [
          {
            label: "Build",
            value: "npm run build",
            copyText: "npm run build",
          },
        ],
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

  it("resolves nested card actions to click handlers", async () => {
    const schema = z.object({
      items: z.array(
        z.object({
          action: CommonSchemas.Action,
        }),
      ),
    });
    const catalog = new Catalog("test", [{ name: "CardGrid", schema }]);
    const surface = new SurfaceModel("main", catalog);
    const component = new ComponentModel("cards", "CardGrid", {
      items: [
        {
          action: {
            event: {
              name: "select",
              context: {
                cardIndex: 0,
              },
            },
          },
        },
      ],
    });
    let receivedAction: unknown;

    surface.componentsModel.addComponent(component);
    surface.onAction.subscribe((action) => {
      receivedAction = action;
    });

    const context = new ComponentContext(surface, "cards");
    const binder = new GenericBinder<{
      items: Array<{ action: () => void }>;
    }>(context, schema);

    binder.currentProps.items?.[0]?.action();
    await Promise.resolve();

    expect(receivedAction).toMatchObject({
      name: "select",
      surfaceId: "main",
      sourceComponentId: "cards",
      context: {
        cardIndex: 0,
      },
    });
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
