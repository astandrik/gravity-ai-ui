import type { ComposedInterfacePayload } from "./composedInterface";
import type { GravityIconName } from "./gravityCapabilities";

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

export function buildReactCode(payload: ComposedInterfacePayload) {
  const componentName = createComponentName(getPayloadTitle(payload));
  const usedIcons = collectUsedIcons(payload);
  const iconImports = iconImportLine(usedIcons);

  return [
    '"use client";',
    "",
    'import { Fragment, type ReactNode } from "react";',
    iconImports,
    'import { ActionBar } from "@gravity-ui/navigation";',
    "import {",
    "  Accordion,",
    "  Alert,",
    "  Breadcrumbs,",
    "  Button,",
    "  Card,",
    "  Checkbox,",
    "  CopyToClipboard,",
    "  DefinitionList,",
    "  Divider,",
    "  Icon,",
    "  Label,",
    "  Link,",
    "  PlaceholderContainer,",
    "  Progress,",
    "  RadioGroup,",
    "  Select,",
    "  Slider,",
    "  Spin,",
    "  Stepper,",
    "  Switch,",
    "  Tab,",
    "  TabList,",
    "  TabPanel,",
    "  TabProvider,",
    "  Table,",
    "  Text,",
    "  TextInput,",
    "  User,",
    '} from "@/components/GravityUI/GravityUI";',
    "",
    "type Node = {",
    "  id: string;",
    "  parentId: string | null;",
    "  order: number;",
    "  component: string;",
    "  props: Record<string, unknown>;",
    "};",
    "",
    `const root = ${jsValue(payload.root)};`,
    `const nodes: Node[] = ${jsValue(payload.nodes)};`,
    `const dataModel = ${jsValue(payload.dataModel ?? {})};`,
    "",
    iconMapLine(usedIcons),
    "",
    `export function ${componentName}() {`,
    "  const childrenByParent = groupChildren(nodes);",
    "  const renderChildren = (parentId: string) =>",
    "    (childrenByParent.get(parentId) ?? []).map((node) => (",
    "      <Fragment key={node.id}>{renderNode(node, childrenByParent, renderChildren)}</Fragment>",
    "    ));",
    "",
    "  return renderLayout(root.component, root.props ?? {}, renderChildren(\"root\"));",
    "}",
    "",
    "function renderNode(",
    "  node: Node,",
    "  childrenByParent: Map<string, Node[]>,",
    "  renderChildren: (parentId: string) => ReactNode[],",
    ") {",
    "  const props = node.props ?? {};",
    "  const children = renderChildren(node.id);",
    "",
    "  switch (node.component) {",
    '    case "Column":',
    '    case "Row":',
    "      return renderLayout(node.component, props, children);",
    '    case "NavigationBar":',
    "      return (",
    '        <ActionBar aria-label="Generated navigation">',
    "          <ActionBar.Section>",
    "            <ActionBar.Group>{children}</ActionBar.Group>",
    "          </ActionBar.Section>",
    "        </ActionBar>",
    "      );",
    '    case "Card":',
    "      return (",
    "        <Card theme={stringProp(props.theme, \"normal\")} view={stringProp(props.view, \"filled\")} size=\"l\" type=\"container\">",
    "          <div style={{ padding: padding(stringProp(props.padding, \"normal\")) }}>{children}</div>",
    "        </Card>",
    "      );",
    '    case "Text":',
    "      return (",
    "        <Text as={textElement(props.variant)} variant={textVariant(props.variant)} color={textColor(props.color)}>",
    "          {formatValue(resolve(props.text))}",
    "        </Text>",
    "      );",
    '    case "Icon":',
    "      return icon(props.name, props.size);",
    '    case "Button":',
    "      return (",
    "        <Button",
    "          view={buttonView(props.variant)}",
    "          disabled={Boolean(resolve(props.disabled))}",
    "          loading={Boolean(resolve(props.loading))}",
    "          selected={Boolean(resolve(props.selected))}",
    "          onClick={() => handleAction(props.action)}",
    "        >",
    "          {props.icon ? icon(props.icon, \"s\") : null}",
    "          {formatValue(resolve(props.text))}",
    "        </Button>",
    "      );",
    '    case "TextField":',
    "      return (",
    "        <label style={{ display: \"grid\", gap: 6 }}>",
    "          {props.label ? <Text variant=\"body-2\">{formatValue(props.label)}</Text> : null}",
    "          <TextInput value={String(resolve(props.value) ?? \"\")} placeholder={stringProp(props.placeholder)} disabled={Boolean(resolve(props.disabled))} onUpdate={() => undefined} />",
    "        </label>",
    "      );",
    '    case "CheckBox":',
    "      return <Checkbox checked={Boolean(resolve(props.value))} disabled={Boolean(resolve(props.disabled))} onUpdate={() => undefined}>{formatValue(props.label)}</Checkbox>;",
    '    case "SwitchField":',
    "      return <Switch checked={Boolean(resolve(props.value))} disabled={Boolean(resolve(props.disabled))} onUpdate={() => undefined}>{formatValue(props.label)}</Switch>;",
    '    case "ChoicePicker":',
    "      return renderChoicePicker(props);",
    '    case "SelectField":',
    "      return <Select label={stringProp(props.label)} value={arrayValue(resolve(props.value))} options={optionList(props.options)} placeholder={stringProp(props.placeholder)} disabled={Boolean(resolve(props.disabled))} onUpdate={() => undefined} />;",
    '    case "SliderField":',
    "      return (",
    "        <label style={{ display: \"grid\", gap: 8 }}>",
    "          <Text variant=\"body-2\">{formatValue(props.label)}</Text>",
    "          <Slider value={numberProp(resolve(props.value), 0)} min={numberProp(props.min, 0)} max={numberProp(props.max, 100)} step={numberProp(props.step, 1)} disabled={Boolean(resolve(props.disabled))} onUpdate={() => undefined} />",
    "        </label>",
    "      );",
    '    case "Divider":',
    "      return <Divider orientation={props.axis === \"vertical\" ? \"vertical\" : \"horizontal\"} />;",
    '    case "AlertBlock":',
    "      return <Alert layout=\"horizontal\" theme={stringProp(props.tone, \"info\")} view=\"filled\" title={stringProp(props.title)} message={stringProp(props.message)} />;",
    '    case "MetricGrid":',
    "      return renderMetricGrid(props.items);",
    '    case "DataTable":',
    "      return renderDataTable(props);",
    '    case "ProgressList":',
    "      return renderProgressList(props.items);",
    '    case "DefinitionListBlock":',
    "      return renderDefinitionList(props);",
    '    case "LinkList":',
    "      return renderLinkList(props.items);",
    '    case "UserList":',
    "      return renderUserList(props.items);",
    '    case "LabelGroup":',
    "      return renderLabels(props.items);",
    '    case "HeroBlock":',
    "      return renderHeroBlock(props);",
    '    case "FilterBar":',
    "      return renderFilterBar(props);",
    '    case "FeaturePanelGrid":',
    "      return renderFeaturePanels(props.items);",
    '    case "CardGrid":',
    "      return renderCardGrid(props);",
    '    case "TabsBlock":',
    "      return renderTabs(props);",
    '    case "EmptyStateList":',
    "      return renderEmptyStates(props.items);",
    '    case "LoadingStateList":',
    "      return renderLoadingStates(props.items);",
    '    case "BreadcrumbTrail":',
    "      return renderBreadcrumbs(props);",
    '    case "StepperBlock":',
    "      return renderStepper(props);",
    '    case "AccordionBlock":',
    "      return renderAccordion(props);",
    '    case "CopyList":',
    "      return renderCopyList(props);",
    "    default:",
    "      return null;",
    "  }",
    "}",
    "",
    generatedHelpers(),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

function generatedHelpers() {
  return String.raw`function renderLayout(component: string, props: Record<string, unknown>, children: ReactNode[]) {
  return (
    <div
      style={{
        alignItems: align(props.align),
        display: "flex",
        flexDirection: component === "Row" ? "row" : "column",
        flexWrap: component === "Row" ? "wrap" : undefined,
        gap: gap(props.gap),
        justifyContent: justify(props.justify),
      }}
    >
      {children}
    </div>
  );
}

function renderChoicePicker(props: Record<string, unknown>) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {props.label ? <Text variant="body-2">{formatValue(props.label)}</Text> : null}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {optionList(props.options).map((option) => (
          <Button key={option.value} view={arrayValue(resolve(props.value)).includes(option.value) ? "action" : "outlined"}>
            {option.content}
          </Button>
        ))}
      </div>
    </div>
  );
}

function renderMetricGrid(items: unknown) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
      {arrayRecords(items).map((item) => (
        <Card key={String(item.label) + "-" + String(item.value)} theme="normal" view="filled" type="container">
          <div style={{ display: "grid", gap: 6, padding: 14 }}>
            <Text variant="caption-2" color="secondary">{formatValue(item.label)}</Text>
            <Text variant="header-1">{formatValue(item.value)}</Text>
            {item.description ? <Text variant="caption-2" color="secondary">{formatValue(item.description)}</Text> : null}
          </div>
        </Card>
      ))}
    </div>
  );
}

function renderDataTable(props: Record<string, unknown>) {
  const columns = arrayRecords(props.columns).map((column) => ({
    id: String(column.id),
    name: String(column.label),
    align: column.align === "end" ? "right" : column.align === "center" ? "center" : "left",
  }));
  const data = arrayRecords(props.rows).map((row, rowIndex) => ({
    id: rowIndex,
    ...Object.fromEntries(arrayValues(row.cells).map((cell, index) => [String(columns[index]?.id ?? index), formatValue(cell)])),
  }));

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {props.title ? <Text as="h3" variant="subheader-2">{formatValue(props.title)}</Text> : null}
      <Table columns={columns} data={data} emptyMessage={stringProp(props.emptyMessage, "No data")} />
    </div>
  );
}

function renderProgressList(items: unknown) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {arrayRecords(items).map((item) => (
        <div key={String(item.label)} style={{ display: "grid", gap: 4 }}>
          <Text variant="body-2">{formatValue(item.label)}</Text>
          <Progress value={numberProp(item.value, 0)} theme={stringProp(item.tone, "info")} />
          {item.text ? <Text variant="caption-2" color="secondary">{formatValue(item.text)}</Text> : null}
        </div>
      ))}
    </div>
  );
}

function renderDefinitionList(props: Record<string, unknown>) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {props.title ? <Text as="h3" variant="subheader-2">{formatValue(props.title)}</Text> : null}
      <DefinitionList>
        {arrayRecords(props.items).map((item) => (
          <DefinitionList.Item key={String(item.label)} name={formatValue(item.label)}>{formatValue(item.value)}</DefinitionList.Item>
        ))}
      </DefinitionList>
    </div>
  );
}

function renderLinkList(items: unknown) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      {arrayRecords(items).map((item) => (
        <Link key={String(item.label)} href={stringProp(item.href, "#")}>{formatValue(item.label)}</Link>
      ))}
    </div>
  );
}

function renderUserList(items: unknown) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {arrayRecords(items).map((item) => (
        <User key={String(item.name)} name={stringProp(item.name)} description={stringProp(item.description)} />
      ))}
    </div>
  );
}

function renderLabels(items: unknown) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {arrayRecords(items).map((item) => (
        <Label key={String(item.label) + "-" + String(item.value ?? "")} theme={stringProp(item.tone, "normal")} type={stringProp(item.type, "default")}>
          {formatValue(item.label)}{item.value ? ": " + formatValue(item.value) : ""}
        </Label>
      ))}
    </div>
  );
}

function renderHeroBlock(props: Record<string, unknown>) {
  return (
    <section style={{ display: "grid", gap: 16, padding: 24, border: "1px solid var(--g-color-line-generic)", borderRadius: 12 }}>
      {props.eyebrow ? <Text variant="caption-2" color="secondary">{formatValue(props.eyebrow)}</Text> : null}
      <Text as="h1" variant="display-1">{formatValue(props.title)}</Text>
      {props.body ? <Text variant="body-2" color="secondary">{formatValue(props.body)}</Text> : null}
      {renderLabels(props.labels)}
      {renderActionButtons(props.actions)}
    </section>
  );
}

function renderFilterBar(props: Record<string, unknown>) {
  return (
    <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
      {props.title ? <Text variant="subheader-2">{formatValue(props.title)}</Text> : null}
      <TextInput value={stringProp(props.searchValue)} placeholder={stringProp(props.searchPlaceholder, "Search")} onUpdate={() => undefined} />
      {arrayRecords(props.filters).map((filter) => (
        <Button key={String(filter.value)} view={filter.active ? "action" : "outlined"}>{formatValue(filter.label)}</Button>
      ))}
      {arrayRecords(props.sortOptions).length > 0 ? (
        <Select label={stringProp(props.sortLabel)} value={props.sortValue ? [String(props.sortValue)] : []} options={optionList(props.sortOptions)} onUpdate={() => undefined} />
      ) : null}
    </div>
  );
}

function renderFeaturePanels(items: unknown) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
      {arrayRecords(items).map((item) => (
        <Card key={String(item.title)} theme="normal" view="filled" type="container">
          <div style={{ display: "grid", gap: 8, padding: 14 }}>
            <Text variant="subheader-2">{formatValue(item.title)}</Text>
            {item.value ? <Text variant="header-1">{formatValue(item.value)}</Text> : null}
            <Text variant="body-2" color="secondary">{formatValue(item.body)}</Text>
            {renderLabels(item.labels)}
          </div>
        </Card>
      ))}
    </div>
  );
}

function renderCardGrid(props: Record<string, unknown>) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {props.title ? <Text as="h3" variant="subheader-2">{formatValue(props.title)}</Text> : null}
      {props.description ? <Text variant="body-2" color="secondary">{formatValue(props.description)}</Text> : null}
      <div style={{ display: "grid", gridTemplateColumns: cardColumns(props.columns), gap: 12 }}>
        {arrayRecords(props.items).map((item) => (
          <Card key={String(item.title)} theme="normal" view="filled" type="container">
            <div style={{ display: "grid", gap: 10, padding: 14 }}>
              <Text variant="subheader-2">{formatValue(item.title)}</Text>
              {item.subtitle ? <Text variant="body-2" color="secondary">{formatValue(item.subtitle)}</Text> : null}
              {item.value ? <Text variant="header-1">{formatValue(item.value)}</Text> : null}
              <Text variant="body-2">{formatValue(item.body)}</Text>
              {renderLabels(item.labels)}
              {renderActionButtons(item.actions)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function renderTabs(props: Record<string, unknown>) {
  const items = arrayRecords(props.items);
  const active = String(items.find((item) => item.active)?.value ?? items[0]?.value ?? "");

  return (
    <TabProvider value={active}>
      <div style={{ display: "grid", gap: 10 }}>
        {props.title ? <Text variant="subheader-2">{formatValue(props.title)}</Text> : null}
        <TabList size={stringProp(props.size, "m")}>{items.map((item) => <Tab key={String(item.value)} value={String(item.value)}>{formatValue(item.label)}</Tab>)}</TabList>
        {items.map((item) => <TabPanel key={String(item.value)} value={String(item.value)}>{formatValue(item.body)}</TabPanel>)}
      </div>
    </TabProvider>
  );
}

function renderEmptyStates(items: unknown) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {arrayRecords(items).map((item) => (
        <PlaceholderContainer key={String(item.title)} size={stringProp(item.size, "m")}>
          <Text variant="subheader-2">{formatValue(item.title)}</Text>
          <Text variant="body-2" color="secondary">{formatValue(item.description)}</Text>
        </PlaceholderContainer>
      ))}
    </div>
  );
}

function renderLoadingStates(items: unknown) {
  return (
    <div style={{ display: "grid", gap: 12 }}>
      {arrayRecords(items).map((item) => (
        <div key={String(item.label)} style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Spin size={stringProp(item.size, "s")} />
          <Text variant="body-2">{formatValue(item.label)}</Text>
        </div>
      ))}
    </div>
  );
}

function renderBreadcrumbs(props: Record<string, unknown>) {
  return <Breadcrumbs items={arrayRecords(props.items).map((item) => ({ text: formatValue(item.label), href: stringProp(item.href, undefined) }))} />;
}

function renderStepper(props: Record<string, unknown>) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {props.title ? <Text variant="subheader-2">{formatValue(props.title)}</Text> : null}
      <Stepper size={stringProp(props.size, "m")} items={arrayRecords(props.items).map((item) => ({ id: String(item.value), title: formatValue(item.label), view: stringProp(item.view, "idle"), disabled: Boolean(item.disabled) }))} activeStep={String(arrayRecords(props.items).find((item) => item.active)?.value ?? "")} />
    </div>
  );
}

function renderAccordion(props: Record<string, unknown>) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {props.title ? <Text variant="subheader-2">{formatValue(props.title)}</Text> : null}
      <Accordion view={stringProp(props.view, "solid")} size={stringProp(props.size, "m")}>
        {arrayRecords(props.items).map((item) => (
          <Accordion.Item key={String(item.title)} title={formatValue(item.title)} disabled={Boolean(item.disabled)}>
            {formatValue(item.body)}
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  );
}

function renderCopyList(props: Record<string, unknown>) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {props.title ? <Text variant="subheader-2">{formatValue(props.title)}</Text> : null}
      {arrayRecords(props.items).map((item) => (
        <CopyToClipboard key={String(item.label)} text={stringProp(item.copyText)}>
          <Button view="outlined">{formatValue(item.label)}: {formatValue(item.value)}</Button>
        </CopyToClipboard>
      ))}
    </div>
  );
}

function renderActionButtons(actions: unknown) {
  const items = arrayRecords(actions);

  if (items.length === 0) {
    return null;
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {items.map((action) => (
        <Button key={String(action.label)} view={buttonView(action.variant)} disabled={Boolean(action.disabled)} loading={Boolean(action.loading)} selected={Boolean(action.selected)} onClick={() => handleAction(action.action)}>
          {action.icon ? icon(action.icon, "s") : null}
          {formatValue(action.label)}
        </Button>
      ))}
    </div>
  );
}

function handleAction(action: unknown) {
  console.log("A2UI action", action);
}

function groupChildren(nodes: Node[]) {
  const map = new Map<string, Node[]>();

  for (const node of nodes) {
    const parentId = node.parentId ?? "root";
    const list = map.get(parentId) ?? [];
    list.push(node);
    map.set(parentId, list);
  }

  for (const list of map.values()) {
    list.sort((left, right) => left.order === right.order ? left.id.localeCompare(right.id) : left.order - right.order);
  }

  return map;
}

function resolve(value: unknown): unknown {
  if (isRecord(value) && typeof value.path === "string") {
    return getPath(dataModel, value.path);
  }

  return value;
}

function getPath(source: unknown, path: string): unknown {
  if (path === "/") {
    return source;
  }

  return path
    .split("/")
    .slice(1)
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce<unknown>((current, key) => {
      if (!isRecord(current) && !Array.isArray(current)) {
        return undefined;
      }

      return (current as Record<string, unknown>)[key];
    }, source);
}

function icon(name: unknown, size: unknown) {
  const data = typeof name === "string" ? iconData[name] : undefined;

  return data ? <Icon data={data} size={size === "l" ? 20 : size === "m" ? 16 : 14} /> : null;
}

function buttonView(value: unknown) {
  return value === "primary" ? "action" : stringProp(value, "normal");
}

function textVariant(value: unknown) {
  const variants: Record<string, string> = {
    h1: "display-1",
    h2: "subheader-3",
    h3: "subheader-2",
    h4: "subheader-2",
    h5: "subheader-2",
    body: "body-2",
    caption: "caption-2",
  };

  return variants[stringProp(value, "body")] ?? "body-2";
}

function textElement(value: unknown) {
  return ["h1", "h2", "h3", "h4", "h5"].includes(String(value)) ? String(value) : "span";
}

function textColor(value: unknown) {
  return stringProp(value, "primary");
}

function align(value: unknown) {
  return value === "stretch" ? "stretch" : value === "center" ? "center" : value === "end" ? "flex-end" : "flex-start";
}

function justify(value: unknown) {
  return value === "spaceBetween" ? "space-between" : value === "center" ? "center" : value === "end" ? "flex-end" : "flex-start";
}

function gap(value: unknown) {
  return value === "spacious" ? 24 : value === "compact" ? 8 : 14;
}

function padding(value: unknown) {
  return value === "spacious" ? 24 : value === "comfortable" ? 20 : value === "compact" ? 12 : 16;
}

function cardColumns(value: unknown) {
  if (value === "three") {
    return "repeat(3, minmax(0, 1fr))";
  }

  if (value === "two") {
    return "repeat(2, minmax(0, 1fr))";
  }

  return "repeat(auto-fit, minmax(220px, 1fr))";
}

function optionList(value: unknown) {
  return arrayRecords(value).map((option) => ({
    value: String(option.value),
    content: formatValue(option.label),
  }));
}

function arrayRecords(value: unknown) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function arrayValues(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function arrayValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.map(String);
  }

  return typeof value === "string" && value ? [value] : [];
}

function numberProp(value: unknown, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

function stringProp(value: unknown, fallback = "") {
  const resolved = resolve(value);

  return typeof resolved === "string" ? resolved : fallback;
}

function formatValue(value: unknown) {
  const resolved = resolve(value);

  if (resolved === null || resolved === undefined) {
    return "";
  }

  return String(resolved);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}`;
}

function iconImportLine(icons: GravityIconName[]) {
  if (icons.length === 0) {
    return "";
  }

  return `import {\n${icons
    .map((icon) => {
      const data = iconImportByName[icon];

      return `  ${data.exportName} as ${data.localName},`;
    })
    .join("\n")}\n} from "@gravity-ui/icons";`;
}

function iconMapLine(icons: GravityIconName[]) {
  return `const iconData: Record<string, unknown> = {\n${icons
    .map((icon) => `  ${jsString(icon)}: ${iconImportByName[icon].localName},`)
    .join("\n")}\n};`;
}

function collectUsedIcons(payload: ComposedInterfacePayload) {
  const icons = new Set<GravityIconName>();

  for (const node of payload.nodes) {
    addIcon(icons, node.props.icon);
    addIcon(icons, node.props.name);

    for (const value of [node.props.actions, node.props.items]) {
      if (!Array.isArray(value)) {
        continue;
      }

      for (const item of value) {
        if (!isRecord(item)) {
          continue;
        }

        addIcon(icons, item.icon);

        if (Array.isArray(item.actions)) {
          for (const action of item.actions) {
            if (isRecord(action)) {
              addIcon(icons, action.icon);
            }
          }
        }
      }
    }
  }

  return [...icons];
}

function addIcon(icons: Set<GravityIconName>, value: unknown) {
  if (typeof value === "string" && value in iconImportByName) {
    icons.add(value as GravityIconName);
  }
}

function getPayloadTitle(payload: ComposedInterfacePayload) {
  const heading = payload.nodes.find(
    (node) =>
      node.component === "Text" &&
      (node.props.variant === "h1" ||
        node.props.variant === "h2" ||
        node.props.variant === "h3"),
  );
  const headingText = readPayloadString(heading?.props.text, payload.dataModel);

  if (headingText) {
    return headingText;
  }

  for (const node of payload.nodes) {
    const title = readPayloadString(node.props.title, payload.dataModel);

    if (title) {
      return title;
    }
  }

  return "Generated interface";
}

function createComponentName(title: string) {
  const name = title
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join("");

  return /^[A-Za-z]/.test(name) ? name : "GeneratedGravityInterface";
}

function readStaticString(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";

  return text || null;
}

function readPayloadString(value: unknown, dataModel: unknown) {
  if (isRecord(value) && typeof value.path === "string") {
    return readStaticString(readJsonPointer(dataModel, value.path));
  }

  return readStaticString(value);
}

function readJsonPointer(source: unknown, path: string) {
  if (path === "/") {
    return source;
  }

  return path
    .split("/")
    .slice(1)
    .map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"))
    .reduce<unknown>((current, key) => {
      if (!isRecord(current) && !Array.isArray(current)) {
        return undefined;
      }

      return (current as Record<string, unknown>)[key];
    }, source);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsValue(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function jsString(value: string) {
  return JSON.stringify(value);
}
