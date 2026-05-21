import { describe, expect, it } from "vitest";
import { GRAVITY_A2UI_CATALOG_ID } from "./a2uiContract";
import {
  parseFunctionCallArguments,
  parseFunctionToolCallItem,
} from "./openaiAgent";

const interfaceArgs = {
  sequence: 0,
  surfaceId: "main",
  title: "Deployment review",
  summary: "Review the generated checklist before continuing.",
  tone: "info",
  sections: [
    {
      title: "Checklist",
      body: "The shell will render this from fixed interface data.",
      items: ["Validate config", "Run checks"],
    },
  ],
  fields: [
    {
      id: "approver",
      label: "Approver",
      type: "shortText",
      placeholder: "Name",
      value: "",
      checked: null,
      options: [],
      required: true,
    },
  ],
  actions: [
    {
      label: "Continue",
      action: "next",
      variant: "primary",
    },
  ],
};

describe("OpenAI agent stream parsing", () => {
  it("builds canonical A2UI messages from fixed interface data", () => {
    expect(
      parseFunctionToolCallItem({
        type: "function_call",
        id: "item_render",
        call_id: "call_render",
        name: "render_agent_interface",
        arguments: JSON.stringify(interfaceArgs),
      }),
    ).toMatchObject({
      sequence: 0,
      messages: [
        {
          version: "v0.9",
          createSurface: {
            surfaceId: "main",
            catalogId: GRAVITY_A2UI_CATALOG_ID,
            sendDataModel: true,
          },
        },
        {
          version: "v0.9",
          updateComponents: {
            surfaceId: "main",
          },
        },
        {
          version: "v0.9",
          updateDataModel: {
            surfaceId: "main",
            path: "/",
          },
        },
      ],
    });
  });

  it("keeps the generated component tree valid and rooted", () => {
    const parsed = parseFunctionToolCallItem({
      type: "function_call",
      id: "item_render",
      call_id: "call_render",
      name: "render_agent_interface",
      arguments: JSON.stringify(interfaceArgs),
    });

    expect(parsed?.messages[1]).toMatchObject({
      updateComponents: {
        components: expect.arrayContaining([
          expect.objectContaining({
            id: "root",
            component: "Column",
          }),
          expect.objectContaining({
            id: "field_approver",
            component: "TextField",
          }),
          expect.objectContaining({
            id: "action_0",
            component: "Button",
          }),
        ]),
      },
    });
  });

  it("deduplicates repeated function output items", () => {
    const processedToolCalls = new Set<string>();
    const item = {
      type: "function_call",
      id: "item_1",
      call_id: "call_1",
      name: "render_agent_interface",
      arguments: JSON.stringify(interfaceArgs),
    };

    expect(parseFunctionToolCallItem(item, processedToolCalls)).not.toBeNull();
    expect(parseFunctionToolCallItem(item, processedToolCalls)).toBeNull();
  });

  it("does not mark nameless function argument events as processed", () => {
    const processedToolCalls = new Set<string>();
    const argumentsJson = JSON.stringify(interfaceArgs);

    expect(
      parseFunctionCallArguments({
        id: "item_without_name",
        argumentsJson,
        processedToolCalls,
      }),
    ).toBeNull();
    expect(processedToolCalls.has("item_without_name")).toBe(false);

    expect(
      parseFunctionToolCallItem(
        {
          type: "function_call",
          id: "item_without_name",
          call_id: "call_render",
          name: "render_agent_interface",
          arguments: argumentsJson,
        },
        processedToolCalls,
      ),
    ).toMatchObject({
      sequence: 0,
      messages: expect.arrayContaining([
        expect.objectContaining({
          version: "v0.9",
          createSurface: {
            surfaceId: "main",
            catalogId: GRAVITY_A2UI_CATALOG_ID,
            sendDataModel: true,
          },
        }),
      ]),
    });
  });
});
