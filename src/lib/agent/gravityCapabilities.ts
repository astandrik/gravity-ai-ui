import {
  GRAVITY_UI_BUTTON_VIEWS,
  GRAVITY_UI_CARD_CONTAINER_VIEWS,
  type GravityUiButtonView,
  type GravityUiTextColor,
  type GravityUiTextVariant,
} from "./generatedGravityCapabilities";

export const ALLOWED_GRAVITY_ICONS = [
  "arrowRight",
  "bell",
  "check",
  "clock",
  "cloud",
  "code",
  "copy",
  "database",
  "folder",
  "gear",
  "home",
  "info",
  "list",
  "person",
  "plus",
  "refresh",
  "rocket",
  "search",
  "shield",
  "warning",
] as const;

export type GravityIconName = (typeof ALLOWED_GRAVITY_ICONS)[number];

export const GRAVITY_TONES = [
  "normal",
  "info",
  "success",
  "warning",
  "danger",
] as const;

export const GRAVITY_STATUS_TONES = [
  "info",
  "success",
  "warning",
  "danger",
] as const;

export const GRAVITY_TEXT_VARIANTS = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "body",
  "caption",
] as const;

export const GRAVITY_TEXT_COLORS = [
  "primary",
  "secondary",
  "positive",
  "warning",
  "danger",
] as const;

export type GravityTextVariant = (typeof GRAVITY_TEXT_VARIANTS)[number];
export type GravityTextColor = (typeof GRAVITY_TEXT_COLORS)[number];

export const GRAVITY_TEXT_VARIANT_BY_ALIAS = {
  h1: "display-1",
  h2: "subheader-3",
  h3: "subheader-2",
  h4: "subheader-2",
  h5: "subheader-2",
  body: "body-2",
  caption: "caption-2",
} as const satisfies Record<GravityTextVariant, GravityUiTextVariant>;

export const GRAVITY_TEXT_COLOR_BY_ALIAS = {
  primary: "primary",
  secondary: "secondary",
  positive: "positive",
  warning: "warning",
  danger: "danger",
} as const satisfies Record<GravityTextColor, GravityUiTextColor>;

export const GRAVITY_ICON_SIZES = ["s", "m", "l"] as const;

export const GRAVITY_CARD_VIEWS = GRAVITY_UI_CARD_CONTAINER_VIEWS;

export const GRAVITY_CARD_PADDING = [
  "compact",
  "normal",
  "comfortable",
  "spacious",
] as const;

export const GRAVITY_BUTTON_VARIANTS = [
  "primary",
  ...GRAVITY_UI_BUTTON_VIEWS.filter((view) => view !== "action"),
] as const;

export const GRAVITY_BUTTON_STATES = [
  "default",
  "disabled",
  "loading",
  "selected",
] as const;

export const GRAVITY_LABEL_TYPES = ["default", "info", "copy"] as const;

export const GRAVITY_TAB_SIZES = ["m", "l", "xl"] as const;

export const GRAVITY_EMPTY_STATE_SIZES = ["s", "m", "l", "promo"] as const;

export const GRAVITY_LOADING_SIZES = ["xs", "s", "m", "l", "xl"] as const;

export const GRAVITY_STEPPER_SIZES = ["s", "m", "l"] as const;

export const GRAVITY_STEPPER_VIEWS = ["idle", "success", "error"] as const;

export const GRAVITY_ACCORDION_SIZES = ["m", "l", "xl"] as const;

export const GRAVITY_ACCORDION_VIEWS = ["solid", "top-bottom"] as const;

export const GRAVITY_ACCORDION_ARROW_POSITIONS = ["start", "end"] as const;

export const GRAVITY_LAYOUT_JUSTIFY = [
  "start",
  "center",
  "end",
  "spaceBetween",
] as const;

export const GRAVITY_LAYOUT_ALIGN = [
  "start",
  "center",
  "end",
  "stretch",
] as const;

export const GRAVITY_GAPS = ["compact", "normal", "spacious"] as const;

export const GRAVITY_DENSITIES = [
  "compact",
  "comfortable",
  "spacious",
] as const;

export const GRAVITY_LAYOUT_INTENTS = [
  "generic",
  "catalog",
  "dashboard",
  "form",
  "detail",
  "workflow",
  "profile",
] as const;

export const GRAVITY_SECTION_DIVIDERS = [
  "none",
  "minimal",
  "betweenSections",
] as const;

export const GRAVITY_CARD_GRID_VARIANTS = [
  "product",
  "seller",
  "feature",
  "compact",
] as const;

export const GRAVITY_CARD_GRID_COLUMNS = ["auto", "two", "three"] as const;

export const GRAVITY_TABLE_ALIGN = ["start", "center", "end"] as const;

export const GRAVITY_TEXT_FIELD_TYPES = [
  "shortText",
  "number",
  "email",
  "tel",
  "url",
] as const;

export const GRAVITY_FIELD_TYPES = [
  ...GRAVITY_TEXT_FIELD_TYPES,
  "checkbox",
  "switch",
  "singleChoice",
  "multipleChoice",
  "select",
  "slider",
] as const;

export const GRAVITY_CHOICE_PICKER_VARIANTS = [
  "mutuallyExclusive",
  "multiple",
] as const;

export const GRAVITY_DIVIDER_AXES = ["horizontal", "vertical"] as const;

export const GRAVITY_COMPONENT_CAPABILITIES = {
  Layout: {
    intents: GRAVITY_LAYOUT_INTENTS,
    densities: GRAVITY_DENSITIES,
    sectionDividers: GRAVITY_SECTION_DIVIDERS,
  },
  Button: {
    variants: GRAVITY_BUTTON_VARIANTS,
    states: GRAVITY_BUTTON_STATES,
  },
  CardGrid: {
    variants: GRAVITY_CARD_GRID_VARIANTS,
    columns: GRAVITY_CARD_GRID_COLUMNS,
  },
  Card: {
    themes: GRAVITY_TONES,
    views: GRAVITY_CARD_VIEWS,
    padding: GRAVITY_CARD_PADDING,
  },
  Text: {
    variants: GRAVITY_TEXT_VARIANTS,
    colors: GRAVITY_TEXT_COLORS,
  },
  Icon: {
    names: ALLOWED_GRAVITY_ICONS,
    colors: GRAVITY_TEXT_COLORS,
    sizes: GRAVITY_ICON_SIZES,
  },
  Fields: {
    types: GRAVITY_FIELD_TYPES,
    states: ["required", "disabled"] as const,
  },
  Label: {
    types: GRAVITY_LABEL_TYPES,
    themes: GRAVITY_TONES,
  },
  Tabs: {
    sizes: GRAVITY_TAB_SIZES,
  },
  PlaceholderContainer: {
    sizes: GRAVITY_EMPTY_STATE_SIZES,
  },
  Spin: {
    sizes: GRAVITY_LOADING_SIZES,
  },
  Breadcrumbs: {
    purpose: "hierarchical navigation paths",
  },
  Stepper: {
    sizes: GRAVITY_STEPPER_SIZES,
    views: GRAVITY_STEPPER_VIEWS,
  },
  Accordion: {
    sizes: GRAVITY_ACCORDION_SIZES,
    views: GRAVITY_ACCORDION_VIEWS,
    arrowPositions: GRAVITY_ACCORDION_ARROW_POSITIONS,
  },
  CopyToClipboard: {
    purpose: "copyable commands, IDs, tokens, and links",
  },
} as const;

export type GravityButtonVariant = (typeof GRAVITY_BUTTON_VARIANTS)[number];

const gravityUiButtonViewSet = new Set<string>(GRAVITY_UI_BUTTON_VIEWS);
const gravityTextVariantSet = new Set<string>(GRAVITY_TEXT_VARIANTS);
const gravityTextColorSet = new Set<string>(GRAVITY_TEXT_COLORS);

export function isGravityUiButtonView(
  value: unknown,
): value is GravityUiButtonView {
  return typeof value === "string" && gravityUiButtonViewSet.has(value);
}

export function mapGravityButtonVariantToView(
  value?: string,
): GravityUiButtonView {
  if (value === "primary") {
    return "action";
  }

  return isGravityUiButtonView(value) ? value : "normal";
}

export function mapGravityTextVariant(value?: string): GravityUiTextVariant {
  return isGravityTextVariant(value)
    ? GRAVITY_TEXT_VARIANT_BY_ALIAS[value]
    : GRAVITY_TEXT_VARIANT_BY_ALIAS.body;
}

export function mapGravityTextColor(value?: string): GravityUiTextColor {
  return isGravityTextColor(value)
    ? GRAVITY_TEXT_COLOR_BY_ALIAS[value]
    : GRAVITY_TEXT_COLOR_BY_ALIAS.primary;
}

function isGravityTextVariant(value: unknown): value is GravityTextVariant {
  return typeof value === "string" && gravityTextVariantSet.has(value);
}

function isGravityTextColor(value: unknown): value is GravityTextColor {
  return typeof value === "string" && gravityTextColorSet.has(value);
}

export function formatGravityCapabilitiesForPrompt() {
  return [
    `Layout primitives: Column and Row with gaps ${GRAVITY_GAPS.join(", ")}.`,
    `CardGrid variants: ${GRAVITY_CARD_GRID_VARIANTS.join(", ")}; columns: ${GRAVITY_CARD_GRID_COLUMNS.join(", ")}.`,
    `Button variants: ${GRAVITY_BUTTON_VARIANTS.join(", ")}.`,
    `Button states: ${GRAVITY_BUTTON_STATES.join(", ")}.`,
    `Card themes: ${GRAVITY_TONES.join(", ")}; views: ${GRAVITY_CARD_VIEWS.join(", ")}.`,
    `Text variants: ${GRAVITY_TEXT_VARIANTS.join(", ")}; colors: ${GRAVITY_TEXT_COLORS.join(", ")}.`,
    `Field types: ${GRAVITY_FIELD_TYPES.join(", ")}.`,
    `Labels: types ${GRAVITY_LABEL_TYPES.join(", ")}; themes ${GRAVITY_TONES.join(", ")}.`,
    `Tabs sizes: ${GRAVITY_TAB_SIZES.join(", ")}.`,
    `Empty states sizes: ${GRAVITY_EMPTY_STATE_SIZES.join(", ")}; loading sizes: ${GRAVITY_LOADING_SIZES.join(", ")}.`,
    `Breadcrumbs for hierarchy paths; Stepper sizes ${GRAVITY_STEPPER_SIZES.join(", ")} with views ${GRAVITY_STEPPER_VIEWS.join(", ")}.`,
    `Accordion sizes ${GRAVITY_ACCORDION_SIZES.join(", ")} with views ${GRAVITY_ACCORDION_VIEWS.join(", ")}; copy blocks for copyable values.`,
  ].join(" ");
}
