import { z } from "zod";
import {
  A2UI_VERSION,
  ALLOWED_A2UI_ACTIONS,
  GRAVITY_A2UI_CATALOG_ID,
  validateGravityA2uiMessage,
} from "./a2uiContract";
import type {
  GravityA2uiComponent,
  GravityA2uiMessage,
} from "./a2uiContract";

const idSchema = z
  .string()
  .min(1)
  .max(48)
  .regex(/^[A-Za-z][A-Za-z0-9_-]*$/);

const shortTextSchema = z.string().max(240);
const bodyTextSchema = z.string().max(1600);

const optionSchema = z
  .object({
    label: shortTextSchema,
    value: z.string().min(1).max(100),
  })
  .strict();

export const renderInterfaceArgumentsSchema = z
  .object({
    sequence: z.number().int().min(0).max(10_000),
    surfaceId: idSchema,
    title: shortTextSchema,
    summary: bodyTextSchema,
    tone: z.enum(["normal", "info", "success", "warning", "danger"]),
    sections: z
      .array(
        z
          .object({
            title: shortTextSchema,
            body: bodyTextSchema,
            items: z.array(shortTextSchema).max(8),
          })
          .strict(),
      )
      .max(6),
    fields: z
      .array(
        z
          .object({
            id: idSchema,
            label: shortTextSchema,
            type: z.enum([
              "shortText",
              "number",
              "email",
              "tel",
              "url",
              "checkbox",
              "singleChoice",
              "multipleChoice",
            ]),
            placeholder: shortTextSchema.nullable(),
            value: z.string().max(500).nullable(),
            checked: z.boolean().nullable(),
            options: z.array(optionSchema).max(10),
            required: z.boolean(),
          })
          .strict(),
      )
      .max(8),
    actions: z
      .array(
        z
          .object({
            label: shortTextSchema,
            action: z.enum(ALLOWED_A2UI_ACTIONS),
            variant: z.enum(["primary", "normal", "outlined", "flat"]),
          })
          .strict(),
      )
      .max(4),
  })
  .strict();

export type RenderInterfaceArguments = z.infer<
  typeof renderInterfaceArgumentsSchema
>;

export type BuiltFixedInterface = {
  sequence: number;
  messages: GravityA2uiMessage[];
};

export function buildFixedInterfaceFromJson(
  argumentsJson: string,
): BuiltFixedInterface {
  return buildFixedInterface(
    renderInterfaceArgumentsSchema.parse(JSON.parse(argumentsJson)),
  );
}

export function buildFixedInterface(
  args: RenderInterfaceArguments,
): BuiltFixedInterface {
  const title = cleanText(args.title, "Agent response");
  const summary = cleanText(args.summary, "");
  const sections = args.sections
    .map((section) => ({
      title: cleanText(section.title, ""),
      body: cleanText(section.body, ""),
      items: section.items.map((item) => cleanText(item, "")).filter(Boolean),
    }))
    .filter(
      (section) => section.title || section.body || section.items.length > 0,
    );
  const fieldKeys = createUniqueFieldKeys(args.fields);
  const fields = args.fields.map((field, index) => ({
    ...field,
    key: fieldKeys[index],
    label: cleanText(field.label, field.id),
    placeholder: field.placeholder ? cleanText(field.placeholder, "") : null,
    value: field.value ?? "",
  }));
  const actions = args.actions
    .map((action) => ({
      ...action,
      label: cleanText(action.label, action.action),
    }))
    .filter((action) => action.label);

  const components: GravityA2uiComponent[] = [];
  const contentChildren: string[] = ["title"];
  const dataModel = {
    title,
    summary,
    sections: sections.map((section) => ({
      title: section.title,
      body: section.body,
      items: section.items.map((item) => `- ${item}`),
    })),
    fields: Object.fromEntries(
      fields.map((field) => [field.key, initialFieldValue(field)]),
    ),
    actions: actions.map((action) => ({
      label: action.label,
      action: action.action,
    })),
  };

  if (summary) {
    contentChildren.push("summary");
  }

  sections.forEach((section, sectionIndex) => {
    if (contentChildren.length > 1) {
      const dividerId = `section_${sectionIndex}_divider`;
      components.push({
        id: dividerId,
        component: "Divider",
        axis: "horizontal",
      });
      contentChildren.push(dividerId);
    }

    if (section.title) {
      const titleId = `section_${sectionIndex}_title`;
      components.push({
        id: titleId,
        component: "Text",
        text: { path: `/sections/${sectionIndex}/title` },
        variant: "h3",
      });
      contentChildren.push(titleId);
    }

    if (section.body) {
      const bodyId = `section_${sectionIndex}_body`;
      components.push({
        id: bodyId,
        component: "Text",
        text: { path: `/sections/${sectionIndex}/body` },
        variant: "body",
        color: "secondary",
      });
      contentChildren.push(bodyId);
    }

    section.items.forEach((_, itemIndex) => {
      const itemId = `section_${sectionIndex}_item_${itemIndex}`;
      components.push({
        id: itemId,
        component: "Text",
        text: { path: `/sections/${sectionIndex}/items/${itemIndex}` },
        variant: "body",
      });
      contentChildren.push(itemId);
    });
  });

  if (fields.length > 0) {
    components.push({
      id: "fields_divider",
      component: "Divider",
      axis: "horizontal",
    });
    contentChildren.push("fields_divider");

    fields.forEach((field) => {
      const fieldComponent = createFieldComponent(field);
      components.push(fieldComponent);
      contentChildren.push(fieldComponent.id);
    });
  }

  if (actions.length > 0) {
    components.push({
      id: "actions_divider",
      component: "Divider",
      axis: "horizontal",
    });
    contentChildren.push("actions_divider");

    const actionIds = actions.map((action, index) => {
      const id = `action_${index}`;
      components.push({
        id,
        component: "Button",
        text: { path: `/actions/${index}/label` },
        variant: action.variant,
        action: {
          event: {
            name: action.action,
            context: {
              surfaceId: args.surfaceId,
              label: action.label,
              index,
            },
          },
        },
      });
      return id;
    });

    components.push({
      id: "actions",
      component: "Row",
      children: actionIds,
      justify: "end",
      align: "center",
    });
    contentChildren.push("actions");
  }

  components.unshift(
    {
      id: "root",
      component: "Column",
      children: ["surface_card"],
      align: "stretch",
    },
    {
      id: "surface_card",
      component: "Card",
      child: "content",
      theme: args.tone,
      view: "outlined",
    },
    {
      id: "content",
      component: "Column",
      children: contentChildren,
      align: "stretch",
    },
    {
      id: "title",
      component: "Text",
      text: { path: "/title" },
      variant: "h2",
    },
  );

  if (summary) {
    components.splice(4, 0, {
      id: "summary",
      component: "Text",
      text: { path: "/summary" },
      variant: "body",
      color: "secondary",
    });
  }

  const messages = [
    validateGravityA2uiMessage({
      version: A2UI_VERSION,
      createSurface: {
        surfaceId: args.surfaceId,
        catalogId: GRAVITY_A2UI_CATALOG_ID,
        sendDataModel: true,
      },
    }),
    validateGravityA2uiMessage({
      version: A2UI_VERSION,
      updateComponents: {
        surfaceId: args.surfaceId,
        components,
      },
    }),
    validateGravityA2uiMessage({
      version: A2UI_VERSION,
      updateDataModel: {
        surfaceId: args.surfaceId,
        path: "/",
        value: dataModel,
      },
    }),
  ];

  return {
    sequence: args.sequence,
    messages,
  };
}

function createFieldComponent(
  field: RenderInterfaceArguments["fields"][number] & { key: string },
): GravityA2uiComponent {
  const id = `field_${field.key}`;
  const value = { path: `/fields/${field.key}` };

  if (field.type === "checkbox") {
    return {
      id,
      component: "CheckBox",
      label: field.label,
      value,
    };
  }

  if (
    (field.type === "singleChoice" || field.type === "multipleChoice") &&
    field.options.length > 0
  ) {
    return {
      id,
      component: "ChoicePicker",
      label: field.label,
      variant:
        field.type === "multipleChoice" ? "multiple" : "mutuallyExclusive",
      options: field.options,
      value,
    };
  }

  return {
    id,
    component: "TextField",
    label: field.label,
    placeholder: field.placeholder || undefined,
    textFieldType:
      field.type === "number" ||
      field.type === "email" ||
      field.type === "tel" ||
      field.type === "url"
        ? field.type
        : "shortText",
    value,
  };
}

function initialFieldValue(
  field: RenderInterfaceArguments["fields"][number] & { key: string },
) {
  if (field.type === "checkbox") {
    return Boolean(field.checked);
  }

  if (field.type === "singleChoice") {
    return field.value ? [field.value] : [];
  }

  if (field.type === "multipleChoice") {
    return field.value
      ? field.value
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];
  }

  return field.value || "";
}

function createUniqueFieldKeys(fields: RenderInterfaceArguments["fields"]) {
  const used = new Set<string>();

  return fields.map((field, index) => {
    let key = field.id;

    if (used.has(key)) {
      key = `${field.id}_${index}`;
    }

    used.add(key);
    return key;
  });
}

function cleanText(value: string, fallback: string) {
  const trimmed = value.replace(/\s+/g, " ").trim();

  return trimmed || fallback;
}
