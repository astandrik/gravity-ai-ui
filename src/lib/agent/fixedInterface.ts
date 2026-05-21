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
import {
  ALLOWED_GRAVITY_ICONS,
  GRAVITY_ACCORDION_ARROW_POSITIONS,
  GRAVITY_ACCORDION_SIZES,
  GRAVITY_ACCORDION_VIEWS,
  GRAVITY_BUTTON_VARIANTS,
  GRAVITY_DENSITIES,
  GRAVITY_EMPTY_STATE_SIZES,
  GRAVITY_FIELD_TYPES,
  GRAVITY_LABEL_TYPES,
  GRAVITY_LOADING_SIZES,
  GRAVITY_SECTION_DIVIDERS,
  GRAVITY_STATUS_TONES,
  GRAVITY_STEPPER_SIZES,
  GRAVITY_STEPPER_VIEWS,
  GRAVITY_TABLE_ALIGN,
  GRAVITY_TAB_SIZES,
  GRAVITY_TONES,
} from "./gravityCapabilities";

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
const toneSchema = z.enum(GRAVITY_TONES);

const layoutSchema = z
  .object({
    density: z.enum(GRAVITY_DENSITIES),
    sectionDividers: z.enum(GRAVITY_SECTION_DIVIDERS),
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
    tone: z.enum(GRAVITY_STATUS_TONES),
  })
  .strict();
const tableColumnSchema = z
  .object({
    id: idSchema,
    label: shortTextSchema,
    align: z.enum(GRAVITY_TABLE_ALIGN),
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
    tone: toneSchema,
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
    tone: toneSchema,
  })
  .strict();
const labelSchema = z
  .object({
    label: shortTextSchema,
    value: shortTextSchema.nullable(),
    tone: toneSchema,
    type: z.enum(GRAVITY_LABEL_TYPES),
  })
  .strict();
const tabItemSchema = z
  .object({
    label: shortTextSchema,
    value: idSchema,
    body: bodyTextSchema,
    counter: shortTextSchema.nullable(),
    tone: toneSchema,
    active: z.boolean(),
  })
  .strict();
const tabsSchema = z
  .object({
    title: shortTextSchema,
    size: z.enum(GRAVITY_TAB_SIZES),
    items: z.array(tabItemSchema).min(2).max(8),
  })
  .strict();
const emptyStateSchema = z
  .object({
    title: shortTextSchema,
    description: bodyTextSchema,
    icon: iconNameSchema.nullable(),
    tone: toneSchema,
    size: z.enum(GRAVITY_EMPTY_STATE_SIZES),
  })
  .strict();
const loadingStateSchema = z
  .object({
    label: shortTextSchema,
    description: shortTextSchema.nullable(),
    size: z.enum(GRAVITY_LOADING_SIZES),
  })
  .strict();
const breadcrumbTrailSchema = z
  .object({
    title: shortTextSchema,
    showRoot: z.boolean(),
    items: z
      .array(
        z
          .object({
            label: shortTextSchema,
            href: hrefSchema.nullable(),
          })
          .strict(),
      )
      .min(2)
      .max(8),
  })
  .strict();
const stepperItemSchema = z
  .object({
    label: shortTextSchema,
    value: idSchema,
    view: z.enum(GRAVITY_STEPPER_VIEWS),
    disabled: z.boolean(),
    active: z.boolean(),
  })
  .strict();
const stepperSchema = z
  .object({
    title: shortTextSchema,
    size: z.enum(GRAVITY_STEPPER_SIZES),
    items: z.array(stepperItemSchema).min(2).max(8),
  })
  .strict();
const accordionSchema = z
  .object({
    title: shortTextSchema,
    size: z.enum(GRAVITY_ACCORDION_SIZES),
    view: z.enum(GRAVITY_ACCORDION_VIEWS),
    arrowPosition: z.enum(GRAVITY_ACCORDION_ARROW_POSITIONS),
    items: z
      .array(
        z
          .object({
            title: shortTextSchema,
            body: bodyTextSchema,
            expanded: z.boolean(),
            disabled: z.boolean(),
          })
          .strict(),
      )
      .min(1)
      .max(8),
  })
  .strict();
const copyListSchema = z
  .object({
    title: shortTextSchema,
    items: z
      .array(
        z
          .object({
            label: shortTextSchema,
            value: shortTextSchema,
            copyText: z.string().min(1).max(1000),
          })
          .strict(),
      )
      .min(1)
      .max(8),
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
            type: z.enum(GRAVITY_FIELD_TYPES),
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
    labels: z.array(labelSchema).max(12).default([]),
    tabs: z.array(tabsSchema).max(3).default([]),
    emptyStates: z.array(emptyStateSchema).max(2).default([]),
    loadingStates: z.array(loadingStateSchema).max(4).default([]),
    breadcrumbs: z.array(breadcrumbTrailSchema).max(2).default([]),
    steppers: z.array(stepperSchema).max(3).default([]),
    accordions: z.array(accordionSchema).max(3).default([]),
    copyLists: z.array(copyListSchema).max(4).default([]),
    actions: z
      .array(
        z
          .object({
            label: shortTextSchema,
            icon: iconNameSchema.nullable(),
            action: z.enum(ALLOWED_A2UI_ACTIONS),
            variant: z.enum(GRAVITY_BUTTON_VARIANTS),
            disabled: z.boolean().optional(),
            loading: z.boolean().optional(),
            selected: z.boolean().optional(),
          })
          .strict(),
      )
      .max(8),
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

export function buildProgressivePlaceholderInterface({
  status,
  surfaceId,
}: {
  status: string;
  surfaceId: string;
}): GravityA2uiMessage[] {
  return [
    validateGravityA2uiMessage({
      version: A2UI_VERSION,
      createSurface: {
        surfaceId,
        catalogId: GRAVITY_A2UI_CATALOG_ID,
        sendDataModel: true,
      },
    }),
    validateGravityA2uiMessage({
      version: A2UI_VERSION,
      updateComponents: {
        surfaceId,
        components: [
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
            padding: "comfortable",
          },
          {
            id: "content",
            component: "Column",
            children: ["title", "summary", "status_row"],
            align: "stretch",
            gap: "normal",
          },
          {
            id: "title",
            component: "Text",
            text: { path: "/title" },
            variant: "h2",
          },
          {
            id: "summary",
            component: "Text",
            text: { path: "/summary" },
            variant: "body",
            color: "secondary",
          },
          {
            id: "status_row",
            component: "Row",
            children: ["status_button", "status_text"],
            align: "center",
            gap: "compact",
          },
          {
            id: "status_button",
            component: "Button",
            text: "Generating",
            variant: "outlined",
            disabled: true,
            loading: true,
          },
          {
            id: "status_text",
            component: "Text",
            text: { path: "/status" },
            variant: "body",
            color: "secondary",
          },
        ],
      },
    }),
    buildProgressiveStatusUpdate(surfaceId, status, {
      summary: "Preparing a trusted Gravity UI preview from the request.",
      title: "Generating interface",
    }),
  ];
}

export function buildProgressiveStatusUpdate(
  surfaceId: string,
  status: string,
  initialData?: { title: string; summary: string },
): GravityA2uiMessage {
  return validateGravityA2uiMessage({
    version: A2UI_VERSION,
    updateDataModel: {
      surfaceId,
      path: initialData ? "/" : "/status",
      value: initialData
        ? {
            title: initialData.title,
            summary: initialData.summary,
            status,
          }
        : status,
    },
  });
}

export function buildFixedInterfaceFromJson(
  argumentsJson: string,
): BuiltFixedInterface {
  return buildFixedInterface(
    renderInterfaceArgumentsSchema.parse(JSON.parse(argumentsJson)),
  );
}

export function buildFixedInterfaceFromPartialJson(
  argumentsJson: string,
  fallbackSurfaceId: string,
): BuiltFixedInterface | null {
  const fields = parseCompleteTopLevelFields(argumentsJson);

  if (!hasRenderablePartial(fields)) {
    return null;
  }

  const args: RenderInterfaceArguments = {
    sequence: readSchemaField("sequence", fields.sequence, 0),
    surfaceId: readSchemaField("surfaceId", fields.surfaceId, fallbackSurfaceId),
    title: readSchemaField("title", fields.title, "Generating interface"),
    titleIcon: readSchemaField("titleIcon", fields.titleIcon, null),
    summary: readSchemaField("summary", fields.summary, ""),
    tone: readSchemaField("tone", fields.tone, "info"),
    layout: readSchemaField("layout", fields.layout, {
      density: "comfortable",
      sectionDividers: "minimal",
    }),
    alerts: readSchemaField("alerts", fields.alerts, []),
    metrics: readSchemaField("metrics", fields.metrics, []),
    sections: readSchemaField("sections", fields.sections, []),
    fields: readSchemaField("fields", fields.fields, []),
    tables: readSchemaField("tables", fields.tables, []),
    progress: readSchemaField("progress", fields.progress, []),
    descriptions: readSchemaField("descriptions", fields.descriptions, []),
    links: readSchemaField("links", fields.links, []),
    users: readSchemaField("users", fields.users, []),
    labels: readSchemaField("labels", fields.labels, []),
    tabs: readSchemaField("tabs", fields.tabs, []),
    emptyStates: readSchemaField("emptyStates", fields.emptyStates, []),
    loadingStates: readSchemaField("loadingStates", fields.loadingStates, []),
    breadcrumbs: readSchemaField("breadcrumbs", fields.breadcrumbs, []),
    steppers: readSchemaField("steppers", fields.steppers, []),
    accordions: readSchemaField("accordions", fields.accordions, []),
    copyLists: readSchemaField("copyLists", fields.copyLists, []),
    actions: readSchemaField("actions", fields.actions, []),
    navigation: readSchemaField("navigation", fields.navigation, []),
  };
  const parsed = renderInterfaceArgumentsSchema.safeParse(args);

  return parsed.success ? buildFixedInterface(parsed.data) : null;
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
      disabled: Boolean(action.disabled),
      loading: Boolean(action.loading),
      selected: Boolean(action.selected),
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
  const labels = args.labels
    .map((label) => ({
      label: cleanText(label.label, ""),
      value: label.value ? cleanText(label.value, "") : null,
      tone: label.tone,
      type: label.type,
    }))
    .filter((label) => label.label);
  const tabs = args.tabs
    .map((tabBlock) => {
      const items = tabBlock.items
        .map((item) => ({
          label: cleanText(item.label, ""),
          value: item.value,
          body: cleanText(item.body, ""),
          counter: item.counter ? cleanText(item.counter, "") : null,
          tone: item.tone,
          active: item.active,
        }))
        .filter((item) => item.label && item.body);

      const activeValue =
        items.find((item) => item.active)?.value ?? items[0]?.value ?? "";

      return {
        title: cleanText(tabBlock.title, ""),
        size: tabBlock.size,
        items: items.map((item) => ({
          ...item,
          active: item.value === activeValue,
        })),
      };
    })
    .filter((tabBlock) => tabBlock.items.length > 1);
  const emptyStates = args.emptyStates
    .map((emptyState) => ({
      title: cleanText(emptyState.title, ""),
      description: cleanText(emptyState.description, ""),
      icon: emptyState.icon,
      tone: emptyState.tone,
      size: emptyState.size,
    }))
    .filter((emptyState) => emptyState.title || emptyState.description);
  const loadingStates = args.loadingStates
    .map((loadingState) => ({
      label: cleanText(loadingState.label, ""),
      description: loadingState.description
        ? cleanText(loadingState.description, "")
        : null,
      size: loadingState.size,
    }))
    .filter((loadingState) => loadingState.label);
  const breadcrumbs = args.breadcrumbs
    .map((trail) => ({
      title: cleanText(trail.title, ""),
      showRoot: trail.showRoot,
      items: trail.items
        .map((item) => ({
          label: cleanText(item.label, ""),
          href: item.href,
        }))
        .filter((item) => item.label),
    }))
    .filter((trail) => trail.items.length > 1);
  const steppers = args.steppers
    .map((stepper) => {
      const items = stepper.items
        .map((item) => ({
          label: cleanText(item.label, ""),
          value: item.value,
          view: item.view,
          disabled: item.disabled,
          active: item.active,
        }))
        .filter((item) => item.label);
      const activeValue =
        items.find((item) => item.active)?.value ?? items[0]?.value ?? "";

      return {
        title: cleanText(stepper.title, ""),
        size: stepper.size,
        items: items.map((item) => ({
          ...item,
          active: item.value === activeValue,
        })),
      };
    })
    .filter((stepper) => stepper.items.length > 1);
  const accordions = args.accordions
    .map((accordion) => ({
      title: cleanText(accordion.title, ""),
      size: accordion.size,
      view: accordion.view,
      arrowPosition: accordion.arrowPosition,
      items: accordion.items
        .map((item) => ({
          title: cleanText(item.title, ""),
          body: cleanText(item.body, ""),
          expanded: item.expanded,
          disabled: item.disabled,
        }))
        .filter((item) => item.title && item.body),
    }))
    .filter((accordion) => accordion.items.length > 0);
  const copyLists = args.copyLists
    .map((copyList) => ({
      title: cleanText(copyList.title, ""),
      items: copyList.items
        .map((item) => ({
          label: cleanText(item.label, ""),
          value: cleanText(item.value, ""),
          copyText: item.copyText,
        }))
        .filter((item) => item.label && item.value && item.copyText),
    }))
    .filter((copyList) => copyList.items.length > 0);

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
      disabled: action.disabled,
      loading: action.loading,
      selected: action.selected,
    })),
    tables,
    progress,
    descriptions,
    links,
    users,
    labels,
    tabs,
    emptyStates,
    loadingStates,
    breadcrumbs,
    steppers,
    accordions,
    copyLists,
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

  breadcrumbs.forEach((trail, index) => {
    const id = `breadcrumbs_${index}`;
    components.push({
      id,
      component: "BreadcrumbTrail",
      title: trail.title,
      showRoot: trail.showRoot,
      items: trail.items,
    });
    contentChildren.push(id);
  });

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

  if (labels.length > 0) {
    components.push({
      id: "labels",
      component: "LabelGroup",
      items: labels,
    });
    contentChildren.push("labels");
  }

  steppers.forEach((stepper, index) => {
    const id = `stepper_${index}`;
    components.push({
      id,
      component: "StepperBlock",
      title: stepper.title,
      size: stepper.size,
      items: stepper.items,
    });
    contentChildren.push(id);
  });

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

  tabs.forEach((tabBlock, index) => {
    const id = `tabs_${index}`;
    components.push({
      id,
      component: "TabsBlock",
      title: tabBlock.title,
      size: tabBlock.size,
      items: tabBlock.items,
    });
    contentChildren.push(id);
  });

  accordions.forEach((accordion, index) => {
    const id = `accordion_${index}`;
    components.push({
      id,
      component: "AccordionBlock",
      title: accordion.title,
      size: accordion.size,
      view: accordion.view,
      arrowPosition: accordion.arrowPosition,
      items: accordion.items,
    });
    contentChildren.push(id);
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

  if (loadingStates.length > 0) {
    components.push({
      id: "loading_states",
      component: "LoadingStateList",
      items: loadingStates,
    });
    contentChildren.push("loading_states");
  }

  if (emptyStates.length > 0) {
    components.push({
      id: "empty_states",
      component: "EmptyStateList",
      items: emptyStates,
    });
    contentChildren.push("empty_states");
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

  copyLists.forEach((copyList, index) => {
    const id = `copy_list_${index}`;
    components.push({
      id,
      component: "CopyList",
      title: copyList.title,
      items: copyList.items,
    });
    contentChildren.push(id);
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
        icon: action.icon ?? undefined,
        variant: action.variant,
        disabled: action.disabled || undefined,
        loading: action.loading || undefined,
        selected: action.selected || undefined,
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
      labels,
      tabs,
      emptyStates,
      loadingStates,
      breadcrumbs,
      steppers,
      accordions,
      copyLists,
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

function readSchemaField<Key extends keyof RenderInterfaceArguments>(
  key: Key,
  value: unknown,
  fallback: RenderInterfaceArguments[Key],
): RenderInterfaceArguments[Key] {
  const parsed = renderInterfaceArgumentsSchema.shape[key].safeParse(value);

  return parsed.success
    ? (parsed.data as RenderInterfaceArguments[Key])
    : fallback;
}

function hasRenderablePartial(fields: Record<string, unknown>) {
  return (
    (typeof fields.title === "string" &&
      fields.title.trim().length > 0 &&
      typeof fields.summary === "string" &&
      fields.summary.trim().length > 0) ||
    hasItems(fields.alerts) ||
    hasItems(fields.metrics) ||
    hasItems(fields.sections) ||
    hasItems(fields.fields) ||
    hasItems(fields.tables) ||
    hasItems(fields.progress) ||
    hasItems(fields.descriptions) ||
    hasItems(fields.links) ||
    hasItems(fields.users) ||
    hasItems(fields.labels) ||
    hasItems(fields.tabs) ||
    hasItems(fields.emptyStates) ||
    hasItems(fields.loadingStates) ||
    hasItems(fields.breadcrumbs) ||
    hasItems(fields.steppers) ||
    hasItems(fields.accordions) ||
    hasItems(fields.copyLists) ||
    hasItems(fields.actions) ||
    hasItems(fields.navigation)
  );
}

function hasItems(value: unknown) {
  return Array.isArray(value) && value.length > 0;
}

function parseCompleteTopLevelFields(source: string) {
  const fields: Record<string, unknown> = {};
  let index = skipWhitespace(source, 0);

  if (source[index] !== "{") {
    return fields;
  }

  index += 1;

  while (index < source.length) {
    index = skipWhitespace(source, index);

    if (source[index] === "}") {
      return fields;
    }

    const keySpan = readJsonStringSpan(source, index);

    if (!keySpan) {
      return fields;
    }

    let key: string;

    try {
      key = JSON.parse(source.slice(index, keySpan.end));
    } catch {
      return fields;
    }

    index = skipWhitespace(source, keySpan.end);

    if (source[index] !== ":") {
      return fields;
    }

    index = skipWhitespace(source, index + 1);

    const valueSpan = readJsonValueSpan(source, index);

    if (!valueSpan) {
      return fields;
    }

    const nextIndex = skipWhitespace(source, valueSpan.end);

    if (nextIndex >= source.length && !valueSpan.completeAtEnd) {
      return fields;
    }

    try {
      fields[key] = JSON.parse(source.slice(index, valueSpan.end));
    } catch {
      return fields;
    }

    if (nextIndex >= source.length || source[nextIndex] === "}") {
      return fields;
    }

    if (source[nextIndex] !== ",") {
      return fields;
    }

    index = nextIndex + 1;
  }

  return fields;
}

function readJsonValueSpan(source: string, start: number) {
  const firstChar = source[start];

  if (firstChar === '"') {
    const span = readJsonStringSpan(source, start);

    return span ? { ...span, completeAtEnd: true } : null;
  }

  if (firstChar === "{" || firstChar === "[") {
    const span = readBalancedJsonSpan(source, start);

    return span ? { ...span, completeAtEnd: true } : null;
  }

  let index = start;

  while (index < source.length && source[index] !== "," && source[index] !== "}") {
    index += 1;
  }

  return index > start && index < source.length
    ? { end: index, completeAtEnd: false }
    : null;
}

function readJsonStringSpan(source: string, start: number) {
  if (source[start] !== '"') {
    return null;
  }

  let escaped = false;

  for (let index = start + 1; index < source.length; index += 1) {
    const char = source[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      return { end: index + 1 };
    }
  }

  return null;
}

function readBalancedJsonSpan(source: string, start: number) {
  const opening = source[start];
  const closing = opening === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === opening) {
      depth += 1;
      continue;
    }

    if (char === closing) {
      depth -= 1;

      if (depth === 0) {
        return { end: index + 1 };
      }
    }
  }

  return null;
}

function skipWhitespace(source: string, start: number) {
  let index = start;

  while (index < source.length && /\s/.test(source[index])) {
    index += 1;
  }

  return index;
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
