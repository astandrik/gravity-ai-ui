import { A2uiMessageSchema } from "@a2ui/web_core/v0_9";
import { z } from "zod";
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
  GRAVITY_LAYOUT_ALIGN,
  GRAVITY_LAYOUT_JUSTIFY,
  GRAVITY_LABEL_TYPES,
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

export const A2UI_VERSION = "v0.9";
export const GRAVITY_A2UI_CATALOG_ID =
  "https://gravity-ai-ui.local/a2ui/gravity-v1";

export const ALLOWED_A2UI_COMPONENTS = [
  "Column",
  "Row",
  "Card",
  "Text",
  "Button",
  "Icon",
  "TextField",
  "CheckBox",
  "ChoicePicker",
  "Divider",
  "NavigationBar",
  "AlertBlock",
  "MetricGrid",
  "DataTable",
  "ProgressList",
  "DefinitionListBlock",
  "LinkList",
  "UserList",
  "SwitchField",
  "SelectField",
  "SliderField",
  "LabelGroup",
  "HeroBlock",
  "FilterBar",
  "FeaturePanelGrid",
  "CardGrid",
  "TabsBlock",
  "EmptyStateList",
  "LoadingStateList",
  "BreadcrumbTrail",
  "StepperBlock",
  "AccordionBlock",
  "CopyList",
] as const;

export const ALLOWED_A2UI_ACTIONS = [
  "submit",
  "select",
  "confirm",
  "cancel",
  "next",
  "back",
  "refresh",
  "open_details",
  "noop",
] as const;

const MAX_COMPONENT_CHILDREN = 96;
const MAX_COMPONENTS = 160;

export const componentIdSchema = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[A-Za-z][A-Za-z0-9_-]*$/);

const jsonPointerSchema = z
  .string()
  .min(1)
  .max(256)
  .regex(/^\/(?:[^~/]|~0|~1)*(?:\/(?:[^~/]|~0|~1)*)*$/);

const dataBindingSchema = z.object({ path: jsonPointerSchema }).strict();
const iconNameSchema = z.enum(ALLOWED_GRAVITY_ICONS);

const dynamicStringSchema = z.union([
  z.string().max(2400),
  dataBindingSchema,
]);
const dynamicBooleanSchema = z.union([z.boolean(), dataBindingSchema]);
const dynamicNumberSchema = z.union([
  z.number().min(-1_000_000_000).max(1_000_000_000),
  dataBindingSchema,
]);
const dynamicStringListSchema = z.union([
  z.array(z.string().max(160)).max(24),
  dataBindingSchema,
]);
const dynamicValueSchema = z.union([
  z.string().max(2400),
  z.number(),
  z.boolean(),
  z.array(z.unknown()).max(40),
  dataBindingSchema,
]);

const childListSchema = z.union([
  z.array(componentIdSchema).max(MAX_COMPONENT_CHILDREN),
  z.object({ componentId: componentIdSchema, path: jsonPointerSchema }).strict(),
]);

const actionSchema = z
  .object({
    event: z
      .object({
        name: z.enum(ALLOWED_A2UI_ACTIONS),
        context: z.record(dynamicValueSchema).optional(),
      })
      .strict(),
  })
  .strict();

const accessibilitySchema = z
  .object({
    label: dynamicStringSchema.optional(),
  })
  .strict();

const baseComponentSchema = {
  id: componentIdSchema,
  weight: z.number().min(0).max(12).optional(),
  accessibility: accessibilitySchema.optional(),
};

const textComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("Text"),
    text: dynamicStringSchema,
    variant: z.enum(GRAVITY_TEXT_VARIANTS).optional(),
    color: z.enum(GRAVITY_TEXT_COLORS).optional(),
  })
  .strict();

const rowComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("Row"),
    children: childListSchema,
    justify: z.enum(GRAVITY_LAYOUT_JUSTIFY).optional(),
    align: z.enum(GRAVITY_LAYOUT_ALIGN).optional(),
    gap: z.enum(GRAVITY_GAPS).optional(),
  })
  .strict();

const columnComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("Column"),
    children: childListSchema,
    justify: z.enum(GRAVITY_LAYOUT_JUSTIFY).optional(),
    align: z.enum(GRAVITY_LAYOUT_ALIGN).optional(),
    gap: z.enum(GRAVITY_GAPS).optional(),
  })
  .strict();

const cardComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("Card"),
    child: componentIdSchema,
    theme: z.enum(GRAVITY_TONES).optional(),
    view: z.enum(GRAVITY_CARD_VIEWS).optional(),
    padding: z.enum(GRAVITY_CARD_PADDING).optional(),
  })
  .strict();

const buttonComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("Button"),
    child: componentIdSchema.optional(),
    text: dynamicStringSchema.optional(),
    icon: iconNameSchema.optional(),
    variant: z.enum(GRAVITY_BUTTON_VARIANTS).optional(),
    action: actionSchema.optional(),
    disabled: dynamicBooleanSchema.optional(),
    loading: dynamicBooleanSchema.optional(),
    selected: dynamicBooleanSchema.optional(),
  })
  .strict();

const iconComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("Icon"),
    name: iconNameSchema,
    color: z.enum(GRAVITY_TEXT_COLORS).optional(),
    size: z.enum(GRAVITY_ICON_SIZES).optional(),
  })
  .strict();

const textFieldComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("TextField"),
    label: z.string().max(120).optional(),
    placeholder: z.string().max(160).optional(),
    value: dynamicStringSchema,
    textFieldType: z.enum(GRAVITY_TEXT_FIELD_TYPES).optional(),
    disabled: dynamicBooleanSchema.optional(),
  })
  .strict();

const checkboxComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("CheckBox"),
    label: z.string().min(1).max(180),
    value: dynamicBooleanSchema,
    disabled: dynamicBooleanSchema.optional(),
  })
  .strict();

const choicePickerComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("ChoicePicker"),
    label: z.string().max(120).optional(),
    variant: z.enum(GRAVITY_CHOICE_PICKER_VARIANTS).optional(),
    options: z
      .array(
        z
          .object({
            label: z.string().min(1).max(100),
            value: z.string().min(1).max(100),
          })
          .strict(),
      )
      .min(1)
      .max(12),
    value: dynamicStringListSchema,
  })
  .strict();

const dividerComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("Divider"),
    axis: z.enum(GRAVITY_DIVIDER_AXES).optional(),
  })
  .strict();

const navigationBarComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("NavigationBar"),
    children: childListSchema,
  })
  .strict();

const alertBlockComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("AlertBlock"),
    title: z.string().max(240),
    message: z.string().max(1600),
    tone: z.enum(GRAVITY_STATUS_TONES),
  })
  .strict();

const metricItemSchema = z
  .object({
    label: z.string().min(1).max(240),
    value: z.string().min(1).max(240),
    description: z.string().max(240).nullable(),
    tone: z.enum(GRAVITY_TONES),
    icon: iconNameSchema.nullable(),
  })
  .strict();

const metricGridComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("MetricGrid"),
    items: z.array(metricItemSchema).min(1).max(8),
  })
  .strict();

const tableColumnSchema = z
  .object({
    id: componentIdSchema,
    label: z.string().min(1).max(240),
    align: z.enum(GRAVITY_TABLE_ALIGN),
  })
  .strict();

const dataTableComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("DataTable"),
    title: z.string().max(240),
    columns: z.array(tableColumnSchema).min(1).max(6),
    rows: z
      .array(
        z
          .object({
            cells: z.array(z.string().max(240)).max(6),
          })
          .strict(),
      )
      .max(12),
    emptyMessage: z.string().max(240),
  })
  .strict();

const progressItemSchema = z
  .object({
    label: z.string().min(1).max(240),
    value: z.number().min(0).max(100),
    text: z.string().max(240).nullable(),
    tone: z.enum(GRAVITY_TONES),
  })
  .strict();

const progressListComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("ProgressList"),
    items: z.array(progressItemSchema).min(1).max(6),
  })
  .strict();

const definitionItemSchema = z
  .object({
    label: z.string().min(1).max(240),
    value: z.string().min(1).max(240),
  })
  .strict();

const definitionListBlockComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("DefinitionListBlock"),
    title: z.string().max(240),
    items: z.array(definitionItemSchema).min(1).max(10),
  })
  .strict();

const linkItemSchema = z
  .object({
    label: z.string().min(1).max(240),
    href: z
      .string()
      .min(1)
      .max(500)
      .regex(/^(https?:\/\/|mailto:|tel:|\/|#)/),
    description: z.string().max(240).nullable(),
  })
  .strict();

const linkListComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("LinkList"),
    items: z.array(linkItemSchema).min(1).max(8),
  })
  .strict();

const userItemSchema = z
  .object({
    name: z.string().min(1).max(240),
    description: z.string().max(240).nullable(),
    tone: z.enum(GRAVITY_TONES),
  })
  .strict();

const userListComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("UserList"),
    items: z.array(userItemSchema).min(1).max(8),
  })
  .strict();

const switchFieldComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("SwitchField"),
    label: z.string().min(1).max(180),
    value: dynamicBooleanSchema,
    disabled: dynamicBooleanSchema.optional(),
  })
  .strict();

const selectFieldComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("SelectField"),
    label: z.string().max(120),
    placeholder: z.string().max(160).optional(),
    options: z
      .array(
        z
          .object({
            label: z.string().min(1).max(100),
            value: z.string().min(1).max(100),
          })
          .strict(),
      )
      .min(1)
      .max(12),
    value: dynamicStringListSchema,
    disabled: dynamicBooleanSchema.optional(),
  })
  .strict();

const sliderFieldComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("SliderField"),
    label: z.string().min(1).max(180),
    value: dynamicNumberSchema,
    min: z.number().min(-1_000_000).max(1_000_000),
    max: z.number().min(-1_000_000).max(1_000_000),
    step: z.number().positive().max(1_000_000),
    disabled: dynamicBooleanSchema.optional(),
  })
  .strict();

const labelItemSchema = z
  .object({
    label: z.string().min(1).max(240),
    value: z.string().max(240).nullable(),
    tone: z.enum(GRAVITY_TONES),
    type: z.enum(GRAVITY_LABEL_TYPES),
  })
  .strict();

const labelGroupComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("LabelGroup"),
    items: z.array(labelItemSchema).min(1).max(12),
  })
  .strict();

const cardGridActionSchema = z
  .object({
    label: z.string().min(1).max(120),
    icon: iconNameSchema.nullable(),
    action: actionSchema,
    variant: z.enum(GRAVITY_BUTTON_VARIANTS),
    disabled: z.boolean().optional(),
    loading: z.boolean().optional(),
    selected: z.boolean().optional(),
  })
  .strict();

const cardGridItemSchema = z
  .object({
    title: z.string().min(1).max(240),
    subtitle: z.string().max(240).nullable(),
    body: z.string().max(800),
    imageLabel: z.string().max(80).nullable(),
    value: z.string().max(120).nullable(),
    meta: z.string().max(240).nullable(),
    tone: z.enum(GRAVITY_TONES),
    labels: z.array(labelItemSchema).max(4),
    actions: z.array(cardGridActionSchema).max(2),
  })
  .strict();

const heroBlockComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("HeroBlock"),
    eyebrow: z.string().max(240).nullable(),
    title: z.string().max(240),
    body: z.string().max(1600),
    imageLabel: z.string().max(80).nullable(),
    tone: z.enum(GRAVITY_TONES),
    labels: z.array(labelItemSchema).max(4),
    actions: z.array(cardGridActionSchema).max(2),
  })
  .strict();

const filterOptionSchema = z
  .object({
    label: z.string().min(1).max(240),
    value: z.string().min(1).max(100),
    active: z.boolean(),
  })
  .strict();

const filterBarComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("FilterBar"),
    title: z.string().max(240),
    searchPlaceholder: z.string().max(240).nullable(),
    searchValue: z.string().max(240).nullable(),
    filters: z.array(filterOptionSchema).max(10),
    sortLabel: z.string().max(240).nullable(),
    sortValue: z.string().max(100).nullable(),
    sortOptions: z
      .array(
        z
          .object({
            label: z.string().min(1).max(100),
            value: z.string().min(1).max(100),
          })
          .strict(),
      )
      .max(8),
  })
  .strict();

const featurePanelItemSchema = z
  .object({
    title: z.string().max(240),
    body: z.string().max(1600),
    icon: iconNameSchema.nullable(),
    tone: z.enum(GRAVITY_TONES),
    value: z.string().max(240).nullable(),
    labels: z.array(labelItemSchema).max(3),
  })
  .strict();

const featurePanelGridComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("FeaturePanelGrid"),
    items: z.array(featurePanelItemSchema).min(1).max(8),
  })
  .strict();

const cardGridComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("CardGrid"),
    title: z.string().max(240).optional(),
    description: z.string().max(1600).nullable().optional(),
    variant: z.enum(GRAVITY_CARD_GRID_VARIANTS).optional(),
    columns: z.enum(GRAVITY_CARD_GRID_COLUMNS).optional(),
    items: z.array(cardGridItemSchema).min(1).max(12),
  })
  .strict();

const tabItemSchema = z
  .object({
    label: z.string().min(1).max(240),
    value: componentIdSchema,
    body: z.string().min(1).max(1600),
    counter: z.string().max(240).nullable(),
    tone: z.enum(GRAVITY_TONES),
    active: z.boolean(),
  })
  .strict();

const tabsBlockComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("TabsBlock"),
    title: z.string().max(240),
    size: z.enum(GRAVITY_TAB_SIZES),
    items: z.array(tabItemSchema).min(2).max(8),
  })
  .strict();

const emptyStateItemSchema = z
  .object({
    title: z.string().max(240),
    description: z.string().max(1600),
    icon: iconNameSchema.nullable(),
    tone: z.enum(GRAVITY_TONES),
    size: z.enum(GRAVITY_EMPTY_STATE_SIZES),
  })
  .strict();

const emptyStateListComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("EmptyStateList"),
    items: z.array(emptyStateItemSchema).min(1).max(2),
  })
  .strict();

const loadingStateItemSchema = z
  .object({
    label: z.string().min(1).max(240),
    description: z.string().max(240).nullable(),
    size: z.enum(GRAVITY_LOADING_SIZES),
  })
  .strict();

const loadingStateListComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("LoadingStateList"),
    items: z.array(loadingStateItemSchema).min(1).max(4),
  })
  .strict();

const breadcrumbItemSchema = z
  .object({
    label: z.string().min(1).max(240),
    href: z
      .string()
      .min(1)
      .max(500)
      .regex(/^(https?:\/\/|mailto:|tel:|\/|#)/)
      .nullable(),
  })
  .strict();

const breadcrumbTrailComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("BreadcrumbTrail"),
    title: z.string().max(240),
    showRoot: z.boolean(),
    items: z.array(breadcrumbItemSchema).min(2).max(8),
  })
  .strict();

const stepperItemSchema = z
  .object({
    label: z.string().min(1).max(240),
    value: componentIdSchema,
    view: z.enum(GRAVITY_STEPPER_VIEWS),
    disabled: z.boolean(),
    active: z.boolean(),
  })
  .strict();

const stepperBlockComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("StepperBlock"),
    title: z.string().max(240),
    size: z.enum(GRAVITY_STEPPER_SIZES),
    items: z.array(stepperItemSchema).min(2).max(8),
  })
  .strict();

const accordionItemSchema = z
  .object({
    title: z.string().min(1).max(240),
    body: z.string().min(1).max(1600),
    expanded: z.boolean(),
    disabled: z.boolean(),
  })
  .strict();

const accordionBlockComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("AccordionBlock"),
    title: z.string().max(240),
    size: z.enum(GRAVITY_ACCORDION_SIZES),
    view: z.enum(GRAVITY_ACCORDION_VIEWS),
    arrowPosition: z.enum(GRAVITY_ACCORDION_ARROW_POSITIONS),
    items: z.array(accordionItemSchema).min(1).max(8),
  })
  .strict();

const copyListItemSchema = z
  .object({
    label: z.string().min(1).max(240),
    value: z.string().min(1).max(240),
    copyText: z.string().min(1).max(1000),
  })
  .strict();

const copyListComponentSchema = z
  .object({
    ...baseComponentSchema,
    component: z.literal("CopyList"),
    title: z.string().max(240),
    items: z.array(copyListItemSchema).min(1).max(8),
  })
  .strict();

export const gravityComponentSchema = z.discriminatedUnion("component", [
  columnComponentSchema,
  rowComponentSchema,
  cardComponentSchema,
  textComponentSchema,
  buttonComponentSchema,
  iconComponentSchema,
  textFieldComponentSchema,
  checkboxComponentSchema,
  choicePickerComponentSchema,
  dividerComponentSchema,
  navigationBarComponentSchema,
  alertBlockComponentSchema,
  metricGridComponentSchema,
  dataTableComponentSchema,
  progressListComponentSchema,
  definitionListBlockComponentSchema,
  linkListComponentSchema,
  userListComponentSchema,
  switchFieldComponentSchema,
  selectFieldComponentSchema,
  sliderFieldComponentSchema,
  labelGroupComponentSchema,
  heroBlockComponentSchema,
  filterBarComponentSchema,
  featurePanelGridComponentSchema,
  cardGridComponentSchema,
  tabsBlockComponentSchema,
  emptyStateListComponentSchema,
  loadingStateListComponentSchema,
  breadcrumbTrailComponentSchema,
  stepperBlockComponentSchema,
  accordionBlockComponentSchema,
  copyListComponentSchema,
]);

const updateComponentsMessageSchema = z
  .object({
    version: z.literal(A2UI_VERSION),
    updateComponents: z
      .object({
        surfaceId: componentIdSchema,
        components: z.array(gravityComponentSchema).min(1).max(MAX_COMPONENTS),
      })
      .strict(),
  })
  .strict();

const createSurfaceMessageSchema = z
  .object({
    version: z.literal(A2UI_VERSION),
    createSurface: z
      .object({
        surfaceId: componentIdSchema,
        catalogId: z.literal(GRAVITY_A2UI_CATALOG_ID),
        sendDataModel: z.boolean().optional(),
        theme: z.unknown().optional(),
      })
      .strict(),
  })
  .strict();

const updateDataModelMessageSchema = z
  .object({
    version: z.literal(A2UI_VERSION),
    updateDataModel: z
      .object({
        surfaceId: componentIdSchema,
        path: jsonPointerSchema.optional(),
        value: z.unknown().optional(),
      })
      .strict(),
  })
  .strict();

const deleteSurfaceMessageSchema = z
  .object({
    version: z.literal(A2UI_VERSION),
    deleteSurface: z.object({ surfaceId: componentIdSchema }).strict(),
  })
  .strict();

export const gravityA2uiMessageSchema = z.union([
  createSurfaceMessageSchema,
  updateComponentsMessageSchema,
  updateDataModelMessageSchema,
  deleteSurfaceMessageSchema,
]);

export type GravityA2uiMessage = z.infer<typeof gravityA2uiMessageSchema>;
export type GravityA2uiComponent = z.infer<typeof gravityComponentSchema>;

export const emitA2uiToolArgumentsSchema = z
  .object({
    sequence: z.number().int().min(0).max(10_000),
    messageJson: z.string().min(2).max(80_000),
  })
  .strict();

export type EmitA2uiToolArguments = z.infer<
  typeof emitA2uiToolArgumentsSchema
>;

export function validateGravityA2uiMessage(input: unknown): GravityA2uiMessage {
  A2uiMessageSchema.parse(input);
  const message = gravityA2uiMessageSchema.parse(input);

  if ("updateComponents" in message) {
    validateComponentTree(message.updateComponents.components);
  }

  return message;
}

export function parseEmitA2uiToolArguments(input: string) {
  const toolArguments = emitA2uiToolArgumentsSchema.parse(JSON.parse(input));
  const message = validateGravityA2uiMessage(
    JSON.parse(toolArguments.messageJson),
  );

  return {
    sequence: toolArguments.sequence,
    message,
  };
}

function validateComponentTree(components: GravityA2uiComponent[]) {
  const ids = new Set<string>();

  for (const component of components) {
    if (ids.has(component.id)) {
      throw new Error(`Duplicate component id: ${component.id}`);
    }

    ids.add(component.id);
  }

  if (!ids.has("root")) {
    throw new Error("An updateComponents message must include a root component");
  }

  for (const component of components) {
    if (component.component === "Button" && !component.child && !component.text) {
      throw new Error(`Button ${component.id} requires either child or text`);
    }

    for (const childId of getChildIds(component)) {
      if (!ids.has(childId)) {
        throw new Error(
          `Component ${component.id} references unknown child ${childId}`,
        );
      }
    }
  }
}

function getChildIds(component: GravityA2uiComponent) {
  if (component.component === "Card") {
    return [component.child];
  }

  if (component.component === "Button" && component.child) {
    return [component.child];
  }

  if (
    component.component === "Column" ||
    component.component === "Row" ||
    component.component === "NavigationBar"
  ) {
    return Array.isArray(component.children)
      ? component.children
      : [component.children.componentId];
  }

  return [];
}
