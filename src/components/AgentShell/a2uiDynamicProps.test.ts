import { Catalog, ComponentContext, ComponentModel, SurfaceModel } from "@a2ui/web_core/v0_9";
import { z } from "zod";
import { describe, expect, it } from "vitest";
import {
  resolveDynamicArray,
  resolveDynamicProps,
} from "./a2uiDynamicProps";

describe("resolveDynamicProps", () => {
  it("resolves nested data bindings inside literal array props", () => {
    const catalog = new Catalog("test", [
      {
        name: "LabelGroup",
        schema: z.object({}),
      },
    ]);
    const surface = new SurfaceModel("main", catalog);
    const rawProps = {
      items: [
        {
          label: { path: "/statusLabel" },
          value: { path: "/statusValue" },
          tone: "success",
          type: "copy",
        },
      ],
    };

    surface.dataModel.set("/", {
      statusLabel: "Status",
      statusValue: "Ready",
    });
    surface.componentsModel.addComponent(
      new ComponentModel("labels", "LabelGroup", rawProps),
    );

    const context = new ComponentContext(surface, "labels");

    expect(resolveDynamicProps(rawProps, context)).toEqual({
      items: [
        {
          label: "Status",
          value: "Ready",
          tone: "success",
          type: "copy",
        },
      ],
    });
  });

  it("validates resolved array props and falls back to an empty array", () => {
    const catalog = new Catalog("test", [
      {
        name: "ProgressList",
        schema: z.object({}),
      },
    ]);
    const surface = new SurfaceModel("main", catalog);
    const contextProps = {
      validItems: [
        {
          label: "Schema",
          value: 80,
        },
      ],
      missingItems: undefined,
      malformedItems: {
        label: "not an array",
      },
    };
    const schema = z.array(
      z.object({
        label: z.string(),
        value: z.number(),
      }),
    );

    surface.dataModel.set("/", contextProps);
    surface.componentsModel.addComponent(
      new ComponentModel("progress", "ProgressList", {
        valid: { path: "/validItems" },
        missing: { path: "/missingItems" },
        malformed: { path: "/malformedItems" },
      }),
    );

    const context = new ComponentContext(surface, "progress");

    expect(
      resolveDynamicArray(
        { items: { path: "/validItems" } },
        "items",
        context,
        schema,
      ),
    ).toEqual(contextProps.validItems);
    expect(
      resolveDynamicArray(
        { items: { path: "/missingItems" } },
        "items",
        context,
        schema,
      ),
    ).toEqual([]);
    expect(
      resolveDynamicArray(
        { items: { path: "/malformedItems" } },
        "items",
        context,
        schema,
      ),
    ).toEqual([]);
  });
});
