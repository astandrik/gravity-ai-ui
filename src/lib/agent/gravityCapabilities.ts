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

export const GRAVITY_ICON_SIZES = ["s", "m", "l"] as const;

export const GRAVITY_CARD_VIEWS = ["outlined", "filled", "raised"] as const;

export const GRAVITY_CARD_PADDING = [
  "compact",
  "normal",
  "comfortable",
  "spacious",
] as const;

export const GRAVITY_BUTTON_VARIANTS = [
  "primary",
  "normal",
  "outlined",
  "outlined-info",
  "outlined-success",
  "outlined-warning",
  "outlined-danger",
  "outlined-utility",
  "outlined-action",
  "raised",
  "flat",
  "flat-secondary",
  "flat-info",
  "flat-success",
  "flat-warning",
  "flat-danger",
  "flat-utility",
  "flat-action",
  "normal-contrast",
  "outlined-contrast",
  "flat-contrast",
] as const;

export const GRAVITY_BUTTON_STATES = [
  "default",
  "disabled",
  "loading",
  "selected",
] as const;

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

export const GRAVITY_SECTION_DIVIDERS = [
  "none",
  "minimal",
  "betweenSections",
] as const;

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
  Button: {
    variants: GRAVITY_BUTTON_VARIANTS,
    states: GRAVITY_BUTTON_STATES,
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
} as const;

export type GravityButtonVariant = (typeof GRAVITY_BUTTON_VARIANTS)[number];

export function formatGravityCapabilitiesForPrompt() {
  return [
    `Button variants: ${GRAVITY_BUTTON_VARIANTS.join(", ")}.`,
    `Button states: ${GRAVITY_BUTTON_STATES.join(", ")}.`,
    `Card themes: ${GRAVITY_TONES.join(", ")}; views: ${GRAVITY_CARD_VIEWS.join(", ")}.`,
    `Text variants: ${GRAVITY_TEXT_VARIANTS.join(", ")}; colors: ${GRAVITY_TEXT_COLORS.join(", ")}.`,
    `Field types: ${GRAVITY_FIELD_TYPES.join(", ")}.`,
  ].join(" ");
}
