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
    payload.tabs.length > 0 ||
    payload.steppers.length > 0 ||
    payload.copyLists.length > 0 ||
    payload.actions.length > 0 ||
    payload.navigation.length > 0;
  const usedComponents = new Set(["Card", "Text"]);

  if (payload.alerts.length > 0) {
    usedComponents.add("Alert");
  }

  if (payload.metrics.length > 0) {
    usedComponents.add("Label");
  }

  if (payload.tables.length > 0) {
    usedComponents.add("Table");
  }

  if (payload.progress.length > 0) {
    usedComponents.add("Progress");
  }

  if (payload.descriptions.length > 0) {
    usedComponents.add("DefinitionList");
  }

  if (payload.links.length > 0) {
    usedComponents.add("Link");
  }

  if (payload.users.length > 0) {
    usedComponents.add("Label");
    usedComponents.add("User");
  }

  if (payload.labels.length > 0) {
    usedComponents.add("Label");
  }

  if (payload.tabs.length > 0) {
    usedComponents.add("Label");
    usedComponents.add("Tab");
    usedComponents.add("TabList");
    usedComponents.add("TabPanel");
    usedComponents.add("TabProvider");
  }

  if (payload.emptyStates.length > 0) {
    usedComponents.add("PlaceholderContainer");
  }

  if (payload.loadingStates.length > 0) {
    usedComponents.add("Spin");
  }

  if (payload.breadcrumbs.length > 0) {
    usedComponents.add("Breadcrumbs");
  }

  if (payload.steppers.length > 0) {
    usedComponents.add("Stepper");
  }

  if (payload.accordions.length > 0) {
    usedComponents.add("Accordion");
  }

  if (payload.copyLists.length > 0) {
    usedComponents.add("Button");
    usedComponents.add("CopyToClipboard");
  }

  if (
    fields.some(
      (field) =>
        field.type !== "checkbox" &&
        field.type !== "switch" &&
        field.type !== "singleChoice" &&
        field.type !== "multipleChoice" &&
        field.type !== "select" &&
        field.type !== "slider",
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

  if (fields.some((field) => field.type === "switch")) {
    usedComponents.add("Switch");
  }

  if (fields.some((field) => field.type === "singleChoice")) {
    usedComponents.add("RadioGroup");
  }

  if (fields.some((field) => field.type === "select")) {
    usedComponents.add("Select");
  }

  if (fields.some((field) => field.type === "slider")) {
    usedComponents.add("Label");
    usedComponents.add("Slider");
  }

  if (payload.actions.length > 0 || payload.navigation.length > 0) {
    usedComponents.add("Button");
  }

  if (usedIcons.length > 0) {
    usedComponents.add("Icon");
  }

  const imports = [
    needsClient ? '"use client";\n' : "",
    fields.length > 0 || payload.tabs.length > 0 || payload.steppers.length > 0
      ? 'import { useState } from "react";\n'
      : "",
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
    ...tabStateLines(payload.tabs),
    ...stepperStateLines(payload.steppers),
    actionHandlerLine(
      fields,
      payload.actions.length > 0 || payload.navigation.length > 0,
    ),
    "  return (",
    '    <Card theme="normal" view="filled" size="l" type="container">',
    `      <div style={{ display: "grid", gap: ${spacing.gap}, padding: ${spacing.padding} }}>`,
    titleLine(payload),
    payload.summary
      ? `        <Text as="p" variant="body-2" color="secondary">${jsxText(payload.summary)}</Text>`
      : null,
    ...navigationLines(payload.navigation),
    ...breadcrumbLines(payload.breadcrumbs),
    ...alertLines(payload.alerts),
    ...metricLines(payload.metrics),
    ...labelLines(payload.labels),
    ...stepperLines(payload.steppers),
    ...sectionLines(payload),
    ...tabLines(payload.tabs),
    ...accordionLines(payload.accordions),
    ...descriptionLines(payload.descriptions),
    ...tableLines(payload.tables),
    ...progressLines(payload.progress),
    ...loadingStateLines(payload.loadingStates),
    ...emptyStateLines(payload.emptyStates),
    ...userLines(payload.users),
    ...linkLines(payload.links),
    ...copyListLines(payload.copyLists),
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

  return `  const [form, setForm] = useState<Record<string, string | boolean | string[] | number>>(${jsonForCode(
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

function tabStateLines(tabs: RenderInterfaceArguments["tabs"]) {
  return tabs.map(
    (tab, index) =>
      `  const [activeTab${index}, setActiveTab${index}] = useState(${jsString(
        tab.items.find((item) => item.active)?.value ?? tab.items[0]?.value ?? "",
      )});`,
  );
}

function stepperStateLines(steppers: RenderInterfaceArguments["steppers"]) {
  return steppers.map(
    (stepper, index) =>
      `  const [activeStep${index}, setActiveStep${index}] = useState(${jsString(
        stepper.items.find((item) => item.active)?.value ??
          stepper.items[0]?.value ??
          "",
      )});`,
  );
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

function breadcrumbLines(breadcrumbs: RenderInterfaceArguments["breadcrumbs"]) {
  return breadcrumbs.flatMap((trail) => [
    "        <section>",
    trail.title
      ? `          <Text as="h3" variant="subheader-2">${jsxText(trail.title)}</Text>`
      : null,
    `          <Breadcrumbs showRoot={${trail.showRoot}}>`,
    ...trail.items.flatMap((item) => [
      `            <Breadcrumbs.Item${item.href ? ` href=${jsxString(item.href)}` : ""}>`,
      `              ${jsxText(item.label)}`,
      "            </Breadcrumbs.Item>",
    ]),
    "          </Breadcrumbs>",
    "        </section>",
  ].filter((line): line is string => Boolean(line)));
}

function alertLines(alerts: RenderInterfaceArguments["alerts"]) {
  return alerts.map(
    (alert) =>
      `        <Alert theme=${jsxString(alert.tone)} view="filled" layout="horizontal" title=${jsxString(alert.title)} message=${jsxString(alert.message)} />`,
  );
}

function metricLines(metrics: RenderInterfaceArguments["metrics"]) {
  if (metrics.length === 0) {
    return [];
  }

  return [
    '        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>',
    ...metrics.flatMap((metric) => [
      '          <Card view="filled" size="m" type="container">',
      '            <div style={{ display: "grid", gap: 6, padding: 12 }}>',
      '              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>',
      `                <Text variant="caption-2" color="secondary">${jsxText(metric.label)}</Text>`,
      metric.icon ? `                ${iconElement(metric.icon, 14)}` : null,
      "              </div>",
      `              <Text variant="header-1">${jsxText(metric.value)}</Text>`,
      metric.description
        ? `              <Text variant="caption-2" color="secondary">${jsxText(metric.description)}</Text>`
        : null,
      `              <Label theme=${jsxString(mapLabelTheme(metric.tone))} size="xs">${jsxText(mapToneLabel(metric.tone))}</Label>`,
      "            </div>",
      "          </Card>",
    ]),
    "        </div>",
  ].filter((line): line is string => Boolean(line));
}

function labelLines(labels: RenderInterfaceArguments["labels"]) {
  if (labels.length === 0) {
    return [];
  }

  return [
    '        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>',
    ...labels.flatMap((item) => [
      `          <Label theme=${jsxString(mapLabelTheme(item.tone))} type=${jsxString(item.type)} size="s"${item.value ? ` value=${jsxString(item.value)}` : ""}${item.type === "copy" ? ` copyText=${jsxString(item.value ?? item.label)}` : ""}>`,
      `            ${jsxText(item.label)}`,
      "          </Label>",
    ]),
    "        </div>",
  ];
}

function stepperLines(steppers: RenderInterfaceArguments["steppers"]) {
  return steppers.flatMap((stepper, index) => [
    "        <section>",
    stepper.title
      ? `          <Text as="h3" variant="subheader-2">${jsxText(stepper.title)}</Text>`
      : null,
    `          <Stepper value={activeStep${index}} onUpdate={(value) => setActiveStep${index}(String(value ?? activeStep${index}))} size=${jsxString(stepper.size)}>`,
    ...stepper.items.flatMap((item) => [
      `            <Stepper.Item id=${jsxString(item.value)} view=${jsxString(item.view)}${item.disabled ? " disabled" : ""}>`,
      `              ${jsxText(item.label)}`,
      "            </Stepper.Item>",
    ]),
    "          </Stepper>",
    "        </section>",
  ].filter((line): line is string => Boolean(line)));
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

function tabLines(tabs: RenderInterfaceArguments["tabs"]) {
  return tabs.flatMap((tab, index) => [
    "        <section>",
    tab.title
      ? `          <Text as="h3" variant="subheader-2">${jsxText(tab.title)}</Text>`
      : null,
    `          <TabProvider value={activeTab${index}} onUpdate={setActiveTab${index}}>`,
    `            <TabList size=${jsxString(tab.size)}>`,
    ...tab.items.flatMap((item) => [
      `              <Tab value=${jsxString(item.value)}${item.counter ? ` counter=${jsxString(item.counter)}` : ""}${item.tone === "normal" ? "" : ` label={{ content: ${jsString(mapToneLabel(item.tone))}, theme: ${jsString(mapLabelTheme(item.tone))} }}`}>`,
      `                ${jsxText(item.label)}`,
      "              </Tab>",
    ]),
    "            </TabList>",
    ...tab.items.flatMap((item) => [
      `            <TabPanel value=${jsxString(item.value)}>`,
      `              <Text variant="body-2" color="secondary">${jsxText(item.body)}</Text>`,
      "            </TabPanel>",
    ]),
    "          </TabProvider>",
    "        </section>",
  ].filter((line): line is string => Boolean(line)));
}

function accordionLines(accordions: RenderInterfaceArguments["accordions"]) {
  return accordions.flatMap((accordion) => [
    "        <section>",
    accordion.title
      ? `          <Text as="h3" variant="subheader-2">${jsxText(accordion.title)}</Text>`
      : null,
    `          <Accordion multiple defaultValue={${jsonForCode(
      accordion.items
        .map((item, index) => (item.expanded ? `${index}_${item.title}` : null))
        .filter(Boolean),
      12,
    ).replace(/\n/g, "\n          ")}} size=${jsxString(accordion.size)} view=${jsxString(accordion.view)} arrowPosition=${jsxString(accordion.arrowPosition)}>`,
    ...accordion.items.flatMap((item, index) => [
      `            <Accordion.Item value=${jsxString(`${index}_${item.title}`)} summary=${jsxString(item.title)}${item.disabled ? " disabled" : ""}>`,
      `              <Text variant="body-2" color="secondary">${jsxText(item.body)}</Text>`,
      "            </Accordion.Item>",
    ]),
    "          </Accordion>",
    "        </section>",
  ].filter((line): line is string => Boolean(line)));
}

function descriptionLines(
  descriptions: RenderInterfaceArguments["descriptions"],
) {
  return descriptions.flatMap((description) => [
    "        <section>",
    description.title
      ? `          <Text as="h3" variant="subheader-2">${jsxText(description.title)}</Text>`
      : null,
    '          <DefinitionList direction="horizontal" responsive>',
    ...description.items.flatMap((item) => [
      `            <DefinitionList.Item name=${jsxString(item.label)}>`,
      `              ${jsxText(item.value)}`,
      "            </DefinitionList.Item>",
    ]),
    "          </DefinitionList>",
    "        </section>",
  ].filter((line): line is string => Boolean(line)));
}

function tableLines(tables: RenderInterfaceArguments["tables"]) {
  return tables.flatMap((table) => [
    "        <section>",
    table.title
      ? `          <Text as="h3" variant="subheader-2">${jsxText(table.title)}</Text>`
      : null,
    "          <Table",
    `            columns={${jsonForCode(
      table.columns.map((column) => ({
        id: column.id,
        name: column.label,
        align: column.align,
      })),
      14,
    ).replace(/\n/g, "\n            ")}}`,
    `            data={${jsonForCode(
      table.rows.map((row, rowIndex) =>
        Object.fromEntries([
          ["_rowId", String(rowIndex)],
          ...table.columns.map((column, columnIndex) => [
            column.id,
            row.cells[columnIndex] ?? "",
          ]),
        ]),
      ),
      14,
    ).replace(/\n/g, "\n            ")}}`,
    "            edgePadding",
    `            emptyMessage=${jsxString(table.emptyMessage)}`,
    "            wordWrap",
    "          />",
    "        </section>",
  ].filter((line): line is string => Boolean(line)));
}

function progressLines(progress: RenderInterfaceArguments["progress"]) {
  if (progress.length === 0) {
    return [];
  }

  return [
    '        <div style={{ display: "grid", gap: 10 }}>',
    ...progress.flatMap((item) => [
      '          <div style={{ display: "grid", gap: 6 }}>',
      '            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>',
      `              <Text variant="body-1">${jsxText(item.label)}</Text>`,
      `              <Text variant="caption-2" color=${jsxString(mapProgressTextColor(item.tone))}>${item.value}%</Text>`,
      "            </div>",
      ...(item.text
        ? [
            `            <Text variant="caption-2" color="secondary">${jsxText(item.text)}</Text>`,
          ]
        : []),
      `            <Progress value={${item.value}} theme=${jsxString(mapProgressTheme(item.tone))} size="s" text="" />`,
      "          </div>",
    ]),
    "        </div>",
  ];
}

function loadingStateLines(
  loadingStates: RenderInterfaceArguments["loadingStates"],
) {
  if (loadingStates.length === 0) {
    return [];
  }

  return [
    '        <div style={{ display: "grid", gap: 10 }}>',
    ...loadingStates.flatMap((item) => [
      '          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>',
      `            <Spin size=${jsxString(item.size)} />`,
      '            <div style={{ display: "grid", gap: 2 }}>',
      `              <Text variant="body-1">${jsxText(item.label)}</Text>`,
      item.description
        ? `              <Text variant="caption-2" color="secondary">${jsxText(item.description)}</Text>`
        : null,
      "            </div>",
      "          </div>",
    ]),
    "        </div>",
  ].filter((line): line is string => Boolean(line));
}

function emptyStateLines(emptyStates: RenderInterfaceArguments["emptyStates"]) {
  if (emptyStates.length === 0) {
    return [];
  }

  return [
    '        <div style={{ display: "grid", gap: 12 }}>',
    ...emptyStates.flatMap((item) => [
      "          <PlaceholderContainer",
      '            align="center"',
      `            description=${jsxString(item.description)}`,
      '            direction="column"',
      `            image={${iconElement(item.icon ?? "info", mapEmptyStateIconSize(item.size))}}`,
      `            size=${jsxString(item.size)}`,
      `            title=${jsxString(item.title)}`,
      "          />",
    ]),
    "        </div>",
  ];
}

function userLines(users: RenderInterfaceArguments["users"]) {
  if (users.length === 0) {
    return [];
  }

  return [
    '        <div style={{ display: "grid", gap: 10 }}>',
    ...users.flatMap((user) => [
      '          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>',
      `            <User name=${jsxString(user.name)} description=${jsxString(user.description ?? "")} avatar={{ text: ${jsString(createInitials(user.name))} }} size="m" />`,
      `            <Label theme=${jsxString(mapLabelTheme(user.tone))} size="xs">${jsxText(mapToneLabel(user.tone))}</Label>`,
      "          </div>",
    ]),
    "        </div>",
  ];
}

function linkLines(links: RenderInterfaceArguments["links"]) {
  if (links.length === 0) {
    return [];
  }

  return [
    '        <div style={{ display: "grid", gap: 8 }}>',
    ...links.flatMap((link) => [
      "          <div>",
      `            <Link href=${jsxString(link.href)} view="primary">${jsxText(link.label)}</Link>`,
      link.description
        ? `            <Text variant="caption-2" color="secondary">${jsxText(link.description)}</Text>`
        : null,
      "          </div>",
    ]),
    "        </div>",
  ].filter((line): line is string => Boolean(line));
}

function copyListLines(copyLists: RenderInterfaceArguments["copyLists"]) {
  return copyLists.flatMap((copyList) => [
    "        <section>",
    copyList.title
      ? `          <Text as="h3" variant="subheader-2">${jsxText(copyList.title)}</Text>`
      : null,
    '          <div style={{ display: "grid", gap: 8 }}>',
    ...copyList.items.flatMap((item) => [
      '            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>',
      '              <div style={{ minWidth: 0 }}>',
      `                <Text variant="caption-2" color="secondary">${jsxText(item.label)}</Text>`,
      `                <Text variant="body-1">${jsxText(item.value)}</Text>`,
      "              </div>",
      `              <CopyToClipboard text=${jsxString(item.copyText)} timeout={1200}>`,
      '                {(status) => (',
      '                  <Button size="s" view="flat-secondary">',
      "                    {status === \"success\" ? \"Copied\" : \"Copy\"}",
      "                  </Button>",
      "                )}",
      "              </CopyToClipboard>",
      "            </div>",
    ]),
    "          </div>",
    "        </section>",
  ].filter((line): line is string => Boolean(line)));
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

    if (field.type === "switch") {
      return [
        "        <Switch",
        `          checked={Boolean(form.${field.key})}`,
        `          content=${jsxString(field.label)}`,
        `          onUpdate={(value) => setForm((current) => ({ ...current, ${field.key}: value }))}`,
        '          size="l"',
        "        />",
      ];
    }

    if (field.type === "select" && field.options.length > 0) {
      return [
        "        <Select",
        `          label=${jsxString(field.label)}`,
        field.placeholder
          ? `          placeholder=${jsxString(field.placeholder)}`
          : null,
        `          onUpdate={(value) => setForm((current) => ({ ...current, ${field.key}: value }))}`,
        `          options={${jsonForCode(
          field.options.map((option) => ({
            content: option.label,
            text: option.label,
            value: option.value,
          })),
          10,
        ).replace(/\n/g, "\n          ")}}`,
        '          size="l"',
        `          value={Array.isArray(form.${field.key}) ? form.${field.key} : []}`,
        '          width="max"',
        "        />",
      ].filter((line): line is string => Boolean(line));
    }

    if (field.type === "slider") {
      return [
        '        <div style={{ display: "grid", gap: 6 }}>',
        '          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>',
        `            <Text variant="body-1">${jsxText(field.label)}</Text>`,
        `            <Label theme="normal" size="xs">{Number(form.${field.key})}</Label>`,
        "          </div>",
        "          <Slider",
        `            min={${field.min ?? 0}}`,
        `            max={${field.max ?? 100}}`,
        `            step={${field.step ?? 1}}`,
        `            value={Number(form.${field.key})}`,
        `            onUpdate={(value) => setForm((current) => ({ ...current, ${field.key}: value }))}`,
        "          />",
        "        </div>",
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
      `          <Button view=${jsxString(mapButtonView(action.variant))} onClick={() => handleAction(${jsString(action.action)})}${buttonStateProps(action)}>`,
      action.icon ? `            ${iconElement(action.icon, 16)}` : null,
      `            ${jsxText(action.label)}`,
      "          </Button>",
    ]),
    "        </div>",
  ].filter((line): line is string => Boolean(line));
}

function buttonStateProps(action: RenderInterfaceArguments["actions"][number]) {
  return [
    action.disabled ? " disabled={true}" : "",
    action.loading ? " loading={true}" : "",
    action.selected ? " selected={true}" : "",
  ].join("");
}

function initialFieldValue(field: FieldWithKey) {
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
    ...payload.metrics.map((metric) => metric.icon),
    ...payload.sections.map((section) => section.icon),
    ...payload.emptyStates.map((item) => item.icon ?? "info"),
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

function mapLabelTheme(value: string) {
  return value === "danger" ||
    value === "info" ||
    value === "success" ||
    value === "warning"
    ? value
    : "normal";
}

function mapProgressTheme(value: string) {
  switch (value) {
    case "danger":
      return "danger";
    case "info":
      return "info";
    case "success":
      return "success";
    case "warning":
      return "warning";
    default:
      return "default";
  }
}

function mapProgressTextColor(value: string) {
  switch (value) {
    case "danger":
      return "danger";
    case "success":
      return "positive";
    case "warning":
      return "warning";
    default:
      return "secondary";
  }
}

function mapEmptyStateIconSize(value: string) {
  switch (value) {
    case "s":
      return 28;
    case "l":
      return 44;
    case "promo":
      return 52;
    default:
      return 36;
  }
}

function mapToneLabel(value: string) {
  switch (value) {
    case "danger":
      return "Risk";
    case "info":
      return "Info";
    case "success":
      return "Good";
    case "warning":
      return "Watch";
    default:
      return "Neutral";
  }
}

function createInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1).toUpperCase())
    .join("");
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
