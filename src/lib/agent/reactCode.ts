import type { GravityIconName } from "./gravityCapabilities";
import type { RenderInterfaceArguments } from "./fixedInterface";

type FieldWithKey = RenderInterfaceArguments["fields"][number] & {
  key: string;
};

const densitySpacing = {
  compact: { gap: 12, padding: 16 },
  comfortable: { gap: 16, padding: 20 },
  spacious: { gap: 24, padding: 24 },
} as const;

const iconImportByName: Record<
  GravityIconName,
  { exportName: string; localName: string }
> = {
  arrowRight: { exportName: "ArrowRight", localName: "ArrowRightIcon" },
  bell: { exportName: "Bell", localName: "BellIcon" },
  check: { exportName: "Check", localName: "CheckIcon" },
  clock: { exportName: "Clock", localName: "ClockIcon" },
  cloud: { exportName: "Cloud", localName: "CloudIcon" },
  code: { exportName: "Code", localName: "CodeIcon" },
  copy: { exportName: "Copy", localName: "CopyIcon" },
  database: { exportName: "Database", localName: "DatabaseIcon" },
  folder: { exportName: "Folder", localName: "FolderIcon" },
  gear: { exportName: "Gear", localName: "GearIcon" },
  home: { exportName: "House", localName: "HomeIcon" },
  info: { exportName: "CircleInfo", localName: "InfoIcon" },
  list: { exportName: "ListUl", localName: "ListIcon" },
  person: { exportName: "Person", localName: "PersonIcon" },
  plus: { exportName: "Plus", localName: "PlusIcon" },
  rocket: { exportName: "Rocket", localName: "RocketIcon" },
  search: { exportName: "Magnifier", localName: "SearchIcon" },
  shield: { exportName: "Shield", localName: "ShieldIcon" },
  warning: {
    exportName: "TriangleExclamation",
    localName: "WarningIcon",
  },
};

export function buildReactCode(payload: RenderInterfaceArguments) {
  const fields = withUniqueFieldKeys(payload.fields);
  const usedIcons = collectUsedIcons(payload);
  const needsClient =
    fields.length > 0 ||
    payload.actions.length > 0 ||
    payload.navigation.length > 0;
  const usedComponents = new Set(["Card", "Text"]);

  if (
    fields.some(
      (field) =>
        field.type !== "checkbox" &&
        field.type !== "singleChoice" &&
        field.type !== "multipleChoice",
    )
  ) {
    usedComponents.add("TextInput");
  }

  if (
    fields.some(
      (field) => field.type === "checkbox" || field.type === "multipleChoice",
    )
  ) {
    usedComponents.add("Checkbox");
  }

  if (fields.some((field) => field.type === "singleChoice")) {
    usedComponents.add("RadioGroup");
  }

  if (payload.actions.length > 0 || payload.navigation.length > 0) {
    usedComponents.add("Button");
  }

  if (usedIcons.length > 0) {
    usedComponents.add("Icon");
  }

  const imports = [
    needsClient ? '"use client";\n' : "",
    fields.length > 0 ? 'import { useState } from "react";\n' : "",
    payload.navigation.length > 0
      ? 'import { ActionBar } from "@gravity-ui/navigation";\n'
      : "",
    iconImportLine(usedIcons),
    `import {\n${[...usedComponents]
      .sort()
      .map((component) => `  ${component},`)
      .join("\n")}\n} from "@/components/GravityUI/GravityUI";`,
  ]
    .filter(Boolean)
    .join("\n");
  const componentName = createComponentName(payload.title);
  const spacing = densitySpacing[payload.layout.density];
  const bodyLines = [
    fieldStateLine(fields),
    actionHandlerLine(
      fields,
      payload.actions.length > 0 || payload.navigation.length > 0,
    ),
    "  return (",
    `    <Card theme=${jsxString(payload.tone)} view="outlined" size="l" type="container">`,
    `      <div style={{ display: "grid", gap: ${spacing.gap}, padding: ${spacing.padding} }}>`,
    titleLine(payload),
    payload.summary
      ? `        <Text as="p" variant="body-2" color="secondary">${jsxText(payload.summary)}</Text>`
      : null,
    ...navigationLines(payload.navigation),
    ...sectionLines(payload),
    ...fieldLines(fields),
    ...actionLines(payload.actions),
    "      </div>",
    "    </Card>",
    "  );",
  ].filter((line): line is string => Boolean(line));

  return `${imports}\n\nexport function ${componentName}() {\n${bodyLines.join("\n")}\n}\n`;
}

function fieldStateLine(fields: FieldWithKey[]) {
  if (fields.length === 0) {
    return null;
  }

  return `  const [form, setForm] = useState<Record<string, string | boolean | string[]>>(${jsonForCode(
    Object.fromEntries(fields.map((field) => [field.key, initialFieldValue(field)])),
    2,
  ).replace(/\n/g, "\n  ")});`;
}

function actionHandlerLine(fields: FieldWithKey[], hasActions: boolean) {
  if (!hasActions) {
    return null;
  }

  const payload = fields.length > 0 ? "form" : "{}";

  return [
    "",
    "  const handleAction = (action: string) => {",
    `    console.log("Action", action, ${payload});`,
    "  };",
  ].join("\n");
}

function titleLine(payload: RenderInterfaceArguments) {
  if (!payload.titleIcon) {
    return `        <Text as="h2" variant="subheader-3">${jsxText(payload.title)}</Text>`;
  }

  return [
    '        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>',
    `          ${iconElement(payload.titleIcon, 18)}`,
    `          <Text as="h2" variant="subheader-3">${jsxText(payload.title)}</Text>`,
    "        </div>",
  ].join("\n");
}

function navigationLines(
  navigation: RenderInterfaceArguments["navigation"],
) {
  if (navigation.length === 0) {
    return [];
  }

  return [
    '        <ActionBar aria-label="Generated navigation">',
    "          <ActionBar.Section>",
    "            <ActionBar.Group>",
    ...navigation.flatMap((item) => [
      "              <ActionBar.Item>",
      `                <Button view=${jsxString(item.active ? "action" : "flat")} onClick={() => handleAction(${jsString(item.action)})}>`,
      item.icon ? `                  ${iconElement(item.icon, 16)}` : null,
      `                  ${jsxText(item.label)}`,
      "                </Button>",
      "              </ActionBar.Item>",
    ]),
    "            </ActionBar.Group>",
    "          </ActionBar.Section>",
    "        </ActionBar>",
  ].filter((line): line is string => Boolean(line));
}

function sectionLines(payload: RenderInterfaceArguments) {
  return payload.sections.flatMap((section, index) => {
    const lines: string[] = [];

    if (shouldAddSectionDivider(payload.layout.sectionDividers, index)) {
      lines.push(
        '        <div style={{ height: 1, background: "var(--g-color-line-generic)" }} />',
      );
    }

    lines.push("        <section>");

    if (section.title) {
      if (section.icon) {
        lines.push(
          '          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>',
          `            ${iconElement(section.icon, 16)}`,
          `            <Text as="h3" variant="subheader-2">${jsxText(section.title)}</Text>`,
          "          </div>",
        );
      } else {
        lines.push(
          `          <Text as="h3" variant="subheader-2">${jsxText(section.title)}</Text>`,
        );
      }
    }

    if (section.body) {
      lines.push(
        `          <Text as="p" variant="body-2" color="secondary">${jsxText(section.body)}</Text>`,
      );
    }

    if (section.items.length > 0) {
      lines.push("          <ul>");
      section.items.forEach((item) => {
        lines.push(`            <li>${jsxText(item)}</li>`);
      });
      lines.push("          </ul>");
    }

    lines.push("        </section>");

    return lines;
  });
}

function fieldLines(fields: FieldWithKey[]) {
  return fields.flatMap((field) => {
    if (field.type === "checkbox") {
      return [
        "        <Checkbox",
        `          checked={Boolean(form.${field.key})}`,
        `          content=${jsxString(field.label)}`,
        `          onUpdate={(value) => setForm((current) => ({ ...current, ${field.key}: value }))}`,
        '          size="l"',
        "        />",
      ];
    }

    if (field.type === "singleChoice" && field.options.length > 0) {
      return [
        "        <RadioGroup",
        '          direction="vertical"',
        `          onUpdate={(value) => setForm((current) => ({ ...current, ${field.key}: [value] }))}`,
        `          options={${jsonForCode(
          field.options.map((option) => ({
            content: option.label,
            value: option.value,
          })),
          10,
        ).replace(/\n/g, "\n          ")}}`,
        '          size="m"',
        `          value={Array.isArray(form.${field.key}) ? form.${field.key}[0] ?? null : null}`,
        "        />",
      ];
    }

    if (field.type === "multipleChoice" && field.options.length > 0) {
      return [
        "        <div>",
        `          <Text variant="body-1" color="secondary">${jsxText(field.label)}</Text>`,
        ...field.options.flatMap((option) => [
          "          <Checkbox",
          `            checked={Array.isArray(form.${field.key}) && form.${field.key}.includes(${jsString(option.value)})}`,
          `            content=${jsxString(option.label)}`,
          "            onUpdate={() => setForm((current) => {",
          `              const values = Array.isArray(current.${field.key}) ? current.${field.key} : [];`,
          `              return { ...current, ${field.key}: values.includes(${jsString(option.value)}) ? values.filter((item) => item !== ${jsString(option.value)}) : [...values, ${jsString(option.value)}] };`,
          "            })}",
          '            size="m"',
          "          />",
        ]),
        "        </div>",
      ];
    }

    return [
      "        <TextInput",
      `          label=${jsxString(field.label)}`,
      field.placeholder
        ? `          placeholder=${jsxString(field.placeholder)}`
        : null,
      `          onUpdate={(value) => setForm((current) => ({ ...current, ${field.key}: value }))}`,
      '          size="l"',
      field.type !== "shortText" ? `          type=${jsxString(field.type)}` : null,
      `          value={String(form.${field.key} ?? "")}`,
      "        />",
    ].filter((line): line is string => Boolean(line));
  });
}

function actionLines(actions: RenderInterfaceArguments["actions"]) {
  if (actions.length === 0) {
    return [];
  }

  return [
    '        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>',
    ...actions.flatMap((action) => [
      `          <Button view=${jsxString(mapButtonView(action.variant))} onClick={() => handleAction(${jsString(action.action)})}>`,
      action.icon ? `            ${iconElement(action.icon, 16)}` : null,
      `            ${jsxText(action.label)}`,
      "          </Button>",
    ]),
    "        </div>",
  ].filter((line): line is string => Boolean(line));
}

function initialFieldValue(field: FieldWithKey) {
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

function withUniqueFieldKeys(fields: RenderInterfaceArguments["fields"]) {
  const used = new Set<string>();

  return fields.map((field, index) => {
    let key = toPropertyName(field.id);

    if (used.has(key)) {
      key = `${key}_${index}`;
    }

    used.add(key);

    return { ...field, key };
  });
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

function collectUsedIcons(payload: RenderInterfaceArguments) {
  return [
    payload.titleIcon,
    ...payload.navigation.map((item) => item.icon),
    ...payload.sections.map((section) => section.icon),
    ...payload.actions.map((action) => action.icon),
  ].filter((icon): icon is GravityIconName => Boolean(icon));
}

function iconElement(icon: GravityIconName, size: number) {
  return `<Icon data={${iconImportByName[icon].localName}} size={${size}} />`;
}

function iconImportLine(icons: GravityIconName[]) {
  if (icons.length === 0) {
    return "";
  }

  const uniqueIcons = [...new Set(icons)];

  return `import {\n${uniqueIcons
    .sort()
    .map((icon) => {
      const item = iconImportByName[icon];

      return `  ${item.exportName} as ${item.localName},`;
    })
    .join("\n")}\n} from "@gravity-ui/icons";\n`;
}

function mapButtonView(
  variant: RenderInterfaceArguments["actions"][number]["variant"],
) {
  return variant === "primary" ? "action" : variant;
}

function jsxText(value: string) {
  return jsxString(value);
}

function jsxString(value: string) {
  return `{${JSON.stringify(value)}}`;
}

function jsString(value: string) {
  return JSON.stringify(value);
}

function jsonForCode(value: unknown, spaces: number) {
  return JSON.stringify(value, null, spaces);
}

function createComponentName(title: string) {
  const words = title
    .replace(/[^A-Za-z0-9 ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const name = words.map(capitalize).join("");

  return /^[A-Z]/.test(name) ? name : "GeneratedInterface";
}

function toPropertyName(value: string) {
  return value.replace(/[^A-Za-z0-9_$]/g, "_");
}

function capitalize(value: string) {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
