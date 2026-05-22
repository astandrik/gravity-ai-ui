import { describe, expect, it } from "vitest";
import {
  buildComposedInterfaceFromJson,
  buildComposedInterfaceFromPartialJson,
  type ComposedInterfacePayload,
} from "./composedInterface";

const simplePayload = {
  sequence: 0,
  surfaceId: "main",
  dataModel: {
    title: "Checkout QA",
    approved: false,
  },
  root: {
    component: "Column",
    props: {
      align: "stretch",
      gap: "normal",
    },
  },
  nodes: [
    {
      id: "title",
      parentId: "root",
      order: 0,
      component: "Text",
      props: {
        text: { path: "/title" },
        variant: "h2",
      },
    },
    {
      id: "approve",
      parentId: "root",
      order: 1,
      component: "Button",
      props: {
        text: "Approve",
        variant: "primary",
        action: {
          event: {
            name: "confirm",
          },
        },
      },
    },
  ],
} satisfies ComposedInterfacePayload;

describe("composed interface builder", () => {
  it("accepts a simple free tree", () => {
    const built = buildComposedInterfaceFromJson(JSON.stringify(simplePayload));
    const updateComponents = built.messages.find(
      (message) => "updateComponents" in message,
    );

    expect(built.payload.nodes).toHaveLength(2);
    expect(updateComponents).toMatchObject({
      updateComponents: {
        surfaceId: "main",
        components: expect.arrayContaining([
          expect.objectContaining({
            id: "root",
            component: "Column",
            children: ["title", "approve"],
          }),
          expect.objectContaining({
            id: "title",
            component: "Text",
            text: { path: "/title" },
          }),
          expect.objectContaining({
            id: "approve",
            component: "Button",
            action: { event: { name: "confirm" } },
          }),
        ]),
      },
    });
  });

  it("normalizes action-like button icon aliases", () => {
    const built = buildComposedInterfaceFromJson(
      JSON.stringify({
        ...simplePayload,
        nodes: [
          {
            id: "preview",
            parentId: "root",
            order: 0,
            component: "Button",
            props: {
              text: "Open details",
              icon: "open_details",
              action: { event: { name: "open_details" } },
            },
          },
        ],
      } satisfies ComposedInterfacePayload),
    );
    const updateComponents = built.messages.find(
      (message) => "updateComponents" in message,
    );

    expect(updateComponents).toMatchObject({
      updateComponents: {
        components: expect.arrayContaining([
          expect.objectContaining({
            id: "preview",
            icon: "arrowRight",
          }),
        ]),
      },
    });
  });

  it("accepts data-bound HeroBlock props with refresh actions", () => {
    const built = buildComposedInterfaceFromJson(
      JSON.stringify({
        ...simplePayload,
        dataModel: {
          eyebrow: "Live catalog",
          title: "Checkout QA",
          body: "Review current approval state before publishing.",
          imageLabel: "QA",
        },
        nodes: [
          {
            id: "hero",
            parentId: "root",
            order: 0,
            component: "HeroBlock",
            props: {
              eyebrow: { path: "/eyebrow" },
              title: { path: "/title" },
              body: { path: "/body" },
              imageLabel: { path: "/imageLabel" },
              tone: "info",
              labels: [],
              actions: [
                {
                  label: "Refresh",
                  icon: "refresh",
                  variant: "outlined",
                  action: { event: { name: "refresh" } },
                },
              ],
            },
          },
        ],
      } satisfies ComposedInterfacePayload),
    );
    const updateComponents = built.messages.find(
      (message) => "updateComponents" in message,
    );

    expect(updateComponents).toMatchObject({
      updateComponents: {
        components: expect.arrayContaining([
          expect.objectContaining({
            id: "hero",
            component: "HeroBlock",
            title: { path: "/title" },
            body: { path: "/body" },
            actions: [
              expect.objectContaining({
                icon: "refresh",
                action: { event: { name: "refresh" } },
              }),
            ],
          }),
        ]),
      },
    });
  });

  it("accepts data-bound display copy in FilterBar", () => {
    const built = buildComposedInterfaceFromJson(
      JSON.stringify({
        ...simplePayload,
        dataModel: {
          filterTitle: "Filters",
          searchPlaceholder: "Search requests",
          searchValue: "urgent",
          filterLabel: "Open",
          sortLabel: "Sort",
          sortValue: "newest",
          sortOptionLabel: "Newest first",
        },
        nodes: [
          {
            id: "Filters",
            parentId: "root",
            order: 0,
            component: "FilterBar",
            props: {
              title: { path: "/filterTitle" },
              searchPlaceholder: { path: "/searchPlaceholder" },
              searchValue: { path: "/searchValue" },
              filters: [
                {
                  label: { path: "/filterLabel" },
                  value: "open",
                  active: true,
                },
              ],
              sortLabel: { path: "/sortLabel" },
              sortValue: { path: "/sortValue" },
              sortOptions: [
                {
                  label: { path: "/sortOptionLabel" },
                  value: "newest",
                },
              ],
            },
          },
        ],
      } satisfies ComposedInterfacePayload),
    );
    const updateComponents = built.messages.find(
      (message) => "updateComponents" in message,
    );

    expect(updateComponents).toMatchObject({
      updateComponents: {
        components: expect.arrayContaining([
          expect.objectContaining({
            id: "Filters",
            component: "FilterBar",
            title: { path: "/filterTitle" },
            filters: [
              expect.objectContaining({
                label: { path: "/filterLabel" },
              }),
            ],
          }),
        ]),
      },
    });
  });

  it("drops accidental string entries from nodes", () => {
    const built = buildComposedInterfaceFromJson(
      JSON.stringify({
        ...simplePayload,
        nodes: [simplePayload.nodes[0], "orphan_child_id", simplePayload.nodes[1]],
      }),
    );
    const updateComponents = built.messages.find(
      (message) => "updateComponents" in message,
    );

    expect(built.payload.nodes).toEqual([
      expect.objectContaining({ id: "title" }),
      expect.objectContaining({ id: "approve" }),
    ]);
    expect(updateComponents).toMatchObject({
      updateComponents: {
        components: expect.arrayContaining([
          expect.objectContaining({
            id: "root",
            children: ["title", "approve"],
          }),
        ]),
      },
    });
  });

  it("accepts data-bound list props", () => {
    const built = buildComposedInterfaceFromJson(
      JSON.stringify({
        ...simplePayload,
        dataModel: {
          validationProgress: [
            {
              label: "Schema validation",
              value: 85,
              text: "Checking generated interface props.",
              tone: "info",
            },
          ],
        },
        nodes: [
          {
            id: "ValidationProgress",
            parentId: "root",
            order: 0,
            component: "ProgressList",
            props: {
              items: { path: "/validationProgress" },
            },
          },
        ],
      } satisfies ComposedInterfacePayload),
    );
    const updateComponents = built.messages.find(
      (message) => "updateComponents" in message,
    );

    expect(updateComponents).toMatchObject({
      updateComponents: {
        components: expect.arrayContaining([
          expect.objectContaining({
            id: "ValidationProgress",
            component: "ProgressList",
            items: { path: "/validationProgress" },
          }),
        ]),
      },
    });
  });

  it("accepts nested cards and wraps multiple card children", () => {
    const built = buildComposedInterfaceFromJson(
      JSON.stringify({
        ...simplePayload,
        nodes: [
          {
            id: "card",
            parentId: "root",
            order: 0,
            component: "Card",
            props: {
              theme: "normal",
              view: "filled",
              padding: "comfortable",
            },
          },
          {
            id: "card_title",
            parentId: "card",
            order: 0,
            component: "Text",
            props: {
              text: "Order summary",
              variant: "h3",
            },
          },
          {
            id: "card_labels",
            parentId: "card",
            order: 1,
            component: "LabelGroup",
            props: {
              items: [
                {
                  label: "Status",
                  value: "Ready",
                  tone: "success",
                  type: "default",
                },
              ],
            },
          },
          {
            id: "card_button",
            parentId: "card",
            order: 2,
            component: "Button",
            props: {
              text: "Open details",
              variant: "outlined",
              action: { event: { name: "open_details" } },
            },
          },
        ],
      } satisfies ComposedInterfacePayload),
    );
    const updateComponents = built.messages.find(
      (message) => "updateComponents" in message,
    );
    const components =
      updateComponents && "updateComponents" in updateComponents
        ? updateComponents.updateComponents.components
        : [];
    const card = components.find((component) => component.id === "card");

    expect(card).toMatchObject({
      component: "Card",
      child: expect.stringMatching(/^card_content/),
    });
    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringMatching(/^card_content/),
          component: "Column",
          children: ["card_title", "card_labels", "card_button"],
        }),
      ]),
    );
  });

  it("repairs accidental title and subtitle props on layout containers into Text children", () => {
    const built = buildComposedInterfaceFromJson(
      JSON.stringify({
        ...simplePayload,
        nodes: [
          {
            id: "topBar",
            parentId: "root",
            order: 0,
            component: "Row",
            props: {
              title: "Museum exhibit tracker",
              subtitle: "Artifacts, crates, notes, and curators",
              align: "center",
              gap: "normal",
            },
          },
          {
            id: "refresh",
            parentId: "topBar",
            order: 1,
            component: "Button",
            props: {
              text: "Refresh",
              variant: "outlined",
              action: { event: { name: "refresh" } },
            },
          },
        ],
      } satisfies ComposedInterfacePayload),
    );
    const updateComponents = built.messages.find(
      (message) => "updateComponents" in message,
    );
    const components =
      updateComponents && "updateComponents" in updateComponents
        ? updateComponents.updateComponents.components
        : [];

    expect(built.payload.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "topBar",
          props: {
            align: "center",
            gap: "normal",
          },
        }),
        expect.objectContaining({
          id: "topBar_title",
          component: "Text",
          props: expect.objectContaining({
            text: "Museum exhibit tracker",
          }),
        }),
        expect.objectContaining({
          id: "topBar_subtitle",
          component: "Text",
          props: expect.objectContaining({
            text: "Artifacts, crates, notes, and curators",
          }),
        }),
      ]),
    );
    expect(components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "topBar",
          component: "Row",
          children: expect.arrayContaining(["topBar_heading", "refresh"]),
        }),
        expect.objectContaining({
          id: "topBar_heading",
          component: "Column",
          children: ["topBar_title", "topBar_subtitle"],
        }),
      ]),
    );
  });

  it("rejects duplicate ids, unknown parents, cycles, non-container parents, and invalid actions", () => {
    expect(() =>
      buildComposedInterfaceFromJson(
        JSON.stringify({
          ...simplePayload,
          nodes: [
            simplePayload.nodes[0],
            { ...simplePayload.nodes[0], order: 1 },
          ],
        }),
      ),
    ).toThrow(/Duplicate node id/);

    expect(() =>
      buildComposedInterfaceFromJson(
        JSON.stringify({
          ...simplePayload,
          nodes: [
            {
              ...simplePayload.nodes[0],
              parentId: "missing",
            },
          ],
        }),
      ),
    ).toThrow(/unknown parent/);

    expect(() =>
      buildComposedInterfaceFromJson(
        JSON.stringify({
          ...simplePayload,
          nodes: [
            {
              id: "a",
              parentId: "b",
              order: 0,
              component: "Column",
              props: {},
            },
            {
              id: "b",
              parentId: "a",
              order: 0,
              component: "Column",
              props: {},
            },
          ],
        }),
      ),
    ).toThrow(/cycle/);

    expect(() =>
      buildComposedInterfaceFromJson(
        JSON.stringify({
          ...simplePayload,
          nodes: [
            {
              id: "text_parent",
              parentId: "root",
              order: 0,
              component: "Text",
              props: { text: "Parent" },
            },
            {
              id: "child",
              parentId: "text_parent",
              order: 0,
              component: "Text",
              props: { text: "Child" },
            },
          ],
        }),
      ),
    ).toThrow(/cannot receive children/);

    expect(() =>
      buildComposedInterfaceFromJson(
        JSON.stringify({
          ...simplePayload,
          nodes: [
            {
              ...simplePayload.nodes[1],
              props: {
                text: "Delete",
                action: { event: { name: "delete" } },
              },
            },
          ],
        }),
      ),
    ).toThrow(/Invalid props/);

    expect(() =>
      buildComposedInterfaceFromJson(
        JSON.stringify({
          ...simplePayload,
          nodes: [
            {
              ...simplePayload.nodes[0],
              props: {
                text: "Title",
                subtitle: "Wrong prop",
              },
            },
          ],
        }),
      ),
    ).toThrow(/Allowed props/);
  });

  it("renders complete partial nodes without throwing on incomplete JSON", () => {
    const partial = [
      '{"sequence":0,"surfaceId":"main","dataModel":{"title":"Live title"},',
      '"root":{"component":"Column","props":{"gap":"normal","align":"stretch"}},',
      '"nodes":[{"id":"title","parentId":"root","order":0,"component":"Text",',
      '"props":{"text":{"path":"/title"},"variant":"h2"}},{"id":"button"',
    ].join("");
    const built = buildComposedInterfaceFromPartialJson(partial, "main");
    const updateComponents = built?.messages.find(
      (message) => "updateComponents" in message,
    );

    expect(updateComponents).toMatchObject({
      updateComponents: {
        components: expect.arrayContaining([
          expect.objectContaining({
            id: "title",
            component: "Text",
          }),
        ]),
      },
    });
  });
});
