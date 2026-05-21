"use client";

import { A2uiSurface, createComponentImplementation } from "@a2ui/react/v0_9";
import { Catalog, CommonSchemas, MessageProcessor } from "@a2ui/web_core/v0_9";
import type { A2uiClientAction } from "@a2ui/web_core/v0_9";
import type { SurfaceModel } from "@a2ui/web_core/v0_9";
import {
  ArrowRight,
  Bell,
  Check,
  CircleInfo,
  Clock,
  Cloud,
  Code,
  Copy,
  Database,
  Folder,
  Gear,
  House,
  ListUl,
  Magnifier,
  Person,
  Plus,
  Rocket,
  Shield,
  TriangleExclamation,
} from "@gravity-ui/icons";
import { ActionBar } from "@gravity-ui/navigation";
import { Fragment } from "react";
import type { ReactNode } from "react";
import { z } from "zod";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  DefinitionList,
  Icon as GravityIcon,
  Label,
  Link,
  Progress,
  RadioGroup,
  Select,
  Slider,
  Switch,
  Table,
  Text,
  TextInput,
  User,
} from "@/components/GravityUI/GravityUI";
import { GRAVITY_A2UI_CATALOG_ID } from "@/lib/agent/a2uiContract";
import {
  GRAVITY_BUTTON_VARIANTS,
  GRAVITY_CARD_PADDING,
  GRAVITY_CARD_VIEWS,
  GRAVITY_CHOICE_PICKER_VARIANTS,
  GRAVITY_DIVIDER_AXES,
  GRAVITY_GAPS,
  GRAVITY_ICON_SIZES,
  GRAVITY_LAYOUT_ALIGN,
  GRAVITY_LAYOUT_JUSTIFY,
  GRAVITY_STATUS_TONES,
  GRAVITY_TABLE_ALIGN,
  GRAVITY_TEXT_COLORS,
  GRAVITY_TEXT_FIELD_TYPES,
  GRAVITY_TEXT_VARIANTS,
  GRAVITY_TONES,
} from "@/lib/agent/gravityCapabilities";

export type GravitySurface = SurfaceModel<GravityReactComponent>;
export type GravityActionHandler = (action: A2uiClientAction) => void;

type GravityReactComponent = ReturnType<typeof createComponentImplementation>;
type BuildChild = (id: string, basePath?: string) => ReactNode;

const iconDataByName = {
  arrowRight: ArrowRight,
  bell: Bell,
  check: Check,
  clock: Clock,
  cloud: Cloud,
  code: Code,
  copy: Copy,
  database: Database,
  folder: Folder,
  gear: Gear,
  home: House,
  info: CircleInfo,
  list: ListUl,
  person: Person,
  plus: Plus,
  rocket: Rocket,
  search: Magnifier,
  shield: Shield,
  warning: TriangleExclamation,
} as const;

type IconName = keyof typeof iconDataByName;

const iconNames = Object.keys(iconDataByName) as [IconName, ...IconName[]];

const commonProps = {
  weight: z.number().optional(),
  accessibility: CommonSchemas.AccessibilityAttributes.optional(),
};

const layoutSchema = z.object({
  ...commonProps,
  children: CommonSchemas.ChildList,
  justify: z.enum(GRAVITY_LAYOUT_JUSTIFY).optional(),
  align: z.enum(GRAVITY_LAYOUT_ALIGN).optional(),
  gap: z.enum(GRAVITY_GAPS).optional(),
});

const toneSchema = z.enum(GRAVITY_TONES);
const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
});
const metricItemSchema = z.object({
  label: z.string(),
  value: z.string(),
  description: z.string().nullable(),
  tone: toneSchema,
  icon: z.enum(iconNames).nullable(),
});
const tableColumnSchema = z.object({
  id: z.string(),
  label: z.string(),
  align: z.enum(GRAVITY_TABLE_ALIGN),
});
const tableRowSchema = z.object({
  cells: z.array(z.string()),
});
const progressItemSchema = z.object({
  label: z.string(),
  value: z.number(),
  text: z.string().nullable(),
  tone: toneSchema,
});
const definitionItemSchema = z.object({
  label: z.string(),
  value: z.string(),
});
const linkItemSchema = z.object({
  label: z.string(),
  href: z.string(),
  description: z.string().nullable(),
});
const userItemSchema = z.object({
  name: z.string(),
  description: z.string().nullable(),
  tone: toneSchema,
});

const Column = createComponentImplementation(
  {
    name: "Column",
    schema: layoutSchema,
  },
  ({ props, buildChild }) => (
    <div
      className="a2ui-column"
      style={{
        flex: props.weight,
        justifyContent: mapJustify(props.justify),
        alignItems: mapAlign(props.align),
        gap: mapGap(props.gap),
      }}
    >
      {renderChildList(props.children, buildChild)}
    </div>
  ),
);

const Row = createComponentImplementation(
  {
    name: "Row",
    schema: layoutSchema,
  },
  ({ props, buildChild }) => (
    <div
      className="a2ui-row"
      style={{
        flex: props.weight,
        justifyContent: mapJustify(props.justify),
        alignItems: mapAlign(props.align),
        gap: mapGap(props.gap),
      }}
    >
      {renderChildList(props.children, buildChild)}
    </div>
  ),
);

const CardSurface = createComponentImplementation(
  {
    name: "Card",
    schema: z.object({
      ...commonProps,
      child: CommonSchemas.ComponentId,
      theme: z.enum(GRAVITY_TONES).optional(),
      view: z.enum(GRAVITY_CARD_VIEWS).optional(),
      padding: z.enum(GRAVITY_CARD_PADDING).optional(),
    }),
  },
  ({ props, buildChild }) => (
    <Card
      className="a2ui-card"
      theme={mapCardTheme(props.theme)}
      view={props.view ?? "filled"}
      size="l"
      type="container"
    >
      <div className={`a2ui-card__body a2ui-card__body_${props.padding ?? "normal"}`}>
        {buildChild(props.child)}
      </div>
    </Card>
  ),
);

const TextSurface = createComponentImplementation(
  {
    name: "Text",
    schema: z.object({
      ...commonProps,
      text: CommonSchemas.DynamicString,
      variant: z.enum(GRAVITY_TEXT_VARIANTS).optional(),
      color: z.enum(GRAVITY_TEXT_COLORS).optional(),
    }),
  },
  ({ props }) => (
    <Text
      as={mapTextElement(props.variant)}
      className="a2ui-text"
      color={mapTextColor(props.color)}
      variant={mapTextVariant(props.variant)}
    >
      {props.text}
    </Text>
  ),
);

const ButtonSurface = createComponentImplementation(
  {
    name: "Button",
    schema: z.object({
      ...commonProps,
      child: CommonSchemas.ComponentId.optional(),
      text: CommonSchemas.DynamicString.optional(),
      icon: z.enum(iconNames).optional(),
      variant: z.enum(GRAVITY_BUTTON_VARIANTS).optional(),
      action: CommonSchemas.Action.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
      loading: CommonSchemas.DynamicBoolean.optional(),
      selected: CommonSchemas.DynamicBoolean.optional(),
    }),
  },
  ({ props, buildChild }) => (
    <Button
      className="a2ui-button"
      disabled={Boolean(props.disabled) || props.isValid === false}
      loading={Boolean(props.loading)}
      onClick={props.action}
      selected={Boolean(props.selected)}
      size="m"
      view={mapButtonView(props.variant)}
    >
      {props.icon ? (
        <GravityIcon data={iconDataByName[props.icon]} size={16} />
      ) : null}
      {props.child ? buildChild(props.child) : props.text}
    </Button>
  ),
);

const IconSurface = createComponentImplementation(
  {
    name: "Icon",
    schema: z.object({
      ...commonProps,
      name: z.enum(iconNames),
      color: z.enum(GRAVITY_TEXT_COLORS).optional(),
      size: z.enum(GRAVITY_ICON_SIZES).optional(),
    }),
  },
  ({ props }) => (
    <GravityIcon
      className={`a2ui-icon a2ui-icon_${props.color ?? "primary"}`}
      data={iconDataByName[props.name]}
      size={mapIconSize(props.size)}
    />
  ),
);

const NavigationBarSurface = createComponentImplementation(
  {
    name: "NavigationBar",
    schema: z.object({
      ...commonProps,
      children: CommonSchemas.ChildList,
    }),
  },
  ({ props, buildChild }) => (
    <ActionBar aria-label="Generated navigation">
      <ActionBar.Section>
        <ActionBar.Group>{renderChildList(props.children, buildChild)}</ActionBar.Group>
      </ActionBar.Section>
    </ActionBar>
  ),
);

const AlertBlockSurface = createComponentImplementation(
  {
    name: "AlertBlock",
    schema: z.object({
      ...commonProps,
      title: z.string(),
      message: z.string(),
      tone: z.enum(GRAVITY_STATUS_TONES),
    }),
  },
  ({ props }) => (
    <Alert
      className="a2ui-alert"
      layout="horizontal"
      message={props.message}
      theme={props.tone}
      title={props.title}
      view="filled"
    />
  ),
);

const MetricGridSurface = createComponentImplementation(
  {
    name: "MetricGrid",
    schema: z.object({
      ...commonProps,
      items: z.array(metricItemSchema),
    }),
  },
  ({ props }) => (
    <div className="a2ui-metric-grid">
      {props.items.map((item) => (
        <Card
          className="a2ui-metric-card"
          key={`${item.label}-${item.value}`}
          size="m"
          theme="normal"
          type="container"
          view="filled"
        >
          <div className="a2ui-metric-card__body">
            <div className="a2ui-metric-card__header">
              <Text variant="caption-2" color="secondary">
                {item.label}
              </Text>
              {item.icon ? (
                <GravityIcon data={iconDataByName[item.icon]} size={14} />
              ) : null}
            </div>
            <Text variant="header-1">{item.value}</Text>
            {item.description ? (
              <Text variant="caption-2" color="secondary">
                {item.description}
              </Text>
            ) : null}
          </div>
        </Card>
      ))}
    </div>
  ),
);

const DataTableSurface = createComponentImplementation(
  {
    name: "DataTable",
    schema: z.object({
      ...commonProps,
      title: z.string(),
      columns: z.array(tableColumnSchema),
      rows: z.array(tableRowSchema),
      emptyMessage: z.string(),
    }),
  },
  ({ props }) => (
    <div className="a2ui-table-block">
      {props.title ? (
        <Text as="h3" variant="subheader-2">
          {props.title}
        </Text>
      ) : null}
      <Table
        className="a2ui-table"
        columns={props.columns.map((column) => ({
          id: column.id,
          name: column.label,
          align: mapTableAlign(column.align),
        }))}
        data={props.rows.map((row, rowIndex) =>
          Object.fromEntries([
            ["_rowId", String(rowIndex)],
            ...props.columns.map((column, columnIndex) => [
              column.id,
              row.cells[columnIndex] ?? "",
            ]),
          ]),
        )}
        edgePadding
        emptyMessage={props.emptyMessage}
        wordWrap
      />
    </div>
  ),
);

const ProgressListSurface = createComponentImplementation(
  {
    name: "ProgressList",
    schema: z.object({
      ...commonProps,
      items: z.array(progressItemSchema),
    }),
  },
  ({ props }) => (
    <div className="a2ui-progress-list">
      {props.items.map((item) => (
        <div className="a2ui-progress-list__item" key={item.label}>
          <div className="a2ui-progress-list__header">
            <Text variant="body-1">{item.label}</Text>
            <Text
              className="a2ui-progress-list__value"
              color={mapProgressTextColor(item.tone)}
              variant="caption-2"
            >
              {item.value}%
            </Text>
          </div>
          {item.text ? (
            <Text
              className="a2ui-progress-list__description"
              color="secondary"
              variant="caption-2"
            >
              {item.text}
            </Text>
          ) : null}
          <Progress
            className="a2ui-progress-list__bar"
            size="s"
            text=""
            theme={mapProgressTheme(item.tone)}
            value={item.value}
          />
        </div>
      ))}
    </div>
  ),
);

const DefinitionListBlockSurface = createComponentImplementation(
  {
    name: "DefinitionListBlock",
    schema: z.object({
      ...commonProps,
      title: z.string(),
      items: z.array(definitionItemSchema),
    }),
  },
  ({ props }) => (
    <div className="a2ui-definition-block">
      {props.title ? (
        <Text as="h3" variant="subheader-2">
          {props.title}
        </Text>
      ) : null}
      <DefinitionList direction="horizontal" responsive>
        {props.items.map((item) => (
          <DefinitionList.Item key={item.label} name={item.label}>
            {item.value}
          </DefinitionList.Item>
        ))}
      </DefinitionList>
    </div>
  ),
);

const LinkListSurface = createComponentImplementation(
  {
    name: "LinkList",
    schema: z.object({
      ...commonProps,
      items: z.array(linkItemSchema),
    }),
  },
  ({ props }) => (
    <div className="a2ui-link-list">
      {props.items.map((item) => (
        <div className="a2ui-link-list__item" key={`${item.href}-${item.label}`}>
          <Link href={item.href} view="primary">
            {item.label}
          </Link>
          {item.description ? (
            <Text variant="caption-2" color="secondary">
              {item.description}
            </Text>
          ) : null}
        </div>
      ))}
    </div>
  ),
);

const UserListSurface = createComponentImplementation(
  {
    name: "UserList",
    schema: z.object({
      ...commonProps,
      items: z.array(userItemSchema),
    }),
  },
  ({ props }) => (
    <div className="a2ui-user-list">
      {props.items.map((item) => (
        <div className="a2ui-user-list__item" key={item.name}>
          <User
            avatar={{ text: createInitials(item.name) }}
            description={item.description}
            name={item.name}
            size="m"
          />
          <Label theme={mapLabelTheme(item.tone)} size="xs">
            {mapToneLabel(item.tone)}
          </Label>
        </div>
      ))}
    </div>
  ),
);

const TextFieldSurface = createComponentImplementation(
  {
    name: "TextField",
    schema: z.object({
      ...commonProps,
      label: z.string().optional(),
      placeholder: z.string().optional(),
      value: CommonSchemas.DynamicString,
      textFieldType: z.enum(GRAVITY_TEXT_FIELD_TYPES).optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
    }),
  },
  ({ props }) => (
    <TextInput
      className="a2ui-text-field"
      disabled={Boolean(props.disabled)}
      error={props.isValid === false}
      errorMessage={props.validationErrors?.[0]}
      label={props.label}
      onUpdate={props.setValue}
      placeholder={props.placeholder}
      size="l"
      type={mapTextFieldType(props.textFieldType)}
      value={props.value ?? ""}
    />
  ),
);

const CheckBoxSurface = createComponentImplementation(
  {
    name: "CheckBox",
    schema: z.object({
      ...commonProps,
      label: z.string(),
      value: CommonSchemas.DynamicBoolean,
      disabled: CommonSchemas.DynamicBoolean.optional(),
    }),
  },
  ({ props }) => (
    <Checkbox
      checked={Boolean(props.value)}
      content={props.label}
      disabled={Boolean(props.disabled)}
      onUpdate={props.setValue}
      size="l"
    />
  ),
);

const SwitchFieldSurface = createComponentImplementation(
  {
    name: "SwitchField",
    schema: z.object({
      ...commonProps,
      label: z.string(),
      value: CommonSchemas.DynamicBoolean,
      disabled: CommonSchemas.DynamicBoolean.optional(),
    }),
  },
  ({ props }) => (
    <Switch
      checked={Boolean(props.value)}
      content={props.label}
      disabled={Boolean(props.disabled)}
      onUpdate={props.setValue}
      size="l"
    />
  ),
);

const SelectFieldSurface = createComponentImplementation(
  {
    name: "SelectField",
    schema: z.object({
      ...commonProps,
      label: z.string(),
      placeholder: z.string().optional(),
      options: z.array(optionSchema),
      value: CommonSchemas.DynamicStringList,
      disabled: CommonSchemas.DynamicBoolean.optional(),
    }),
  },
  ({ props }) => (
    <Select
      className="a2ui-select-field"
      disabled={Boolean(props.disabled)}
      label={props.label}
      onUpdate={props.setValue}
      options={props.options.map((option) => ({
        content: option.label,
        text: option.label,
        value: option.value,
      }))}
      placeholder={props.placeholder}
      size="l"
      value={Array.isArray(props.value) ? props.value : []}
      width="max"
    />
  ),
);

const SliderFieldSurface = createComponentImplementation(
  {
    name: "SliderField",
    schema: z.object({
      ...commonProps,
      label: z.string(),
      value: CommonSchemas.DynamicNumber,
      min: z.number(),
      max: z.number(),
      step: z.number(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
    }),
  },
  ({ props }) => (
    <div className="a2ui-slider-field">
      <div className="a2ui-slider-field__header">
        <Text variant="body-1">{props.label}</Text>
        <Label theme="normal" size="xs">
          {Number(props.value)}
        </Label>
      </div>
      <Slider
        disabled={Boolean(props.disabled)}
        max={props.max}
        min={props.min}
        onUpdate={props.setValue}
        step={props.step}
        value={Number(props.value)}
      />
    </div>
  ),
);

const ChoicePickerSurface = createComponentImplementation(
  {
    name: "ChoicePicker",
    schema: z.object({
      ...commonProps,
      label: z.string().optional(),
      variant: z.enum(GRAVITY_CHOICE_PICKER_VARIANTS).optional(),
      options: z.array(
        z.object({
          label: z.string(),
          value: z.string(),
        }),
      ),
      value: CommonSchemas.DynamicStringList,
    }),
  },
  ({ props }) => {
    const values = Array.isArray(props.value) ? props.value : [];

    if (props.variant === "multiple") {
      return (
        <div className="a2ui-choice-picker">
          {props.label ? (
            <Text variant="body-1" color="secondary">
              {props.label}
            </Text>
          ) : null}
          <div className="a2ui-choice-picker__options">
            {props.options.map((option) => (
              <Checkbox
                checked={values.includes(option.value)}
                content={option.label}
                key={option.value}
                onUpdate={() => props.setValue(toggleValue(values, option.value))}
                size="m"
              />
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="a2ui-choice-picker">
        {props.label ? (
          <Text variant="body-1" color="secondary">
            {props.label}
          </Text>
        ) : null}
        <RadioGroup
          direction="vertical"
          onUpdate={(value) => props.setValue([value])}
          options={props.options.map((option) => ({
            content: option.label,
            value: option.value,
          }))}
          size="m"
          value={values[0] ?? null}
        />
      </div>
    );
  },
);

const DividerSurface = createComponentImplementation(
  {
    name: "Divider",
    schema: z.object({
      ...commonProps,
      axis: z.enum(GRAVITY_DIVIDER_AXES).optional(),
    }),
  },
  ({ props }) => <div className={`a2ui-divider a2ui-divider_${props.axis ?? "horizontal"}`} />,
);

export const gravityA2uiCatalog = new Catalog(
  GRAVITY_A2UI_CATALOG_ID,
  [
    Column,
    Row,
    CardSurface,
    TextSurface,
    ButtonSurface,
    IconSurface,
    NavigationBarSurface,
    AlertBlockSurface,
    MetricGridSurface,
    DataTableSurface,
    ProgressListSurface,
    DefinitionListBlockSurface,
    LinkListSurface,
    UserListSurface,
    TextFieldSurface,
    CheckBoxSurface,
    SwitchFieldSurface,
    SelectFieldSurface,
    SliderFieldSurface,
    ChoicePickerSurface,
    DividerSurface,
  ],
);

export function createGravityA2uiProcessor(actionHandler: GravityActionHandler) {
  return new MessageProcessor([gravityA2uiCatalog], actionHandler);
}

export { A2uiSurface };

function renderChildList(children: unknown, buildChild: BuildChild) {
  if (!Array.isArray(children)) {
    return null;
  }

  return children.map((child, index) => {
    if (typeof child === "string") {
      return <Fragment key={`${child}-${index}`}>{buildChild(child)}</Fragment>;
    }

    if (child && typeof child === "object" && "id" in child) {
      const node = child as { id: string; basePath?: string };

      return (
        <Fragment key={`${node.id}-${index}`}>
          {buildChild(node.id, node.basePath)}
        </Fragment>
      );
    }

    return null;
  });
}

function toggleValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function mapIconSize(value?: string) {
  switch (value) {
    case "s":
      return 14;
    case "l":
      return 20;
    default:
      return 16;
  }
}

function mapJustify(value?: string) {
  switch (value) {
    case "center":
      return "center";
    case "end":
      return "flex-end";
    case "spaceBetween":
      return "space-between";
    default:
      return "flex-start";
  }
}

function mapAlign(value?: string) {
  switch (value) {
    case "start":
      return "flex-start";
    case "center":
      return "center";
    case "end":
      return "flex-end";
    case "stretch":
      return "stretch";
    default:
      return "stretch";
  }
}

function mapGap(value?: string) {
  switch (value) {
    case "compact":
      return "var(--spacing-sm)";
    case "spacious":
      return "var(--spacing-xl)";
    default:
      return "var(--spacing-md)";
  }
}

function mapButtonView(value?: string) {
  switch (value) {
    case "primary":
      return "action";
    case "outlined":
      return "outlined";
    case "flat":
      return "flat";
    default:
      return "normal";
  }
}

function mapCardTheme(value?: string) {
  return value === "danger" ||
    value === "info" ||
    value === "success" ||
    value === "warning"
    ? value
    : "normal";
}

function mapLabelTheme(value?: string) {
  return value === "danger" ||
    value === "info" ||
    value === "success" ||
    value === "warning"
    ? value
    : "normal";
}

function mapProgressTheme(value?: string) {
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

function mapProgressTextColor(value?: string) {
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

function mapTableAlign(value?: string) {
  switch (value) {
    case "center":
      return "center";
    case "end":
      return "end";
    default:
      return "start";
  }
}

function mapToneLabel(value?: string) {
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

function mapTextVariant(value?: string) {
  switch (value) {
    case "h1":
      return "display-1";
    case "h2":
      return "subheader-3";
    case "h3":
    case "h4":
    case "h5":
      return "subheader-2";
    case "caption":
      return "caption-2";
    default:
      return "body-2";
  }
}

function mapTextElement(value?: string) {
  switch (value) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
      return value;
    default:
      return "p";
  }
}

function mapTextColor(value?: string) {
  switch (value) {
    case "secondary":
      return "secondary";
    case "positive":
      return "positive";
    case "warning":
      return "warning";
    case "danger":
      return "danger";
    default:
      return "primary";
  }
}

function mapTextFieldType(value?: string) {
  switch (value) {
    case "number":
    case "email":
    case "tel":
    case "url":
      return value;
    default:
      return "text";
  }
}
