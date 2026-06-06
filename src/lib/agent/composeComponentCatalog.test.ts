import { describe, expect, it } from "vitest";
import { COMPOSE_COMPONENT_PROP_SPECS } from "./composeComponentCatalog";
import { ALLOWED_GRAVITY_ICONS, GRAVITY_TONES } from "./gravityCapabilities";

type JsonSchema = {
  enum?: unknown[];
  items?: JsonSchema;
  oneOf?: JsonSchema[];
  properties?: Record<string, JsonSchema>;
};

describe("compose component catalog", () => {
  it("allows data-bound MetricGrid tone and icon item props in the tool schema", () => {
    const metricGridSpecs = COMPOSE_COMPONENT_PROP_SPECS.MetricGrid as Record<
      string,
      { schema: unknown }
    >;
    const itemsSchema = metricGridSpecs.items.schema as JsonSchema;
    const arraySchema = itemsSchema.oneOf?.[0];
    const metricItemProperties = arraySchema?.items?.properties;

    expect(metricItemProperties?.tone.oneOf).toEqual([
      expect.objectContaining({ enum: [...GRAVITY_TONES] }),
      expect.objectContaining({
        properties: expect.objectContaining({ path: expect.any(Object) }),
      }),
    ]);
    expect(metricItemProperties?.icon.oneOf).toEqual([
      expect.objectContaining({ enum: [...ALLOWED_GRAVITY_ICONS, null] }),
      expect.objectContaining({
        properties: expect.objectContaining({ path: expect.any(Object) }),
      }),
    ]);
  });
});
