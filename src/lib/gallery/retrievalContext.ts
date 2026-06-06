import type { PublishedDesign } from "@/lib/feedback/designFeedback";

export type GalleryRetrievalSection = {
  title: string;
  body: string;
};

const INTERACTIVE_COMPONENTS = new Set([
  "Button",
  "CheckBox",
  "ChoicePicker",
  "RadioGroup",
  "Select",
  "SelectField",
  "Slider",
  "SliderField",
  "Switch",
  "SwitchField",
  "TextField",
]);

const DATA_COMPONENTS = new Set([
  "DataTable",
  "DefinitionListBlock",
  "MetricGrid",
  "ProgressList",
]);
const STATUS_COMPONENTS = new Set(["AlertBlock", "EmptyStateList", "LabelGroup"]);
const LAYOUT_COMPONENTS = new Set([
  "Card",
  "CardGrid",
  "Column",
  "FeaturePanelGrid",
  "HeroBlock",
  "Row",
]);

export function buildGalleryRetrievalContext(
  design: PublishedDesign,
): GalleryRetrievalSection[] {
  const components = summarizeComponents(design);
  const categories = summarizeCategories(components.map((item) => item.name));

  return [
    {
      title: "Use case",
      body: `${design.title} is a public Gravity AI UI interface draft. ${design.summary}`,
    },
    {
      title: "Visible workflow",
      body: `The page is useful for reviewing a product-interface workflow, inspecting the generated structure, and deciding how the screen could support a real operational task.`,
    },
    {
      title: "Generated component categories",
      body:
        categories.length > 0
          ? `${categories.join(", ")}. Component inventory: ${components
              .map((item) => `${item.name} x${item.count}`)
              .join(", ")}.`
          : "No generated component categories were detected in the composed payload.",
    },
    {
      title: "Reusable artifacts",
      body: "Agents and developers can reuse the public title, summary, canonical URL, thumbnail URL, composed payload, A2UI messages, and React export shown on this page.",
    },
    {
      title: "Limitations",
      body: "Original prompt history is not exposed. The gallery page shows a published interface snapshot and public retrieval context, not private conversation details or production data.",
    },
    {
      title: "Prompt-improvement suggestions",
      body: "To adapt this draft for production, ask for explicit user roles, data states, empty states, validation states, primary actions, secondary actions, and acceptance criteria for the workflow.",
    },
  ];
}

function summarizeComponents(design: PublishedDesign) {
  const counts = new Map<string, number>();

  for (const node of design.payload.nodes) {
    counts.set(node.component, (counts.get(node.component) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([leftName, leftCount], [rightName, rightCount]) =>
      rightCount === leftCount
        ? leftName.localeCompare(rightName)
        : rightCount - leftCount,
    )
    .map(([name, count]) => ({ name, count }));
}

function summarizeCategories(componentNames: string[]) {
  const categories: string[] = [];

  if (componentNames.some((name) => LAYOUT_COMPONENTS.has(name))) {
    categories.push("layout and grouping components");
  }

  if (componentNames.some((name) => DATA_COMPONENTS.has(name))) {
    categories.push("data display components");
  }

  if (componentNames.some((name) => INTERACTIVE_COMPONENTS.has(name))) {
    categories.push("interactive controls");
  }

  if (componentNames.some((name) => STATUS_COMPONENTS.has(name))) {
    categories.push("status and feedback components");
  }

  const uncategorized = componentNames.filter(
    (name) =>
      !LAYOUT_COMPONENTS.has(name) &&
      !DATA_COMPONENTS.has(name) &&
      !INTERACTIVE_COMPONENTS.has(name) &&
      !STATUS_COMPONENTS.has(name),
  );

  if (uncategorized.length > 0) {
    categories.push(`content components (${[...new Set(uncategorized)].join(", ")})`);
  }

  return categories;
}
