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
import { ALLOWED_GRAVITY_ICONS } from "./gravityCapabilities";

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
const toneSchema = z.enum(["normal", "info", "success", "warning", "danger"]);

const layoutSchema = z
  .object({
    density: z.enum(["compact", "comfortable", "spacious"]),
    sectionDividers: z.enum(["none", "minimal", "betweenSections"]),
  })
  .strict();
const iconNameSchema = z.enum(ALLOWED_GRAVITY_ICONS);
const metricSchema = z
  .object({
    label: shortTextSchema,
    value: shortTextSchema,
    description: shortTextSchema.nullable(),
    tone: toneSchema,
    icon: iconNameSchema.nullable(),
  })
  .strict();
const alertSchema = z
  .object({
    title: shortTextSchema,
    message: bodyTextSchema,
    tone: z.enum(["info", "success", "warning", "danger"]),
  })
  .strict();
const tableColumnSchema = z
  .object({
    id: idSchema,
    label: shortTextSchema,
    align: z.enum(["start", "center", "end"]),
  })
  .strict();
const tableSchema = z
  .object({
    title: shortTextSchema,
    columns: z.array(tableColumnSchema).min(1).max(6),
    rows: z
      .array(
        z
          .object({
            cells: z.array(shortTextSchema).max(6),
          })
          .strict(),
      )
      .max(12),
    emptyMessage: shortTextSchema,
  })
  .strict();
const progressSchema = z
  .object({
    label: shortTextSchema,
    value: z.number().min(0).max(100),
    text: shortTextSchema.nullable(),
    tone: z.enum(["normal", "info", "success", "warning", "danger"]),
  })
  .strict();
const definitionListSchema = z
  .object({
    title: shortTextSchema,
    items: z
      .array(
        z
          .object({
            label: shortTextSchema,
            value: shortTextSchema,
          })
          .strict(),
      )
      .min(1)
      .max(10),
  })
  .strict();
const hrefSchema = z
  .string()
  .min(1)
  .max(500)
  .regex(/^(https?:\/\/|mailto:|tel:|\/|#)/);
const linkSchema = z
  .object({
    label: shortTextSchema,
    href: hrefSchema,
    description: shortTextSchema.nullable(),
  })
  .strict();
const userSchema = z
  .object({
    name: shortTextSchema,
    description: shortTextSchema.nullable(),
    tone: z.enum(["normal", "info", "success", "warning", "danger"]),
  })
  .strict();

export const renderInterfaceArgumentsSchema = z
  .object({
    sequence: z.number().int().min(0).max(10_000),
    surfaceId: idSchema,
    title: shortTextSchema,
    titleIcon: iconNameSchema.nullable(),
    summary: bodyTextSchema,
    tone: toneSchema,
    layout: layoutSchema,
    alerts: z.array(alertSchema).max(3).default([]),
    metrics: z.array(metricSchema).max(8).default([]),
    sections: z
      .array(
        z
          .object({
            title: shortTextSchema,
            icon: iconNameSchema.nullable(),
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
              "switch",
              "singleChoice",
              "multipleChoice",
              "select",
              "slider",
            ]),
            placeholder: shortTextSchema.nullable(),
            value: z.string().max(500).nullable(),
            checked: z.boolean().nullable(),
            options: z.array(optionSchema).max(10),
            min: z.number().nullable().default(null),
            max: z.number().nullable().default(null),
            step: z.number().positive().nullable().default(null),
            required: z.boolean(),
          })
          .strict(),
      )
      .max(8),
    tables: z.array(tableSchema).max(3).default([]),
    progress: z.array(progressSchema).max(6).default([]),
    descriptions: z.array(definitionListSchema).max(4).default([]),
    links: z.array(linkSchema).max(8).default([]),
    users: z.array(userSchema).max(8).default([]),
    actions: z
      .array(
        z
          .object({
            label: shortTextSchema,
            icon: iconNameSchema.nullable(),
            action: z.enum(ALLOWED_A2UI_ACTIONS),
            variant: z.enum(["primary", "normal", "outlined", "flat"]),
          })
          .strict(),
      )
      .max(4),
    navigation: z
      .array(
        z
          .object({
            label: shortTextSchema,
            icon: iconNameSchema.nullable(),
            action: z.enum(ALLOWED_A2UI_ACTIONS),
            active: z.boolean(),
          })
          .strict(),
      )
      .max(8),
  })
  .strict();

export type RenderInterfaceArguments = z.infer<
  typeof renderInterfaceArgumentsSchema
>;

export type BuiltFixedInterface = {
  sequence: number;
  payload: RenderInterfaceArguments;
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
      icon: section.icon,
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
  const alerts = args.alerts
    .map((alert) => ({
      title: cleanText(alert.title, ""),
      message: cleanText(alert.message, ""),
      tone: alert.tone,
    }))
    .filter((alert) => alert.title || alert.message);
  const metrics = args.metrics
    .map((metric) => ({
      label: cleanText(metric.label, ""),
      value: cleanText(metric.value, ""),
      description: metric.description ? cleanText(metric.description, "") : null,
      tone: metric.tone,
      icon: metric.icon,
    }))
    .filter((metric) => metric.label && metric.value);
  const tables = args.tables
    .map((table) => {
      const columns = table.columns.map((column) => ({
        id: column.id,
        label: cleanText(column.label, column.id),
        align: column.align,
      }));

      return {
        title: cleanText(table.title, ""),
        columns,
        rows: table.rows.map((row) => ({
          cells: columns.map((_, index) => cleanText(row.cells[index] ?? "", "")),
        })),
        emptyMessage: cleanText(table.emptyMessage, "No data"),
      };
    })
    .filter((table) => table.columns.length > 0);
  const progress = args.progress
    .map((item) => ({
      label: cleanText(item.label, ""),
      value: Math.round(item.value),
      text: item.text ? cleanText(item.text, "") : null,
      tone: item.tone,
    }))
    .filter((item) => item.label);
  const descriptions = args.descriptions
    .map((description) => ({
      title: cleanText(description.title, ""),
      items: description.items
        .map((item) => ({
          label: cleanText(item.label, ""),
          value: cleanText(item.value, ""),
        }))
        .filter((item) => item.label && item.value),
    }))
    .filter((description) => description.items.length > 0);
  const links = args.links
    .map((link) => ({
      label: cleanText(link.label, ""),
      href: link.href,
      description: link.description ? cleanText(link.description, "") : null,
    }))
    .filter((link) => link.label);
  const users = args.users
    .map((user) => ({
      name: cleanText(user.name, ""),
      description: user.description ? cleanText(user.description, "") : null,
      tone: user.tone,
    }))
    .filter((user) => user.name);

  const components: GravityA2uiComponent[] = [];
  const contentChildren: string[] = ["title"];
  const gap = mapDensityToGap(args.layout.density);
  const dataModel = {
    title,
    titleIcon: args.titleIcon,
    summary,
    layout: args.layout,
    navigation: args.navigation,
    alerts,
    metrics,
    sections: sections.map((section) => ({
      title: section.title,
      icon: section.icon,
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
    tables,
    progress,
    descriptions,
    links,
    users,
  };

  if (summary) {
    contentChildren.push("summary");
  }

  if (args.navigation.length > 0) {
    const navigationIds = args.navigation.map((item, index) => {
      const id = `navigation_${index}`;
      components.push({
        id,
        component: "Button",
        text: item.label,
        icon: item.icon ?? undefined,
        variant: item.active ? "primary" : "flat",
        action: {
          event: {
            name: item.action,
            context: {
              surfaceId: args.surfaceId,
              label: item.label,
              index,
              source: "navigation",
            },
          },
        },
      });

      return id;
    });

    components.push({
      id: "navigation",
      component: "NavigationBar",
      children: navigationIds,
    });
    contentChildren.push("navigation");
  }

  alerts.forEach((alert, index) => {
    const id = `alert_${index}`;
    components.push({
      id,
      component: "AlertBlock",
      title: alert.title,
      message: alert.message,
      tone: alert.tone,
    });
    contentChildren.push(id);
  });

  if (metrics.length > 0) {
    components.push({
      id: "metrics",
      component: "MetricGrid",
      items: metrics,
    });
    contentChildren.push("metrics");
  }

  sections.forEach((section, sectionIndex) => {
    if (shouldAddSectionDivider(args.layout.sectionDividers, sectionIndex)) {
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
      const titleTextId = `${titleId}_text`;
      const titleComponents: GravityA2uiComponent[] = [
        {
          id: titleTextId,
          component: "Text",
          text: { path: `/sections/${sectionIndex}/title` },
          variant: "h3",
        },
      ];

      if (section.icon) {
        const iconId = `${titleId}_icon`;
        titleComponents.unshift({
          id: iconId,
          component: "Icon",
          name: section.icon,
          color: "secondary",
          size: "s",
        });
        titleComponents.push({
          id: titleId,
          component: "Row",
          children: [iconId, titleTextId],
          align: "center",
          gap: "compact",
        });
      } else {
        titleComponents[0] = {
          id: titleId,
          component: "Text",
          text: { path: `/sections/${sectionIndex}/title` },
          variant: "h3",
        };
      }

      components.push(...titleComponents);
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

  descriptions.forEach((description, index) => {
    const id = `description_${index}`;
    components.push({
      id,
      component: "DefinitionListBlock",
      title: description.title,
      items: description.items,
    });
    contentChildren.push(id);
  });

  tables.forEach((table, index) => {
    const id = `table_${index}`;
    components.push({
      id,
      component: "DataTable",
      title: table.title,
      columns: table.columns,
      rows: table.rows,
      emptyMessage: table.emptyMessage,
    });
    contentChildren.push(id);
  });

  if (progress.length > 0) {
    components.push({
      id: "progress",
      component: "ProgressList",
      items: progress,
    });
    contentChildren.push("progress");
  }

  if (users.length > 0) {
    components.push({
      id: "users",
      component: "UserList",
      items: users,
    });
    contentChildren.push("users");
  }

  if (links.length > 0) {
    components.push({
      id: "links",
      component: "LinkList",
      items: links,
    });
    contentChildren.push("links");
  }

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
        icon: action.icon ?? undefined,
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
      theme: "normal",
      view: "filled",
      padding: mapDensityToPadding(args.layout.density),
    },
    {
      id: "content",
      component: "Column",
      children: contentChildren,
      align: "stretch",
      gap,
    },
    ...createTitleComponents(args.titleIcon),
  );

  if (summary) {
    components.splice(args.titleIcon ? 6 : 4, 0, {
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
    payload: {
      ...args,
      title,
      titleIcon: args.titleIcon,
      summary,
      layout: args.layout,
      navigation: args.navigation,
      alerts,
      metrics,
      sections,
      fields: fields.map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        placeholder: field.placeholder,
        value: field.value,
        checked: field.checked,
        options: field.options,
        min: field.min,
        max: field.max,
        step: field.step,
        required: field.required,
      })),
      tables,
      progress,
      descriptions,
      links,
      users,
      actions,
    },
    messages,
  };
}

function createTitleComponents(
  titleIcon: RenderInterfaceArguments["titleIcon"],
): GravityA2uiComponent[] {
  if (!titleIcon) {
    return [
      {
        id: "title",
        component: "Text",
        text: { path: "/title" },
        variant: "h2",
      },
    ];
  }

  return [
    {
      id: "title",
      component: "Row",
      children: ["title_icon", "title_text"],
      align: "center",
      gap: "compact",
    },
    {
      id: "title_icon",
      component: "Icon",
      name: titleIcon,
      color: "secondary",
      size: "m",
    },
    {
      id: "title_text",
      component: "Text",
      text: { path: "/title" },
      variant: "h2",
    },
  ];
}

function mapDensityToGap(
  density: RenderInterfaceArguments["layout"]["density"],
) {
  switch (density) {
    case "compact":
      return "compact";
    case "spacious":
      return "spacious";
    default:
      return "normal";
  }
}

function mapDensityToPadding(
  density: RenderInterfaceArguments["layout"]["density"],
) {
  switch (density) {
    case "compact":
      return "normal";
    case "spacious":
      return "spacious";
    default:
      return "comfortable";
  }
}

function shouldAddSectionDivider(
  mode: RenderInterfaceArguments["layout"]["sectionDividers"],
  sectionIndex: number,
) {
  if (mode === "none") {
    return false;
  }

  if (mode === "minimal") {
    return sectionIndex > 0;
  }

  return true;
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

  if (field.type === "switch") {
    return {
      id,
      component: "SwitchField",
      label: field.label,
      value,
    };
  }

  if (field.type === "select" && field.options.length > 0) {
    return {
      id,
      component: "SelectField",
      label: field.label,
      placeholder: field.placeholder || undefined,
      options: field.options,
      value,
    };
  }

  if (field.type === "slider") {
    return {
      id,
      component: "SliderField",
      label: field.label,
      value,
      min: field.min ?? 0,
      max: field.max ?? 100,
      step: field.step ?? 1,
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
  if (field.type === "checkbox" || field.type === "switch") {
    return Boolean(field.checked);
  }

  if (field.type === "singleChoice" || field.type === "select") {
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

  if (field.type === "slider") {
    const parsedValue = Number(field.value);

    return Number.isFinite(parsedValue) ? parsedValue : field.min ?? 0;
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
