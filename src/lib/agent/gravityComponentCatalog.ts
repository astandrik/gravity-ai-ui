import {
  GRAVITY_UI_COMPONENT_CATALOG,
  GRAVITY_UI_COMPONENT_CATALOG_VERSION,
} from "./generatedGravityComponentCatalog";

const MAX_ENUM_VALUES_IN_PROMPT = 40;
const MAX_USAGE_GUIDE_ITEMS_IN_PROMPT = 3;

export function formatGravityComponentCatalogForPrompt() {
  return [
    `Generated Gravity UI component catalog from @gravity-ui/uikit ${GRAVITY_UI_COMPONENT_CATALOG_VERSION}.`,
    "Use the component choice guide first to decide what component fits the user's intent, then use technical props/settings for exact configuration. The compose tool accepts curated A2UI components only, not raw JSX.",
    "Component choice guide:",
    ...GRAVITY_UI_COMPONENT_CATALOG.map(formatComponentChoiceGuide).filter(
      isPromptLine,
    ),
    "Technical props/settings. Format: Component(prop?: kind, enumProp?: [values]); very large enum unions are compacted as ...+N.",
    ...GRAVITY_UI_COMPONENT_CATALOG.map(formatComponent),
  ].join("\n");
}

function formatComponentChoiceGuide(
  component: (typeof GRAVITY_UI_COMPONENT_CATALOG)[number],
) {
  const purpose = "purpose" in component ? component.purpose : "";
  const usage =
    "usage" in component && component.usage
      ? component.usage.slice(0, MAX_USAGE_GUIDE_ITEMS_IN_PROMPT).join(" ")
      : "";
  const guidance = [purpose, usage].filter(Boolean).join(" ");

  return guidance ? `${component.name}: ${guidance}` : null;
}

function isPromptLine(value: string | null): value is string {
  return value !== null;
}

function formatComponent(
  component: (typeof GRAVITY_UI_COMPONENT_CATALOG)[number],
) {
  return `${component.name}(${component.props.map(formatProp).join(", ")})`;
}

function formatProp(
  prop: (typeof GRAVITY_UI_COMPONENT_CATALOG)[number]["props"][number],
) {
  const required = prop.required ? "" : "?";

  if ("values" in prop && prop.values && prop.values.length > 0) {
    return `${prop.name}${required}: [${formatEnumValues(prop.values)}]`;
  }

  return `${prop.name}${required}: ${prop.kind}`;
}

function formatEnumValues(values: readonly (string | number | boolean)[]) {
  if (values.length <= MAX_ENUM_VALUES_IN_PROMPT) {
    return values.join("|");
  }

  return `${values.slice(0, MAX_ENUM_VALUES_IN_PROMPT).join("|")}|...+${values.length - MAX_ENUM_VALUES_IN_PROMPT}`;
}
