import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const capabilitiesOutputPath = join(
  projectRoot,
  "src/lib/agent/generatedGravityCapabilities.ts",
);
const componentCatalogOutputPath = join(
  projectRoot,
  "src/lib/agent/generatedGravityComponentCatalog.ts",
);
const checkMode = process.argv.includes("--check");
const repository = "gravity-ui/uikit";

const packageRoot = findPackageRoot("@gravity-ui/uikit");
const packageJson = readJson(join(packageRoot, "package.json"));
const docsRef = `v${packageJson.version}`;

const gravityCapabilities = {
  version: packageJson.version,
  buttonViews: readJsArray(
    join(packageRoot, "build/esm/components/Button/constants.js"),
    "BUTTON_VIEWS",
  ),
  textVariants: readJsArray(
    join(packageRoot, "build/esm/components/Text/text/text.js"),
    "TEXT_VARIANTS",
  ),
  textColors: readJsArray(
    join(packageRoot, "build/esm/components/Text/colorText/colorText.js"),
    "TEXT_COLORS",
  ),
  cardContainerViews: readTypeUnion(
    join(packageRoot, "build/esm/components/Card/Card.d.ts"),
    "ContainerCardView",
  ),
  cardThemes: readTypeUnion(
    join(packageRoot, "build/esm/components/Card/Card.d.ts"),
    "CardTheme",
  ),
};
const componentCatalog = readComponentCatalog(packageRoot);
const upstreamPaths = fetchGithubTreePaths(docsRef);
const componentDocsByPath = new Map();

for (const component of componentCatalog) {
  const docsPath = getComponentDocsPath(component, upstreamPaths);

  if (!docsPath) {
    continue;
  }

  if (!componentDocsByPath.has(docsPath)) {
    componentDocsByPath.set(
      docsPath,
      parseComponentReadme(fetchGithubRaw(docsPath, docsRef)),
    );
  }

  Object.assign(component, {
    docsPath,
    docsUrl: `https://github.com/${repository}/blob/${docsRef}/${docsPath}`,
    ...componentDocsByPath.get(docsPath),
  });
}

const generatedFiles = [
  {
    path: capabilitiesOutputPath,
    content: formatGeneratedCapabilitiesFile(gravityCapabilities),
  },
  {
    path: componentCatalogOutputPath,
    content: formatGeneratedComponentCatalogFile({
      components: componentCatalog,
      version: packageJson.version,
    }),
  },
];

if (checkMode) {
  const staleFiles = generatedFiles.filter(({ path, content }) => {
    const currentContent = existsSync(path) ? readFileSync(path, "utf8") : null;

    return currentContent !== content;
  });

  if (staleFiles.length > 0) {
    process.stderr.write(
      "Generated Gravity UI capabilities are stale. Run `npm run generate:gravity-capabilities`.\n",
    );
    process.exit(1);
  }

  process.stdout.write("Generated Gravity UI capabilities are up to date.\n");
} else {
  for (const { path, content } of generatedFiles) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    process.stdout.write(`Wrote ${relativePath(path)}.\n`);
  }
}

function findPackageRoot(packageName) {
  let currentDir = dirname(require.resolve(packageName));

  while (currentDir !== dirname(currentDir)) {
    const candidate = join(currentDir, "package.json");

    if (existsSync(candidate)) {
      const packageJson = readJson(candidate);

      if (packageJson.name === packageName) {
        return currentDir;
      }
    }

    currentDir = dirname(currentDir);
  }

  throw new Error(`Cannot find package root for ${packageName}`);
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readJsArray(path, exportName) {
  const source = readFileSync(path, "utf8");
  const match = source.match(
    new RegExp(`export\\s+const\\s+${exportName}\\s*=\\s*\\[([\\s\\S]*?)\\];`),
  );

  if (!match) {
    throw new Error(`Cannot find ${exportName} in ${relativePath(path)}`);
  }

  return readStringLiterals(match[1], `${exportName} in ${relativePath(path)}`);
}

function readTypeUnion(path, typeName) {
  const source = readFileSync(path, "utf8");
  const match = source.match(
    new RegExp(`(?:export\\s+)?type\\s+${typeName}\\s*=\\s*([^;]+);`),
  );

  if (!match) {
    throw new Error(`Cannot find ${typeName} in ${relativePath(path)}`);
  }

  return readStringLiterals(match[1], `${typeName} in ${relativePath(path)}`);
}

function readStringLiterals(source, label) {
  const values = [...source.matchAll(/['"]([^'"]+)['"]/g)].map(
    (match) => match[1],
  );

  if (values.length === 0) {
    throw new Error(`No string literals found for ${label}`);
  }

  return values;
}

function readComponentCatalog(packageRoot) {
  const entryPath = join(packageRoot, "build/esm/index.d.ts");
  const program = ts.createProgram([entryPath], {
    allowJs: false,
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Node10,
    skipLibCheck: true,
    strict: true,
    target: ts.ScriptTarget.ES2020,
  });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(entryPath);

  if (!sourceFile) {
    throw new Error(`Cannot load ${relativePath(entryPath)}`);
  }

  const moduleSymbol = checker.getSymbolAtLocation(sourceFile);

  if (!moduleSymbol) {
    throw new Error(`Cannot read module exports from ${relativePath(entryPath)}`);
  }

  return checker
    .getExportsOfModule(moduleSymbol)
    .map((symbol) => readComponent(checker, packageRoot, sourceFile, symbol))
    .filter(Boolean);
}

function readComponent(checker, packageRoot, sourceFile, symbol) {
  const name = symbol.getName();

  if (!/^[A-Z][A-Za-z0-9]*$/.test(name)) {
    return null;
  }

  const componentSymbol =
    symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
  const declaration = componentSymbol.valueDeclaration;

  if (!declaration) {
    return null;
  }

  const componentType = checker.getTypeOfSymbolAtLocation(
    componentSymbol,
    declaration,
  );
  const callSignatures = checker.getSignaturesOfType(
    componentType,
    ts.SignatureKind.Call,
  );

  if (callSignatures.length === 0) {
    return null;
  }

  const parameters = callSignatures[0].getParameters();

  if (parameters.length === 0) {
    return null;
  }

  const propsType = checker.getTypeOfSymbolAtLocation(
    parameters[0],
    declaration,
  );
  const props = checker
    .getPropertiesOfType(propsType)
    .map((propSymbol) =>
      readProp(checker, packageRoot, sourceFile, declaration, propSymbol),
    )
    .filter(Boolean);

  if (props.length === 0) {
    return null;
  }

  return {
    name,
    props,
  };
}

function readProp(checker, packageRoot, sourceFile, declaration, propSymbol) {
  const declarations = propSymbol.getDeclarations() ?? [];
  const packageDeclarations = declarations.filter((propDeclaration) =>
    propDeclaration.getSourceFile().fileName.startsWith(packageRoot),
  );

  if (packageDeclarations.length === 0) {
    return null;
  }

  const propDeclaration = packageDeclarations[0];
  const propType = checker.getTypeOfSymbolAtLocation(propSymbol, declaration);
  const values = collectLiteralValues(propType);
  const type = normalizeTypeString(
    checker.typeToString(
      propType,
      sourceFile,
      ts.TypeFormatFlags.NoTruncation |
        ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType,
    ),
  );
  const prop = {
    name: propSymbol.getName(),
    required: !isOptionalProp(propSymbol, propType),
    kind: inferPropKind(checker, propType, values, type),
    type,
    source: relativePath(propDeclaration.getSourceFile().fileName),
  };

  if (values.length > 0) {
    prop.values = values;
  }

  if (propSymbol.getJsDocTags(checker).some((tag) => tag.name === "deprecated")) {
    prop.deprecated = true;
  }

  return prop;
}

function isOptionalProp(propSymbol, propType) {
  return (
    Boolean(propSymbol.flags & ts.SymbolFlags.Optional) ||
    typeIncludesFlag(propType, ts.TypeFlags.Undefined)
  );
}

function collectLiteralValues(type) {
  const values = [];
  const seen = new Set();

  visit(type);

  return values;

  function visit(currentType) {
    if (currentType.isUnion()) {
      for (const unionType of currentType.types) {
        visit(unionType);
      }

      return;
    }

    const value = getLiteralValue(currentType);

    if (value !== undefined && !seen.has(value)) {
      seen.add(value);
      values.push(value);
    }
  }
}

function getLiteralValue(type) {
  if (type.isStringLiteral()) {
    return type.value;
  }

  if (type.isNumberLiteral()) {
    return type.value;
  }

  return undefined;
}

function inferPropKind(checker, propType, values, type) {
  if (/ReactNode|ReactElement|JSX\.Element/.test(type)) {
    return "node";
  }

  if (values.length > 0) {
    return "enum";
  }

  if (typeIncludesFlag(propType, ts.TypeFlags.BooleanLike)) {
    return "boolean";
  }

  if (typeIncludesFlag(propType, ts.TypeFlags.NumberLike)) {
    return "number";
  }

  if (typeIncludesFlag(propType, ts.TypeFlags.StringLike)) {
    return "string";
  }

  if (typeHasCallSignature(checker, propType)) {
    return "function";
  }

  if (checker.isArrayType(propType) || checker.isTupleType(propType)) {
    return "array";
  }

  if (typeIncludesFlag(propType, ts.TypeFlags.Object)) {
    return "object";
  }

  return "unknown";
}

function typeHasCallSignature(checker, type) {
  if (checker.getSignaturesOfType(type, ts.SignatureKind.Call).length > 0) {
    return true;
  }

  return type.isUnion() && type.types.some((unionType) => typeHasCallSignature(checker, unionType));
}

function typeIncludesFlag(type, flag) {
  if (type.flags & flag) {
    return true;
  }

  return type.isUnion() && type.types.some((unionType) => typeIncludesFlag(unionType, flag));
}

function normalizeTypeString(value) {
  return value
    .replaceAll(`${projectRoot}/`, "")
    .replace(/\s+/g, " ")
    .slice(0, 240);
}

function fetchGithubTreePaths(ref) {
  try {
    return new Set(
      execFileSync(
        "gh",
        [
          "api",
          `repos/${repository}/git/trees/${ref}?recursive=1`,
          "--jq",
          ".tree[].path",
        ],
        { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
      )
        .split("\n")
        .filter(Boolean),
    );
  } catch (error) {
    throw new Error(
      `Cannot fetch Gravity UI source tree for ${ref}. Run this command with GitHub network access. ${formatExecError(error)}`,
    );
  }
}

function fetchGithubRaw(path, ref) {
  try {
    return execFileSync(
      "gh",
      [
        "api",
        "-H",
        "Accept: application/vnd.github.raw",
        `repos/${repository}/contents/${path}?ref=${ref}`,
      ],
      { encoding: "utf8", maxBuffer: 5 * 1024 * 1024 },
    );
  } catch (error) {
    throw new Error(
      `Cannot fetch Gravity UI docs at ${path} for ${ref}. ${formatExecError(error)}`,
    );
  }
}

function getComponentDocsPath(component, upstreamPaths) {
  const candidateDirs = new Set();

  for (const prop of component.props) {
    const match = prop.source.match(
      /node_modules\/@gravity-ui\/uikit\/build\/esm\/components\/(.+?)(?:\/[^/]+\.d\.ts)?$/,
    );

    if (!match) {
      continue;
    }

    const parts = match[1].replace(/\.d\.ts$/, "").split("/");

    for (let index = parts.length; index > 0; index -= 1) {
      candidateDirs.add(`src/components/${parts.slice(0, index).join("/")}`);
    }
  }

  for (const dir of candidateDirs) {
    const readmePath = `${dir}/README.md`;

    if (upstreamPaths.has(readmePath)) {
      return readmePath;
    }
  }

  return null;
}

function parseComponentReadme(markdown) {
  const cleanedMarkdown = stripMarkdownNoise(markdown);
  const purpose = extractPurpose(cleanedMarkdown);

  return {
    ...(purpose ? { purpose } : {}),
    usage: extractUsage(cleanedMarkdown),
    propDescriptions: extractPropDescriptions(cleanedMarkdown),
  };
}

function stripMarkdownNoise(markdown) {
  return markdown
    .replace(/<!--SANDBOX[\s\S]*?SANDBOX-->/g, "")
    .replace(/<!--GITHUB_BLOCK-->[\s\S]*?<!--\/GITHUB_BLOCK-->/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>\n]+>/g, "")
    .replace(/\r\n/g, "\n");
}

function extractPurpose(markdown) {
  const beforeSections = markdown.split(/\n#{2,3}\s+/)[0];
  const paragraph = beforeSections
    .split(/\n{2,}/)
    .map(cleanMarkdownText)
    .find((item) => isUsefulDescription(item));

  return paragraph ? truncateSentence(paragraph, 220) : undefined;
}

function extractUsage(markdown) {
  const sections = [];
  const matches = [
    ...markdown.matchAll(
      /(?:^|\n)#{2,3}\s+(.+?)\n([\s\S]*?)(?=\n#{2,3}\s+|\n## Properties|\n## CSS API|$)/g,
    ),
  ];

  for (const match of matches) {
    const title = cleanMarkdownText(match[1]);
    const body = match[2];
    const bodyItems = body
      .split(/\n{2,}/)
      .map(cleanMarkdownText)
      .filter(isUsefulDescription)
      .slice(0, 3);

    if (bodyItems.length > 0) {
      sections.push(
        truncateSentence(`${title}: ${bodyItems.join(" ")}`, 320),
      );
    }
  }

  return sections.slice(0, 8);
}

function extractPropDescriptions(markdown) {
  const tableMatch = markdown.match(/## Properties[\s\S]*?(\|[^\n]+\|\n\|[ :|\-]+\|\n(?:\|[^\n]+\|\n?)+)/);

  if (!tableMatch) {
    return {};
  }

  const rows = tableMatch[1]
    .trim()
    .split("\n")
    .slice(2);
  const descriptions = {};

  for (const row of rows) {
    const cells = splitMarkdownTableRow(row);

    if (cells.length < 2) {
      continue;
    }

    const name = cleanMarkdownText(cells[0]).replace(/^`|`$/g, "");
    const description = truncateSentence(cleanMarkdownText(cells[1]), 180);

    if (name && description) {
      descriptions[name] = description;
    }
  }

  return descriptions;
}

function splitMarkdownTableRow(row) {
  return row
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function cleanMarkdownText(value) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isUsefulDescription(value) {
  return (
    value.length >= 24 &&
    !value.startsWith("import ") &&
    !value.startsWith("|") &&
    !value.includes("export default function")
  );
}

function truncateSentence(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trim()}...`;
}

function formatExecError(error) {
  if (!error || typeof error !== "object") {
    return "";
  }

  return error.stderr ? String(error.stderr).trim() : "";
}

function formatGeneratedCapabilitiesFile(capabilities) {
  return [
    "// Generated by scripts/generate-gravity-capabilities.mjs. Do not edit directly.",
    "",
    `export const GRAVITY_UIKIT_VERSION = ${JSON.stringify(capabilities.version)} as const;`,
    "",
    formatConstArray("GRAVITY_UI_BUTTON_VIEWS", capabilities.buttonViews),
    "export type GravityUiButtonView = (typeof GRAVITY_UI_BUTTON_VIEWS)[number];",
    "",
    formatConstArray("GRAVITY_UI_TEXT_VARIANTS", capabilities.textVariants),
    "export type GravityUiTextVariant = (typeof GRAVITY_UI_TEXT_VARIANTS)[number];",
    "",
    formatConstArray("GRAVITY_UI_TEXT_COLORS", capabilities.textColors),
    "export type GravityUiTextColor = (typeof GRAVITY_UI_TEXT_COLORS)[number];",
    "",
    formatConstArray(
      "GRAVITY_UI_CARD_CONTAINER_VIEWS",
      capabilities.cardContainerViews,
    ),
    "export type GravityUiCardContainerView = (typeof GRAVITY_UI_CARD_CONTAINER_VIEWS)[number];",
    "",
    formatConstArray("GRAVITY_UI_CARD_THEMES", capabilities.cardThemes),
    "export type GravityUiCardTheme = (typeof GRAVITY_UI_CARD_THEMES)[number];",
    "",
  ].join("\n");
}

function formatGeneratedComponentCatalogFile({ components, version }) {
  return [
    "// Generated by scripts/generate-gravity-capabilities.mjs. Do not edit directly.",
    "",
    "export type GravityUiComponentPropKind =",
    '  | "array"',
    '  | "boolean"',
    '  | "enum"',
    '  | "function"',
    '  | "node"',
    '  | "number"',
    '  | "object"',
    '  | "string"',
    '  | "unknown";',
    "",
    "export type GravityUiComponentProp = {",
    "  readonly name: string;",
    "  readonly required: boolean;",
    "  readonly kind: GravityUiComponentPropKind;",
    "  readonly type: string;",
    "  readonly source: string;",
    "  readonly values?: readonly (string | number | boolean)[];",
    "  readonly deprecated?: true;",
    "};",
    "",
    "export type GravityUiComponentCatalogItem = {",
    "  readonly name: string;",
    "  readonly importPath: \"@gravity-ui/uikit\";",
    "  readonly docsPath?: string;",
    "  readonly docsUrl?: string;",
    "  readonly purpose?: string;",
    "  readonly usage?: readonly string[];",
    "  readonly propDescriptions?: Readonly<Record<string, string>>;",
    "  readonly props: readonly GravityUiComponentProp[];",
    "};",
    "",
    `export const GRAVITY_UI_COMPONENT_CATALOG_VERSION = ${JSON.stringify(version)} as const;`,
    "",
    "export const GRAVITY_UI_COMPONENT_CATALOG = [",
    ...components.map(formatComponentCatalogItem),
    "] as const satisfies readonly GravityUiComponentCatalogItem[];",
    "",
    "export const GRAVITY_UI_COMPONENT_NAMES = GRAVITY_UI_COMPONENT_CATALOG.map(",
    "  (component) => component.name,",
    ");",
    "",
  ].join("\n");
}

function formatComponentCatalogItem(component) {
  return [
    "  {",
    `    name: ${JSON.stringify(component.name)},`,
    '    importPath: "@gravity-ui/uikit",',
    ...formatOptionalStringProperty("docsPath", component.docsPath),
    ...formatOptionalStringProperty("docsUrl", component.docsUrl),
    ...formatOptionalStringProperty("purpose", component.purpose),
    ...formatOptionalArrayProperty("usage", component.usage),
    ...formatOptionalRecordProperty(
      "propDescriptions",
      component.propDescriptions,
    ),
    "    props: [",
    ...component.props.map(formatComponentProp),
    "    ],",
    "  },",
  ].join("\n");
}

function formatOptionalStringProperty(name, value) {
  return value ? [`    ${name}: ${JSON.stringify(value)},`] : [];
}

function formatOptionalArrayProperty(name, values) {
  if (!values || values.length === 0) {
    return [];
  }

  return [`    ${name}: ${JSON.stringify(values)},`];
}

function formatOptionalRecordProperty(name, record) {
  if (!record || Object.keys(record).length === 0) {
    return [];
  }

  return [`    ${name}: ${JSON.stringify(record)},`];
}

function formatComponentProp(prop) {
  const lines = [
    "      {",
    `        name: ${JSON.stringify(prop.name)},`,
    `        required: ${prop.required},`,
    `        kind: ${JSON.stringify(prop.kind)},`,
    `        type: ${JSON.stringify(prop.type)},`,
    `        source: ${JSON.stringify(prop.source)},`,
  ];

  if (prop.values) {
    lines.push(`        values: ${JSON.stringify(prop.values)},`);
  }

  if (prop.deprecated) {
    lines.push("        deprecated: true,");
  }

  lines.push("      },");

  return lines.join("\n");
}

function formatConstArray(name, values) {
  return [
    `export const ${name} = [`,
    ...values.map((value) => `  ${JSON.stringify(value)},`),
    "] as const;",
  ].join("\n");
}

function relativePath(path) {
  return relative(projectRoot, path);
}
