import { z } from "zod";
import {
  ALLOWED_A2UI_COMPONENTS,
  A2UI_VERSION,
  GRAVITY_A2UI_CATALOG_ID,
  componentIdSchema,
  gravityComponentSchema,
  validateGravityA2uiMessage,
  type GravityA2uiComponent,
  type GravityA2uiMessage,
} from "./a2uiContract";
import {
  GRAVITY_GAPS,
  GRAVITY_LAYOUT_ALIGN,
  GRAVITY_LAYOUT_JUSTIFY,
} from "./gravityCapabilities";
import { COMPOSE_COMPONENT_PROP_NAMES } from "./composeComponentCatalog";

const MAX_NODES = 120;
const MAX_DEPTH = 10;
const MAX_CHILDREN = 40;
const MAX_SEQUENCE = 10_000;
const ROOT_ID = "root";

const containerComponents = new Set<string>([
  "Column",
  "Row",
  "Card",
  "NavigationBar",
]);
const reservedPropNames = new Set(["id", "component", "child", "children"]);
const containerTextPropNames = ["title", "subtitle", "description"] as const;

const composedRootSchema = z
  .object({
    component: z.enum(["Column", "Row"]),
    props: z
      .object({
        justify: z.enum(GRAVITY_LAYOUT_JUSTIFY).optional(),
        align: z.enum(GRAVITY_LAYOUT_ALIGN).optional(),
        gap: z.enum(GRAVITY_GAPS).optional(),
      })
      .strict()
      .default({}),
  })
  .strict();

const composeNodeSchema = z
  .object({
    id: componentIdSchema.refine((id) => id !== ROOT_ID, {
      message: 'Node id "root" is reserved for the materialized root.',
    }),
    parentId: z
      .union([componentIdSchema, z.literal(ROOT_ID), z.null()])
      .default(ROOT_ID),
    order: z.number().int().min(0).max(MAX_SEQUENCE).default(0),
    component: z.enum(ALLOWED_A2UI_COMPONENTS),
    props: z.record(z.unknown()).default({}),
  })
  .strict();

export const composedInterfaceArgumentsSchema = z
  .object({
    sequence: z.number().int().min(0).max(MAX_SEQUENCE),
    surfaceId: componentIdSchema,
    dataModel: z.unknown().default({}),
    root: composedRootSchema.default({
      component: "Column",
      props: { align: "stretch", gap: "normal" },
    }),
    nodes: z.array(composeNodeSchema).max(MAX_NODES),
  })
  .strict();

export type ComposeNode = z.infer<typeof composeNodeSchema>;
export type ComposedInterfacePayload = z.infer<
  typeof composedInterfaceArgumentsSchema
>;

export type BuiltComposedInterface = {
  sequence: number;
  payload: ComposedInterfacePayload;
  messages: GravityA2uiMessage[];
};

type MaterializeMode = "strict" | "partial";

type NormalizedNode = ComposeNode & {
  parentId: string;
};

type MaterializedTree = {
  components: GravityA2uiComponent[];
  renderedNodeIds: Set<string>;
};

export function buildComposedInterfaceFromJson(
  argumentsJson: string,
): BuiltComposedInterface {
  return buildComposedInterface(
    composedInterfaceArgumentsSchema.parse(
      sanitizeComposedInterfaceInput(JSON.parse(argumentsJson)),
    ),
    "strict",
  );
}

export function buildComposedInterfaceFromPartialJson(
  argumentsJson: string,
  fallbackSurfaceId: string,
): BuiltComposedInterface | null {
  const fields = parseCompleteTopLevelFields(argumentsJson);
  const parsedNodes = Array.isArray(fields.nodes)
    ? fields.nodes
        .map((node) => composeNodeSchema.safeParse(node))
        .filter((node): node is z.SafeParseSuccess<ComposeNode> => node.success)
        .map((node) => node.data)
        .slice(0, MAX_NODES)
    : [];

  if (parsedNodes.length === 0) {
    return null;
  }

  const surfaceId = parseField(
    componentIdSchema,
    fields.surfaceId,
    fallbackSurfaceId,
  );
  const root = parseField(
    composedRootSchema,
    fields.root,
    composedRootSchema.parse({
      component: "Column",
      props: { align: "stretch", gap: "normal" },
    }),
  );

  const parsed = composedInterfaceArgumentsSchema.safeParse({
    sequence: parseField(z.number().int().min(0).max(MAX_SEQUENCE), fields.sequence, 0),
    surfaceId,
    dataModel: fields.dataModel ?? {},
    root,
    nodes: parsedNodes,
  });

  if (!parsed.success) {
    return null;
  }

  try {
    const built = buildComposedInterface(parsed.data, "partial");

    return built.messages.some(
      (message) =>
        "updateComponents" in message &&
        message.updateComponents.components.length > 1,
    )
      ? built
      : null;
  } catch {
    return null;
  }
}

export function buildComposedInterface(
  args: ComposedInterfacePayload,
  mode: MaterializeMode = "strict",
): BuiltComposedInterface {
  const payload = normalizeContainerTextProps(
    composedInterfaceArgumentsSchema.parse(sanitizeComposedInterfaceInput(args)),
  );
  const tree = materializeComponentTree(payload, mode);
  const messages = [
    validateGravityA2uiMessage({
      version: A2UI_VERSION,
      createSurface: {
        surfaceId: payload.surfaceId,
        catalogId: GRAVITY_A2UI_CATALOG_ID,
        sendDataModel: true,
      },
    }),
    validateGravityA2uiMessage({
      version: A2UI_VERSION,
      updateComponents: {
        surfaceId: payload.surfaceId,
        components: tree.components,
      },
    }),
    validateGravityA2uiMessage({
      version: A2UI_VERSION,
      updateDataModel: {
        surfaceId: payload.surfaceId,
        path: "/",
        value: payload.dataModel ?? {},
      },
    }),
  ];

  return {
    sequence: payload.sequence,
    payload: {
      ...payload,
      nodes: payload.nodes.filter((node) => tree.renderedNodeIds.has(node.id)),
    },
    messages,
  };
}

export function materializeComposedComponents(
  payload: ComposedInterfacePayload,
): GravityA2uiComponent[] {
  return materializeComponentTree(
    composedInterfaceArgumentsSchema.parse(sanitizeComposedInterfaceInput(payload)),
    "strict",
  ).components;
}

function sanitizeComposedInterfaceInput(input: unknown): unknown {
  if (!isRecord(input) || !Array.isArray(input.nodes)) {
    return input;
  }

  return {
    ...input,
    nodes: input.nodes.filter(isRecord),
  };
}

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
            id: ROOT_ID,
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

function materializeComponentTree(
  payload: ComposedInterfacePayload,
  mode: MaterializeMode,
): MaterializedTree {
  const nodes = normalizeNodes(payload.nodes);

  if (mode === "strict") {
    validateGraph(nodes);
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const childrenByParent = buildChildrenByParent(nodes, mode, nodeById);
  const components: GravityA2uiComponent[] = [];
  const emittedIds = new Set<string>();
  const renderedNodeIds = new Set<string>();
  const visiting = new Set<string>();
  const syntheticIds = new Set<string>([ROOT_ID, ...nodes.map((node) => node.id)]);

  const materializeChildren = (parentId: string, depth: number): string[] => {
    if (depth > MAX_DEPTH) {
      if (mode === "strict") {
        throw new Error(`Component tree exceeds max depth ${MAX_DEPTH}.`);
      }

      return [];
    }

    return (childrenByParent.get(parentId) ?? [])
      .map((node) => materializeNode(node, depth))
      .filter((id): id is string => Boolean(id));
  };

  const materializeNode = (
    node: NormalizedNode,
    depth: number,
  ): string | null => {
    if (visiting.has(node.id)) {
      if (mode === "strict") {
        throw new Error(`Component graph contains a cycle at ${node.id}.`);
      }

      return null;
    }

    if (emittedIds.has(node.id)) {
      return node.id;
    }

    if (!containerComponents.has(node.component) && childrenByParent.has(node.id)) {
      if (mode === "strict") {
        throw new Error(
          `Component ${node.id} (${node.component}) cannot receive children.`,
        );
      }
    }

    visiting.add(node.id);

    const childIds = containerComponents.has(node.component)
      ? materializeChildren(node.id, depth + 1)
      : [];
    const component = buildMaterializedComponent(
      node,
      childIds,
      syntheticIds,
      components,
      mode,
    );

    visiting.delete(node.id);

    if (!component) {
      return null;
    }

    components.push(component);
    emittedIds.add(component.id);
    renderedNodeIds.add(node.id);

    return component.id;
  };

  const rootChildren = materializeChildren(ROOT_ID, 1);
  const root = parseComponent(
    {
      id: ROOT_ID,
      component: payload.root.component,
      children: rootChildren,
      ...payload.root.props,
    },
    ROOT_ID,
    mode,
  );

  if (!root) {
    throw new Error("Root component could not be materialized.");
  }

  return {
    components: [root, ...components],
    renderedNodeIds,
  };
}

function normalizeNodes(nodes: ComposeNode[]): NormalizedNode[] {
  return nodes.map((node) => ({
    ...node,
    parentId: node.parentId ?? ROOT_ID,
    props: node.props ?? {},
  }));
}

function validateGraph(nodes: NormalizedNode[]) {
  const nodeById = new Map<string, NormalizedNode>();

  for (const node of nodes) {
    if (nodeById.has(node.id)) {
      throw new Error(`Duplicate node id: ${node.id}`);
    }

    assertNoReservedProps(node);
    nodeById.set(node.id, node);
  }

  const childCounts = new Map<string, number>();

  for (const node of nodes) {
    const parentId = node.parentId;
    childCounts.set(parentId, (childCounts.get(parentId) ?? 0) + 1);

    if ((childCounts.get(parentId) ?? 0) > MAX_CHILDREN) {
      throw new Error(`Parent ${parentId} exceeds max children ${MAX_CHILDREN}.`);
    }

    if (parentId === ROOT_ID) {
      continue;
    }

    const parent = nodeById.get(parentId);

    if (!parent) {
      throw new Error(`Node ${node.id} references unknown parent ${parentId}.`);
    }

    if (!containerComponents.has(parent.component)) {
      throw new Error(
        `Parent ${parentId} (${parent.component}) cannot receive children.`,
      );
    }
  }

  for (const node of nodes) {
    const seen = new Set<string>();
    let current: NormalizedNode | undefined = node;
    let depth = 0;

    while (current) {
      if (seen.has(current.id)) {
        throw new Error(`Component graph contains a cycle at ${current.id}.`);
      }

      seen.add(current.id);
      depth += 1;

      if (depth > MAX_DEPTH) {
        throw new Error(`Component tree exceeds max depth ${MAX_DEPTH}.`);
      }

      current =
        current.parentId === ROOT_ID ? undefined : nodeById.get(current.parentId);
    }
  }
}

function buildChildrenByParent(
  nodes: NormalizedNode[],
  mode: MaterializeMode,
  nodeById: Map<string, NormalizedNode>,
) {
  const childrenByParent = new Map<string, NormalizedNode[]>();
  const ids = new Set(nodes.map((node) => node.id));

  for (const node of nodes) {
    if (mode === "partial" && node.parentId !== ROOT_ID) {
      const parent = nodeById.get(node.parentId);

      if (!parent || !containerComponents.has(parent.component)) {
        continue;
      }
    }

    if (mode === "partial" && ids.has(node.id) && hasReservedProps(node)) {
      continue;
    }

    const list = childrenByParent.get(node.parentId) ?? [];
    list.push(node);
    childrenByParent.set(node.parentId, list);
  }

  for (const children of childrenByParent.values()) {
    children.sort((left, right) =>
      left.order === right.order
        ? left.id.localeCompare(right.id)
        : left.order - right.order,
    );
  }

  return childrenByParent;
}

function buildMaterializedComponent(
  node: NormalizedNode,
  childIds: string[],
  syntheticIds: Set<string>,
  components: GravityA2uiComponent[],
  mode: MaterializeMode,
): GravityA2uiComponent | null {
  if (mode === "strict") {
    assertNoReservedProps(node);
    assertKnownProps(node);
  } else if (hasReservedProps(node)) {
    return null;
  } else if (findUnknownProps(node).length > 0) {
    return null;
  }

  if (
    node.component === "Column" ||
    node.component === "Row" ||
    node.component === "NavigationBar"
  ) {
    return parseComponent(
      {
        id: node.id,
        component: node.component,
        children: childIds,
        ...node.props,
      },
      node.id,
      mode,
    );
  }

  if (node.component === "Card") {
    if (childIds.length === 0) {
      if (mode === "strict") {
        throw new Error(`Card ${node.id} requires at least one child.`);
      }

      return null;
    }

    const child =
      childIds.length === 1
        ? childIds[0]
        : insertSyntheticCardColumn(node.id, childIds, syntheticIds, components);

    return parseComponent(
      {
        id: node.id,
        component: "Card",
        child,
        ...node.props,
      },
      node.id,
      mode,
    );
  }

  return parseComponent(
    {
      id: node.id,
      component: node.component,
      ...node.props,
    },
    node.id,
    mode,
  );
}

function insertSyntheticCardColumn(
  cardId: string,
  childIds: string[],
  syntheticIds: Set<string>,
  components: GravityA2uiComponent[],
) {
  let suffix = 0;
  let id = `${cardId}_content`;

  while (syntheticIds.has(id)) {
    suffix += 1;
    id = `${cardId}_content_${suffix}`;
  }

  syntheticIds.add(id);
  components.push({
    id,
    component: "Column",
    children: childIds,
    align: "stretch",
    gap: "normal",
  });

  return id;
}

function parseComponent(
  component: unknown,
  id: string,
  mode: MaterializeMode,
): GravityA2uiComponent | null {
  const parsed = gravityComponentSchema.safeParse(component);

  if (parsed.success) {
    return parsed.data;
  }

  if (mode === "strict") {
    throw new Error(
      `Invalid props for component ${id}: ${parsed.error.issues
        .map((issue) => issue.message)
        .join("; ")}`,
    );
  }

  return null;
}

function assertNoReservedProps(node: NormalizedNode) {
  if (!hasReservedProps(node)) {
    return;
  }

  throw new Error(
    `Node ${node.id} uses reserved props: ${Object.keys(node.props)
      .filter((key) => reservedPropNames.has(key))
      .join(", ")}`,
  );
}

function hasReservedProps(node: NormalizedNode) {
  return Object.keys(node.props).some((key) => reservedPropNames.has(key));
}

function assertKnownProps(node: NormalizedNode) {
  const unknownProps = findUnknownProps(node);

  if (unknownProps.length === 0) {
    return;
  }

  const allowedProps = COMPOSE_COMPONENT_PROP_NAMES[node.component].join(", ");
  const layoutHint =
    node.component === "Column" ||
    node.component === "Row" ||
    node.component === "Card" ||
    node.component === "NavigationBar"
      ? " Use child Text nodes for headings/subtitles on layout containers."
      : "";

  throw new Error(
    `Invalid props for component ${node.id} (${node.component}): ${unknownProps.join(", ")}. Allowed props: ${allowedProps || "none"}.${layoutHint}`,
  );
}

function findUnknownProps(node: NormalizedNode) {
  const allowed = new Set(COMPOSE_COMPONENT_PROP_NAMES[node.component]);

  return Object.keys(node.props).filter((key) => !allowed.has(key));
}

function normalizeContainerTextProps(
  payload: ComposedInterfacePayload,
): ComposedInterfacePayload {
  const usedIds = new Set(payload.nodes.map((node) => node.id));
  const extraNodes: ComposeNode[] = [];
  const nodes = payload.nodes.map((node) => {
    if (
      node.component !== "Column" &&
      node.component !== "Row" &&
      node.component !== "Card" &&
      node.component !== "NavigationBar"
    ) {
      return node;
    }

    const textEntries = containerTextPropNames
      .map((name) => [name, node.props[name]] as const)
      .filter(([, value]) => isRenderableTextValue(value));

    if (textEntries.length === 0) {
      return node;
    }

    const props = { ...node.props };

    for (const [name] of textEntries) {
      delete props[name];
    }

    const parentId =
      node.component === "Row" && textEntries.length > 1
        ? createSyntheticTextGroupNode(node, usedIds, extraNodes)
        : node.id;

    textEntries.forEach(([name, value], index) => {
      extraNodes.push({
        id: createSyntheticId(`${node.id}_${name}`, usedIds),
        parentId,
        order: index,
        component: "Text",
        props: {
          text: value,
          ...(name === "title" ? { variant: "h3" } : {}),
          ...(name !== "title" ? { color: "secondary" } : {}),
        },
      });
    });

    return {
      ...node,
      props,
    };
  });

  if (nodes.length + extraNodes.length > MAX_NODES) {
    throw new Error(`Component tree exceeds max nodes ${MAX_NODES}.`);
  }

  return {
    ...payload,
    nodes: [...nodes, ...extraNodes],
  };
}

function createSyntheticTextGroupNode(
  node: ComposeNode,
  usedIds: Set<string>,
  extraNodes: ComposeNode[],
) {
  const id = createSyntheticId(`${node.id}_heading`, usedIds);

  extraNodes.push({
    id,
    parentId: node.id,
    order: 0,
    component: "Column",
    props: {
      gap: "compact",
    },
  });

  return id;
}

function createSyntheticId(baseId: string, usedIds: Set<string>) {
  let id = baseId;
  let suffix = 1;

  while (usedIds.has(id)) {
    id = `${baseId}_${suffix}`;
    suffix += 1;
  }

  usedIds.add(id);

  return id;
}

function isRenderableTextValue(value: unknown) {
  return (
    (typeof value === "string" && value.trim() !== "") ||
    (isRecord(value) &&
      "path" in value &&
      typeof value.path === "string")
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseField<T>(schema: z.ZodType<T>, value: unknown, fallback: T): T {
  const parsed = schema.safeParse(value);

  return parsed.success ? parsed.data : fallback;
}

function parseCompleteTopLevelFields(input: string): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  const objectStart = input.indexOf("{");

  if (objectStart === -1) {
    return fields;
  }

  let index = objectStart + 1;

  while (index < input.length) {
    index = skipWhitespaceAndCommas(input, index);

    if (input[index] === "}") {
      break;
    }

    if (input[index] !== '"') {
      break;
    }

    const keyEnd = readStringEnd(input, index);

    if (keyEnd === null) {
      break;
    }

    const key = JSON.parse(input.slice(index, keyEnd));
    index = skipWhitespace(input, keyEnd);

    if (input[index] !== ":") {
      break;
    }

    index = skipWhitespace(input, index + 1);

    if (key === "nodes" && input[index] === "[") {
      fields.nodes = parseCompleteArrayItems(input, index);
    }

    const valueEnd = readJsonValueEnd(input, index);

    if (valueEnd === null) {
      break;
    }

    try {
      fields[key] = JSON.parse(input.slice(index, valueEnd));
    } catch {
      break;
    }

    index = valueEnd;
  }

  return fields;
}

function parseCompleteArrayItems(input: string, arrayStart: number): unknown[] {
  const items: unknown[] = [];
  let index = arrayStart + 1;

  while (index < input.length) {
    index = skipWhitespaceAndCommas(input, index);

    if (input[index] === "]") {
      break;
    }

    const valueEnd = readJsonValueEnd(input, index);

    if (valueEnd === null) {
      break;
    }

    try {
      items.push(JSON.parse(input.slice(index, valueEnd)));
    } catch {
      break;
    }

    index = valueEnd;
  }

  return items;
}

function readJsonValueEnd(input: string, start: number): number | null {
  const char = input[start];

  if (char === '"') {
    return readStringEnd(input, start);
  }

  if (char === "{" || char === "[") {
    const opener = char;
    const closer = opener === "{" ? "}" : "]";
    let depth = 0;
    let index = start;
    let inString = false;
    let escaped = false;

    while (index < input.length) {
      const current = input[index];

      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (current === "\\") {
          escaped = true;
        } else if (current === '"') {
          inString = false;
        }

        index += 1;
        continue;
      }

      if (current === '"') {
        inString = true;
      } else if (current === opener) {
        depth += 1;
      } else if (current === closer) {
        depth -= 1;

        if (depth === 0) {
          return index + 1;
        }
      }

      index += 1;
    }

    return null;
  }

  let index = start;

  while (index < input.length && !/[,\]}]/.test(input[index])) {
    index += 1;
  }

  if (index === start) {
    return null;
  }

  const value = input.slice(start, index).trim();

  if (!value) {
    return null;
  }

  try {
    JSON.parse(value);

    return start + input.slice(start, index).lastIndexOf(value) + value.length;
  } catch {
    return null;
  }
}

function readStringEnd(input: string, start: number): number | null {
  let index = start + 1;
  let escaped = false;

  while (index < input.length) {
    const char = input[index];

    if (escaped) {
      escaped = false;
    } else if (char === "\\") {
      escaped = true;
    } else if (char === '"') {
      return index + 1;
    }

    index += 1;
  }

  return null;
}

function skipWhitespaceAndCommas(input: string, start: number) {
  let index = start;

  while (index < input.length && /[\s,]/.test(input[index])) {
    index += 1;
  }

  return index;
}

function skipWhitespace(input: string, start: number) {
  let index = start;

  while (index < input.length && /\s/.test(input[index])) {
    index += 1;
  }

  return index;
}
