import {
  ALLOWED_A2UI_ACTIONS,
  ALLOWED_A2UI_COMPONENTS,
} from "./a2uiContract";
import {
  ALLOWED_GRAVITY_ICONS,
  GRAVITY_ACCORDION_ARROW_POSITIONS,
  GRAVITY_ACCORDION_SIZES,
  GRAVITY_ACCORDION_VIEWS,
  GRAVITY_BUTTON_VARIANTS,
  GRAVITY_CARD_GRID_COLUMNS,
  GRAVITY_CARD_GRID_VARIANTS,
  GRAVITY_CARD_PADDING,
  GRAVITY_CARD_VIEWS,
  GRAVITY_CHOICE_PICKER_VARIANTS,
  GRAVITY_DIVIDER_AXES,
  GRAVITY_EMPTY_STATE_SIZES,
  GRAVITY_GAPS,
  GRAVITY_ICON_SIZES,
  GRAVITY_LABEL_TYPES,
  GRAVITY_LAYOUT_ALIGN,
  GRAVITY_LAYOUT_JUSTIFY,
  GRAVITY_LOADING_SIZES,
  GRAVITY_STATUS_TONES,
  GRAVITY_STEPPER_SIZES,
  GRAVITY_STEPPER_VIEWS,
  GRAVITY_TABLE_ALIGN,
  GRAVITY_TAB_SIZES,
  GRAVITY_TEXT_COLORS,
  GRAVITY_TEXT_FIELD_TYPES,
  GRAVITY_TEXT_VARIANTS,
  GRAVITY_TONES,
} from "./gravityCapabilities";

type ComponentName = (typeof ALLOWED_A2UI_COMPONENTS)[number];
type JsonSchema = Record<string, unknown>;

type PropSpec = {
  schema: JsonSchema;
  required?: boolean;
};

const idSchema = {
  type: "string",
  pattern: "^[A-Za-z][A-Za-z0-9_-]*$",
};
const dataBindingSchema = objectSchema({
  path: {
    type: "string",
    pattern: "^/(?:[^~/]|~0|~1)*(?:/(?:[^~/]|~0|~1)*)*$",
  },
});
const dynamicStringSchema = {
  oneOf: [{ type: "string", maxLength: 2400 }, dataBindingSchema],
};
const dynamicStringSchemaOfMax = (maxLength: number) => ({
  oneOf: [{ type: "string", maxLength }, dataBindingSchema],
});
const dynamicStringSchemaWithBounds = (
  minLength: number,
  maxLength: number,
) => ({
  oneOf: [{ type: "string", minLength, maxLength }, dataBindingSchema],
});
const nullableDynamicStringSchemaOfMax = (maxLength: number) => ({
  oneOf: [{ type: ["string", "null"], maxLength }, dataBindingSchema],
});
const dynamicEnumSchema = (
  values: readonly (string | number | boolean)[],
) => ({
  oneOf: [enumSchema(values), dataBindingSchema],
});
const nullableDynamicEnumSchema = (
  values: readonly (string | number | boolean)[],
) => ({
  oneOf: [
    {
      type:
        typeof values[0] === "number"
          ? ["number", "null"]
          : typeof values[0] === "boolean"
            ? ["boolean", "null"]
            : ["string", "null"],
      enum: [...values, null],
    },
    dataBindingSchema,
  ],
});
const dynamicArraySchema = (arraySchema: JsonSchema) => ({
  oneOf: [arraySchema, dataBindingSchema],
});
const dynamicBooleanSchema = {
  oneOf: [{ type: "boolean" }, dataBindingSchema],
};
const dynamicNumberSchema = {
  oneOf: [
    { type: "number", minimum: -1_000_000_000, maximum: 1_000_000_000 },
    dataBindingSchema,
  ],
};
const dynamicStringListSchema = {
  oneOf: [
    { type: "array", maxItems: 24, items: { type: "string", maxLength: 160 } },
    dataBindingSchema,
  ],
};
const dynamicValueSchema = {
  oneOf: [
    { type: "string", maxLength: 2400 },
    { type: "number" },
    { type: "boolean" },
    { type: "array", maxItems: 40 },
    dataBindingSchema,
  ],
};
const actionSchema = objectSchema({
  event: objectSchema(
    {
      name: enumSchema(ALLOWED_A2UI_ACTIONS),
      context: {
        type: "object",
        additionalProperties: dynamicValueSchema,
      },
    },
    ["name"],
  ),
});
const optionSchema = objectSchema(
  {
    label: dynamicStringSchemaWithBounds(1, 100),
    value: { type: "string", minLength: 1, maxLength: 100 },
  },
  ["label", "value"],
);
const labelItemSchema = objectSchema(
  {
    label: dynamicStringSchemaWithBounds(1, 240),
    value: nullableDynamicStringSchemaOfMax(240),
    tone: enumSchema(GRAVITY_TONES),
    type: enumSchema(GRAVITY_LABEL_TYPES),
  },
  ["label", "value", "tone", "type"],
);
const cardActionSchema = objectSchema(
  {
    label: dynamicStringSchemaWithBounds(1, 120),
    icon: { type: ["string", "null"], enum: [...ALLOWED_GRAVITY_ICONS, null] },
    action: actionSchema,
    variant: enumSchema(GRAVITY_BUTTON_VARIANTS),
    disabled: { type: "boolean" },
    loading: { type: "boolean" },
    selected: { type: "boolean" },
  },
  ["label", "icon", "action", "variant"],
);
const cardGridItemSchema = objectSchema(
  {
    title: dynamicStringSchemaWithBounds(1, 240),
    subtitle: nullableDynamicStringSchemaOfMax(240),
    body: dynamicStringSchemaOfMax(800),
    imageLabel: nullableDynamicStringSchemaOfMax(80),
    value: nullableDynamicStringSchemaOfMax(120),
    meta: nullableDynamicStringSchemaOfMax(240),
    tone: enumSchema(GRAVITY_TONES),
    labels: dynamicArraySchema({
      type: "array",
      maxItems: 4,
      items: labelItemSchema,
    }),
    actions: dynamicArraySchema({
      type: "array",
      maxItems: 2,
      items: cardActionSchema,
    }),
  },
  [
    "title",
    "subtitle",
    "body",
    "imageLabel",
    "value",
    "meta",
    "tone",
    "labels",
    "actions",
  ],
);

const commonProps = {
  weight: { schema: { type: "number", minimum: 0, maximum: 12 } },
  accessibility: {
    schema: objectSchema({
      label: dynamicStringSchema,
    }),
  },
} satisfies Record<string, PropSpec>;

export const COMPOSE_COMPONENT_PROP_SPECS = {
  Column: props({
    justify: enumSchema(GRAVITY_LAYOUT_JUSTIFY),
    align: enumSchema(GRAVITY_LAYOUT_ALIGN),
    gap: enumSchema(GRAVITY_GAPS),
  }),
  Row: props({
    justify: enumSchema(GRAVITY_LAYOUT_JUSTIFY),
    align: enumSchema(GRAVITY_LAYOUT_ALIGN),
    gap: enumSchema(GRAVITY_GAPS),
  }),
  Card: props({
    theme: enumSchema(GRAVITY_TONES),
    view: enumSchema(GRAVITY_CARD_VIEWS),
    padding: enumSchema(GRAVITY_CARD_PADDING),
  }),
  Text: props(
    {
      text: dynamicStringSchema,
      variant: enumSchema(GRAVITY_TEXT_VARIANTS),
      color: enumSchema(GRAVITY_TEXT_COLORS),
    },
    ["text"],
  ),
  Button: props({
    text: dynamicStringSchema,
    icon: enumSchema(ALLOWED_GRAVITY_ICONS),
    variant: enumSchema(GRAVITY_BUTTON_VARIANTS),
    action: actionSchema,
    disabled: dynamicBooleanSchema,
    loading: dynamicBooleanSchema,
    selected: dynamicBooleanSchema,
  }),
  Icon: props(
    {
      name: enumSchema(ALLOWED_GRAVITY_ICONS),
      color: enumSchema(GRAVITY_TEXT_COLORS),
      size: enumSchema(GRAVITY_ICON_SIZES),
    },
    ["name"],
  ),
  TextField: props(
    {
      label: dynamicStringSchemaOfMax(120),
      placeholder: dynamicStringSchemaOfMax(160),
      value: dynamicStringSchema,
      textFieldType: enumSchema(GRAVITY_TEXT_FIELD_TYPES),
      disabled: dynamicBooleanSchema,
    },
    ["value"],
  ),
  CheckBox: props(
    {
      label: dynamicStringSchemaWithBounds(1, 180),
      value: dynamicBooleanSchema,
      disabled: dynamicBooleanSchema,
    },
    ["label", "value"],
  ),
  ChoicePicker: props(
    {
      label: dynamicStringSchemaOfMax(120),
      variant: enumSchema(GRAVITY_CHOICE_PICKER_VARIANTS),
      options: dynamicArraySchema({
        type: "array",
        minItems: 1,
        maxItems: 12,
        items: optionSchema,
      }),
      value: dynamicStringListSchema,
    },
    ["options", "value"],
  ),
  Divider: props({
    axis: enumSchema(GRAVITY_DIVIDER_AXES),
  }),
  NavigationBar: props({}),
  AlertBlock: props(
    {
      title: dynamicStringSchemaOfMax(240),
      message: dynamicStringSchemaOfMax(1600),
      tone: enumSchema(GRAVITY_STATUS_TONES),
    },
    ["title", "message", "tone"],
  ),
  MetricGrid: props(
    {
      items: dynamicArraySchema({
        type: "array",
        minItems: 1,
        maxItems: 8,
        items: objectSchema(
          {
            label: dynamicStringSchemaWithBounds(1, 240),
            value: dynamicStringSchemaWithBounds(1, 240),
            description: nullableDynamicStringSchemaOfMax(240),
            tone: dynamicEnumSchema(GRAVITY_TONES),
            icon: nullableDynamicEnumSchema(ALLOWED_GRAVITY_ICONS),
          },
          ["label", "value", "description", "tone", "icon"],
        ),
      }),
    },
    ["items"],
  ),
  DataTable: props(
    {
      title: dynamicStringSchemaOfMax(240),
      columns: dynamicArraySchema({
        type: "array",
        minItems: 1,
        maxItems: 6,
        items: objectSchema(
          {
            id: idSchema,
            label: dynamicStringSchemaWithBounds(1, 240),
            align: enumSchema(GRAVITY_TABLE_ALIGN),
          },
          ["id", "label", "align"],
        ),
      }),
      rows: dynamicArraySchema({
        type: "array",
        maxItems: 12,
        items: objectSchema({
          cells: {
            type: "array",
            maxItems: 6,
            items: dynamicStringSchemaOfMax(240),
          },
        }),
      }),
      emptyMessage: dynamicStringSchemaOfMax(240),
    },
    ["title", "columns", "rows", "emptyMessage"],
  ),
  ProgressList: props(
    {
      items: dynamicArraySchema({
        type: "array",
        minItems: 1,
        maxItems: 6,
        items: objectSchema(
          {
            label: dynamicStringSchemaWithBounds(1, 240),
            value: {
              oneOf: [
                { type: "number", minimum: 0, maximum: 100 },
                dataBindingSchema,
              ],
            },
            text: nullableDynamicStringSchemaOfMax(240),
            tone: enumSchema(GRAVITY_TONES),
          },
          ["label", "value", "text", "tone"],
        ),
      }),
    },
    ["items"],
  ),
  DefinitionListBlock: props(
    {
      title: dynamicStringSchemaOfMax(240),
      items: dynamicArraySchema({
        type: "array",
        minItems: 1,
        maxItems: 10,
        items: objectSchema(
          {
            label: dynamicStringSchemaWithBounds(1, 240),
            value: dynamicStringSchemaWithBounds(1, 240),
          },
          ["label", "value"],
        ),
      }),
    },
    ["title", "items"],
  ),
  LinkList: props(
    {
      items: dynamicArraySchema({
        type: "array",
        minItems: 1,
        maxItems: 8,
        items: objectSchema(
          {
            label: dynamicStringSchemaWithBounds(1, 240),
            href: { type: "string", minLength: 1, maxLength: 500 },
            description: nullableDynamicStringSchemaOfMax(240),
          },
          ["label", "href", "description"],
        ),
      }),
    },
    ["items"],
  ),
  UserList: props(
    {
      items: dynamicArraySchema({
        type: "array",
        minItems: 1,
        maxItems: 8,
        items: objectSchema(
          {
            name: dynamicStringSchemaWithBounds(1, 240),
            description: nullableDynamicStringSchemaOfMax(240),
            tone: enumSchema(GRAVITY_TONES),
          },
          ["name", "description", "tone"],
        ),
      }),
    },
    ["items"],
  ),
  SwitchField: props(
    {
      label: dynamicStringSchemaWithBounds(1, 180),
      value: dynamicBooleanSchema,
      disabled: dynamicBooleanSchema,
    },
    ["label", "value"],
  ),
  SelectField: props(
    {
      label: dynamicStringSchemaOfMax(120),
      placeholder: dynamicStringSchemaOfMax(160),
      options: dynamicArraySchema({
        type: "array",
        minItems: 1,
        maxItems: 12,
        items: optionSchema,
      }),
      value: dynamicStringListSchema,
      disabled: dynamicBooleanSchema,
    },
    ["label", "options", "value"],
  ),
  SliderField: props(
    {
      label: dynamicStringSchemaWithBounds(1, 180),
      value: dynamicNumberSchema,
      min: { type: "number", minimum: -1_000_000, maximum: 1_000_000 },
      max: { type: "number", minimum: -1_000_000, maximum: 1_000_000 },
      step: { type: "number", exclusiveMinimum: 0, maximum: 1_000_000 },
      disabled: dynamicBooleanSchema,
    },
    ["label", "value", "min", "max", "step"],
  ),
  LabelGroup: props(
    {
      items: dynamicArraySchema({
        type: "array",
        minItems: 1,
        maxItems: 12,
        items: labelItemSchema,
      }),
    },
    ["items"],
  ),
  HeroBlock: props(
    {
      eyebrow: nullableDynamicStringSchemaOfMax(240),
      title: dynamicStringSchemaOfMax(240),
      body: dynamicStringSchemaOfMax(1600),
      imageLabel: nullableDynamicStringSchemaOfMax(80),
      tone: enumSchema(GRAVITY_TONES),
      labels: dynamicArraySchema({
        type: "array",
        maxItems: 4,
        items: labelItemSchema,
      }),
      actions: dynamicArraySchema({
        type: "array",
        maxItems: 2,
        items: cardActionSchema,
      }),
    },
    ["eyebrow", "title", "body", "imageLabel", "tone", "labels", "actions"],
  ),
  FilterBar: props(
    {
      title: dynamicStringSchemaOfMax(240),
      searchPlaceholder: nullableDynamicStringSchemaOfMax(240),
      searchValue: nullableDynamicStringSchemaOfMax(240),
      filters: dynamicArraySchema({
        type: "array",
        maxItems: 10,
        items: objectSchema(
          {
            label: dynamicStringSchemaWithBounds(1, 240),
            value: { type: "string", minLength: 1, maxLength: 100 },
            active: { type: "boolean" },
          },
          ["label", "value", "active"],
        ),
      }),
      sortLabel: nullableDynamicStringSchemaOfMax(240),
      sortValue: nullableDynamicStringSchemaOfMax(100),
      sortOptions: dynamicArraySchema({
        type: "array",
        maxItems: 8,
        items: optionSchema,
      }),
    },
    [
      "title",
      "searchPlaceholder",
      "searchValue",
      "filters",
      "sortLabel",
      "sortValue",
      "sortOptions",
    ],
  ),
  FeaturePanelGrid: props(
    {
      items: dynamicArraySchema({
        type: "array",
        minItems: 1,
        maxItems: 8,
        items: objectSchema(
          {
            title: dynamicStringSchemaOfMax(240),
            body: dynamicStringSchemaOfMax(1600),
            icon: {
              type: ["string", "null"],
              enum: [...ALLOWED_GRAVITY_ICONS, null],
            },
            tone: enumSchema(GRAVITY_TONES),
            value: nullableDynamicStringSchemaOfMax(240),
            labels: dynamicArraySchema({
              type: "array",
              maxItems: 3,
              items: labelItemSchema,
            }),
          },
          ["title", "body", "icon", "tone", "value", "labels"],
        ),
      }),
    },
    ["items"],
  ),
  CardGrid: props(
    {
      title: dynamicStringSchemaOfMax(240),
      description: nullableDynamicStringSchemaOfMax(1600),
      variant: enumSchema(GRAVITY_CARD_GRID_VARIANTS),
      columns: enumSchema(GRAVITY_CARD_GRID_COLUMNS),
      items: dynamicArraySchema({
        type: "array",
        minItems: 1,
        maxItems: 12,
        items: cardGridItemSchema,
      }),
    },
    ["items"],
  ),
  TabsBlock: props(
    {
      title: dynamicStringSchemaOfMax(240),
      size: enumSchema(GRAVITY_TAB_SIZES),
      items: dynamicArraySchema({
        type: "array",
        minItems: 2,
        maxItems: 8,
        items: objectSchema(
          {
            label: dynamicStringSchemaWithBounds(1, 240),
            value: idSchema,
            body: dynamicStringSchemaWithBounds(1, 1600),
            counter: nullableDynamicStringSchemaOfMax(240),
            tone: enumSchema(GRAVITY_TONES),
            active: { type: "boolean" },
          },
          ["label", "value", "body", "counter", "tone", "active"],
        ),
      }),
    },
    ["title", "size", "items"],
  ),
  EmptyStateList: props(
    {
      items: dynamicArraySchema({
        type: "array",
        minItems: 1,
        maxItems: 2,
        items: objectSchema(
          {
            title: dynamicStringSchemaOfMax(240),
            description: dynamicStringSchemaOfMax(1600),
            icon: {
              type: ["string", "null"],
              enum: [...ALLOWED_GRAVITY_ICONS, null],
            },
            tone: enumSchema(GRAVITY_TONES),
            size: enumSchema(GRAVITY_EMPTY_STATE_SIZES),
          },
          ["title", "description", "icon", "tone", "size"],
        ),
      }),
    },
    ["items"],
  ),
  LoadingStateList: props(
    {
      items: dynamicArraySchema({
        type: "array",
        minItems: 1,
        maxItems: 4,
        items: objectSchema(
          {
            label: dynamicStringSchemaWithBounds(1, 240),
            description: nullableDynamicStringSchemaOfMax(240),
            size: enumSchema(GRAVITY_LOADING_SIZES),
          },
          ["label", "description", "size"],
        ),
      }),
    },
    ["items"],
  ),
  BreadcrumbTrail: props(
    {
      title: dynamicStringSchemaOfMax(240),
      showRoot: { type: "boolean" },
      items: dynamicArraySchema({
        type: "array",
        minItems: 2,
        maxItems: 8,
        items: objectSchema(
          {
            label: dynamicStringSchemaWithBounds(1, 240),
            href: { type: ["string", "null"], maxLength: 500 },
          },
          ["label", "href"],
        ),
      }),
    },
    ["title", "showRoot", "items"],
  ),
  StepperBlock: props(
    {
      title: dynamicStringSchemaOfMax(240),
      size: enumSchema(GRAVITY_STEPPER_SIZES),
      items: dynamicArraySchema({
        type: "array",
        minItems: 2,
        maxItems: 8,
        items: objectSchema(
          {
            label: dynamicStringSchemaWithBounds(1, 240),
            value: idSchema,
            view: enumSchema(GRAVITY_STEPPER_VIEWS),
            disabled: { type: "boolean" },
            active: { type: "boolean" },
          },
          ["label", "value", "view", "disabled", "active"],
        ),
      }),
    },
    ["title", "size", "items"],
  ),
  AccordionBlock: props(
    {
      title: dynamicStringSchemaOfMax(240),
      size: enumSchema(GRAVITY_ACCORDION_SIZES),
      view: enumSchema(GRAVITY_ACCORDION_VIEWS),
      arrowPosition: enumSchema(GRAVITY_ACCORDION_ARROW_POSITIONS),
      items: dynamicArraySchema({
        type: "array",
        minItems: 1,
        maxItems: 8,
        items: objectSchema(
          {
            title: dynamicStringSchemaWithBounds(1, 240),
            body: dynamicStringSchemaWithBounds(1, 1600),
            expanded: { type: "boolean" },
            disabled: { type: "boolean" },
          },
          ["title", "body", "expanded", "disabled"],
        ),
      }),
    },
    ["title", "size", "view", "arrowPosition", "items"],
  ),
  CopyList: props(
    {
      title: dynamicStringSchemaOfMax(240),
      items: dynamicArraySchema({
        type: "array",
        minItems: 1,
        maxItems: 8,
        items: objectSchema(
          {
            label: dynamicStringSchemaWithBounds(1, 240),
            value: dynamicStringSchemaWithBounds(1, 240),
            copyText: dynamicStringSchemaWithBounds(1, 1000),
          },
          ["label", "value", "copyText"],
        ),
      }),
    },
    ["title", "items"],
  ),
} satisfies Record<ComponentName, Record<string, PropSpec>>;

export const COMPOSE_COMPONENT_PROP_NAMES = Object.fromEntries(
  ALLOWED_A2UI_COMPONENTS.map((component) => [
    component,
    Object.keys(COMPOSE_COMPONENT_PROP_SPECS[component]),
  ]),
) as Record<ComponentName, string[]>;

export const composeNodeToolSchema = {
  oneOf: ALLOWED_A2UI_COMPONENTS.map((component) => ({
    type: "object",
    additionalProperties: false,
    properties: {
      id: {
        ...idSchema,
        description: 'Unique node id. Do not use "root".',
      },
      parentId: {
        oneOf: [idSchema, { type: "null" }],
        description: 'Parent node id, "root", or null for root-level children.',
      },
      order: {
        type: "integer",
        minimum: 0,
        description: "Sibling sort order. Lower values render first.",
      },
      component: {
        type: "string",
        enum: [component],
      },
      props: propsSchema(COMPOSE_COMPONENT_PROP_SPECS[component]),
    },
    required: ["id", "parentId", "order", "component", "props"],
  })),
} as const;

export function formatComposeComponentPropsForPrompt() {
  return [
    "Curated A2UI node.props guide. Use only these props inside node.props; hierarchy is defined by parentId links, never by child/children props.",
    "For layout headings, create child Text nodes. Column, Row, Card, and NavigationBar do not accept title or subtitle props.",
    ...ALLOWED_A2UI_COMPONENTS.map((component) => {
      const names = Object.keys(COMPOSE_COMPONENT_PROP_SPECS[component]).filter(
        (name) => !Object.hasOwn(commonProps, name),
      );

      return `${component}(${names.map(formatPropName(component)).join(", ") || "no component-specific props"})`;
    }),
  ].join("\n");
}

function formatPropName(component: ComponentName) {
  const specs = COMPOSE_COMPONENT_PROP_SPECS[component] as Record<
    string,
    PropSpec
  >;

  return (name: string) => (specs[name]?.required ? name : `${name}?`);
}

function props(
  componentProps: Record<string, JsonSchema>,
  required: string[] = [],
) {
  return {
    ...commonProps,
    ...Object.fromEntries(
      Object.entries(componentProps).map(([name, schema]) => [
        name,
        {
          schema,
          required: required.includes(name),
        } satisfies PropSpec,
      ]),
    ),
  };
}

function propsSchema(specs: Record<string, PropSpec>) {
  return objectSchema(
    Object.fromEntries(
      Object.entries(specs).map(([name, spec]) => [name, spec.schema]),
    ),
    Object.entries(specs)
      .filter(([, spec]) => spec.required)
      .map(([name]) => name),
  );
}

function enumSchema(values: readonly (string | number | boolean)[]) {
  return {
    type:
      typeof values[0] === "number"
        ? "number"
        : typeof values[0] === "boolean"
          ? "boolean"
          : "string",
    enum: [...values],
  };
}

function objectSchema(
  properties: Record<string, unknown>,
  required: string[] = [],
) {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    ...(required.length > 0 ? { required } : {}),
  };
}
