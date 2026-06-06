import { describe, expect, it } from "vitest";
import { buildGalleryRetrievalContext } from "@/lib/gallery/retrievalContext";
import type { PublishedDesign } from "@/lib/feedback/designFeedback";

const design: PublishedDesign = {
  id: "release-ops-123456789abc",
  title: "Release operations dashboard",
  summary:
    "Composed tree with 7 nodes: Text x2, Card x2, Button x1, Table x1, Alert x1.",
  surfaceId: "surface_release_ops",
  createdAtMs: 1_700_000_000_000,
  payload: {
    sequence: 1,
    surfaceId: "surface_release_ops",
    root: {
      component: "Column",
      props: { align: "stretch", gap: "normal" },
    },
    dataModel: {},
    nodes: [
      {
        id: "title",
        parentId: "root",
        order: 0,
        component: "Text",
        props: { text: "Release operations" },
      },
      {
        id: "alert",
        parentId: "root",
        order: 1,
        component: "AlertBlock",
        props: { title: "Deployment risk" },
      },
      {
        id: "table",
        parentId: "root",
        order: 2,
        component: "DataTable",
        props: {},
      },
      {
        id: "button",
        parentId: "root",
        order: 3,
        component: "Button",
        props: { text: "Approve" },
      },
    ],
  },
};

describe("buildGalleryRetrievalContext", () => {
  it("builds deterministic citation-friendly context without private prompt history", () => {
    const context = buildGalleryRetrievalContext(design);

    expect(context).toHaveLength(6);
    expect(context.map((section) => section.title)).toEqual([
      "Use case",
      "Visible workflow",
      "Generated component categories",
      "Reusable artifacts",
      "Limitations",
      "Prompt-improvement suggestions",
    ]);
    expect(context[0].body).toContain("Release operations dashboard");
    expect(context[1].body).toContain("review");
    expect(context[2].body).toContain("AlertBlock");
    expect(context[2].body).toContain("DataTable");
    expect(context[3].body).toContain("React export");
    expect(context[4].body).toContain("Original prompt history is not exposed");
    expect(context[5].body).toContain("data states");
    expect(JSON.stringify(context)).not.toContain("prompt history:");
  });

  it("classifies composed field controls as interactive controls", () => {
    const context = buildGalleryRetrievalContext({
      ...design,
      payload: {
        ...design.payload,
        nodes: [
          {
            id: "switch-field",
            parentId: "root",
            order: 0,
            component: "SwitchField",
            props: { label: "Enabled" },
          },
          {
            id: "select-field",
            parentId: "root",
            order: 1,
            component: "SelectField",
            props: { label: "Status" },
          },
          {
            id: "slider-field",
            parentId: "root",
            order: 2,
            component: "SliderField",
            props: { label: "Threshold" },
          },
        ],
      },
    });

    const componentContext = context.find(
      (section) => section.title === "Generated component categories",
    )?.body;

    expect(componentContext).toContain("interactive controls");
    expect(componentContext).toContain("SwitchField x1");
    expect(componentContext).toContain("SelectField x1");
    expect(componentContext).toContain("SliderField x1");
    expect(componentContext).not.toContain(
      "content components (SelectField, SliderField, SwitchField)",
    );
  });
});
