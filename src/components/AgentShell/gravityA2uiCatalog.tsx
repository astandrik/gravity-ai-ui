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
import { Fragment, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { z } from "zod";
import {
  Accordion,
  Alert,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  CopyToClipboard,
  DefinitionList,
  Icon as GravityIcon,
  Label,
  Link,
  PlaceholderContainer,
  Progress,
  RadioGroup,
  Select,
  Slider,
  Spin,
  Stepper,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabProvider,
  Table,
  Text,
  TextInput,
  User,
} from "@/components/GravityUI/GravityUI";
import { GRAVITY_A2UI_CATALOG_ID } from "@/lib/agent/a2uiContract";
import {
  GRAVITY_ACCORDION_ARROW_POSITIONS,
  GRAVITY_ACCORDION_SIZES,
  GRAVITY_ACCORDION_VIEWS,
  GRAVITY_BUTTON_VARIANTS,
  GRAVITY_CARD_PADDING,
  GRAVITY_CARD_VIEWS,
  GRAVITY_CHOICE_PICKER_VARIANTS,
  GRAVITY_DIVIDER_AXES,
  GRAVITY_EMPTY_STATE_SIZES,
  GRAVITY_GAPS,
  GRAVITY_ICON_SIZES,
  GRAVITY_LAYOUT_ALIGN,
  GRAVITY_LAYOUT_JUSTIFY,
  GRAVITY_LABEL_TYPES,
  GRAVITY_LOADING_SIZES,
  GRAVITY_STATUS_TONES,
  GRAVITY_STEPPER_SIZES,
  GRAVITY_STEPPER_VIEWS,
  GRAVITY_TABLE_ALIGN,
  GRAVITY_TAB_SIZES,
  GRAVITY_TEXT_COLORS,
  GRAVITY_TEXT_FIELD_TYPES,
  GRAVITY_TEXT_VARIANTS,
  GRAVITY_TONES,
  mapGravityButtonVariantToView,
  mapGravityTextColor,
  mapGravityTextVariant,
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
const labelItemSchema = z.object({
  label: z.string(),
  value: z.string().nullable(),
  tone: toneSchema,
  type: z.enum(GRAVITY_LABEL_TYPES),
});
const tabItemSchema = z.object({
  label: z.string(),
  value: z.string(),
  body: z.string(),
  counter: z.string().nullable(),
  tone: toneSchema,
  active: z.boolean(),
});
const emptyStateItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.enum(iconNames).nullable(),
  tone: toneSchema,
  size: z.enum(GRAVITY_EMPTY_STATE_SIZES),
});
const loadingStateItemSchema = z.object({
  label: z.string(),
  description: z.string().nullable(),
  size: z.enum(GRAVITY_LOADING_SIZES),
});
const breadcrumbItemSchema = z.object({
  label: z.string(),
  href: z.string().nullable(),
});
const stepperItemSchema = z.object({
  label: z.string(),
  value: z.string(),
  view: z.enum(GRAVITY_STEPPER_VIEWS),
  disabled: z.boolean(),
  active: z.boolean(),
});
const accordionItemSchema = z.object({
  title: z.string(),
  body: z.string(),
  expanded: z.boolean(),
  disabled: z.boolean(),
});
const copyListItemSchema = z.object({
  label: z.string(),
  value: z.string(),
  copyText: z.string(),
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

const LabelGroupSurface = createComponentImplementation(
  {
    name: "LabelGroup",
    schema: z.object({
      ...commonProps,
      items: z.array(labelItemSchema),
    }),
  },
  ({ props }) => (
    <div className="a2ui-label-group">
      {props.items.map((item) => (
        <Label
          copyText={item.type === "copy" ? item.value ?? item.label : undefined}
          key={`${item.label}-${item.value ?? ""}`}
          size="s"
          theme={mapLabelTheme(item.tone)}
          type={item.type}
          value={item.value ?? undefined}
        >
          {item.label}
        </Label>
      ))}
    </div>
  ),
);

const TabsBlockSurface = createComponentImplementation(
  {
    name: "TabsBlock",
    schema: z.object({
      ...commonProps,
      title: z.string(),
      size: z.enum(GRAVITY_TAB_SIZES),
      items: z.array(tabItemSchema),
    }),
  },
  ({ props }) => (
    <TabsBlockRenderer
      items={props.items}
      size={props.size}
      title={props.title}
    />
  ),
);

const EmptyStateListSurface = createComponentImplementation(
  {
    name: "EmptyStateList",
    schema: z.object({
      ...commonProps,
      items: z.array(emptyStateItemSchema),
    }),
  },
  ({ props }) => (
    <div className="a2ui-empty-state-list">
      {props.items.map((item) => (
        <PlaceholderContainer
          align="center"
          className="a2ui-empty-state"
          description={item.description}
          direction="column"
          image={
            <GravityIcon
              className={`a2ui-icon a2ui-icon_${mapToneIconColor(item.tone)}`}
              data={iconDataByName[item.icon ?? "info"]}
              size={mapEmptyStateIconSize(item.size)}
            />
          }
          key={`${item.title}-${item.description}`}
          size={item.size}
          title={item.title}
        />
      ))}
    </div>
  ),
);

const LoadingStateListSurface = createComponentImplementation(
  {
    name: "LoadingStateList",
    schema: z.object({
      ...commonProps,
      items: z.array(loadingStateItemSchema),
    }),
  },
  ({ props }) => (
    <div className="a2ui-loading-state-list">
      {props.items.map((item) => (
        <div className="a2ui-loading-state-list__item" key={item.label}>
          <Spin size={item.size} />
          <div className="a2ui-loading-state-list__copy">
            <Text variant="body-1">{item.label}</Text>
            {item.description ? (
              <Text color="secondary" variant="caption-2">
                {item.description}
              </Text>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  ),
);

const BreadcrumbTrailSurface = createComponentImplementation(
  {
    name: "BreadcrumbTrail",
    schema: z.object({
      ...commonProps,
      title: z.string(),
      showRoot: z.boolean(),
      items: z.array(breadcrumbItemSchema),
    }),
  },
  ({ props }) => (
    <div className="a2ui-breadcrumb-trail">
      {props.title ? (
        <Text as="h3" variant="subheader-2">
          {props.title}
        </Text>
      ) : null}
      <Breadcrumbs showRoot={props.showRoot}>
        {props.items.map((item, index) => (
          <Breadcrumbs.Item
            href={item.href ?? undefined}
            key={`${item.label}-${index}`}
          >
            {item.label}
          </Breadcrumbs.Item>
        ))}
      </Breadcrumbs>
    </div>
  ),
);

const StepperBlockSurface = createComponentImplementation(
  {
    name: "StepperBlock",
    schema: z.object({
      ...commonProps,
      title: z.string(),
      size: z.enum(GRAVITY_STEPPER_SIZES),
      items: z.array(stepperItemSchema),
    }),
  },
  ({ props }) => (
    <StepperBlockRenderer
      items={props.items}
      size={props.size}
      title={props.title}
    />
  ),
);

const AccordionBlockSurface = createComponentImplementation(
  {
    name: "AccordionBlock",
    schema: z.object({
      ...commonProps,
      title: z.string(),
      size: z.enum(GRAVITY_ACCORDION_SIZES),
      view: z.enum(GRAVITY_ACCORDION_VIEWS),
      arrowPosition: z.enum(GRAVITY_ACCORDION_ARROW_POSITIONS),
      items: z.array(accordionItemSchema),
    }),
  },
  ({ props }) => (
    <div className="a2ui-accordion-block">
      {props.title ? (
        <Text as="h3" variant="subheader-2">
          {props.title}
        </Text>
      ) : null}
      <Accordion
        arrowPosition={props.arrowPosition}
        defaultValue={props.items
          .filter((item) => item.expanded)
          .map((item, index) => `${index}_${item.title}`)}
        multiple
        size={props.size}
        view={props.view}
      >
        {props.items.map((item, index) => (
          <Accordion.Item
            disabled={item.disabled}
            key={`${item.title}-${index}`}
            summary={item.title}
            value={`${index}_${item.title}`}
          >
            <Text color="secondary" variant="body-2">
              {item.body}
            </Text>
          </Accordion.Item>
        ))}
      </Accordion>
    </div>
  ),
);

const CopyListSurface = createComponentImplementation(
  {
    name: "CopyList",
    schema: z.object({
      ...commonProps,
      title: z.string(),
      items: z.array(copyListItemSchema),
    }),
  },
  ({ props }) => (
    <div className="a2ui-copy-list">
      {props.title ? (
        <Text as="h3" variant="subheader-2">
          {props.title}
        </Text>
      ) : null}
      {props.items.map((item) => (
        <div className="a2ui-copy-list__item" key={`${item.label}-${item.value}`}>
          <div className="a2ui-copy-list__copy">
            <Text color="secondary" variant="caption-2">
              {item.label}
            </Text>
            <Text variant="body-1">{item.value}</Text>
          </div>
          <CopyToClipboard text={item.copyText} timeout={1200}>
            {(status) => (
              <Button size="s" view="flat-secondary">
                <GravityIcon data={Copy} size={14} />
                {status === "success" ? "Copied" : "Copy"}
              </Button>
            )}
          </CopyToClipboard>
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
    LabelGroupSurface,
    TabsBlockSurface,
    EmptyStateListSurface,
    LoadingStateListSurface,
    BreadcrumbTrailSurface,
    StepperBlockSurface,
    AccordionBlockSurface,
    CopyListSurface,
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

type TabsBlockItem = z.infer<typeof tabItemSchema>;
type StepperBlockItem = z.infer<typeof stepperItemSchema>;

function TabsBlockRenderer({
  items,
  size,
  title,
}: {
  items: TabsBlockItem[];
  size: (typeof GRAVITY_TAB_SIZES)[number];
  title: string;
}) {
  const defaultValue = useMemo(
    () => items.find((item) => item.active)?.value ?? items[0]?.value ?? "",
    [items],
  );
  const [value, setValue] = useState(defaultValue);
  const currentValue = items.some((item) => item.value === value)
    ? value
    : defaultValue;

  return (
    <div className="a2ui-tabs-block">
      {title ? (
        <Text as="h3" variant="subheader-2">
          {title}
        </Text>
      ) : null}
      <TabProvider value={currentValue} onUpdate={setValue}>
        <TabList size={size}>
          {items.map((item) => (
            <Tab
              counter={item.counter ?? undefined}
              key={item.value}
              label={
                item.tone === "normal"
                  ? undefined
                  : {
                      content: mapToneLabel(item.tone),
                      theme: mapLabelTheme(item.tone),
                    }
              }
              value={item.value}
            >
              {item.label}
            </Tab>
          ))}
        </TabList>
        {items.map((item) => (
          <TabPanel key={item.value} value={item.value}>
            <Text color="secondary" variant="body-2">
              {item.body}
            </Text>
          </TabPanel>
        ))}
      </TabProvider>
    </div>
  );
}

function StepperBlockRenderer({
  items,
  size,
  title,
}: {
  items: StepperBlockItem[];
  size: (typeof GRAVITY_STEPPER_SIZES)[number];
  title: string;
}) {
  const defaultValue = useMemo(
    () => items.find((item) => item.active)?.value ?? items[0]?.value ?? "",
    [items],
  );
  const [value, setValue] = useState(defaultValue);
  const currentValue = items.some((item) => item.value === value)
    ? value
    : defaultValue;

  return (
    <div className="a2ui-stepper-block">
      {title ? (
        <Text as="h3" variant="subheader-2">
          {title}
        </Text>
      ) : null}
      <Stepper
        onUpdate={(nextValue) => setValue(String(nextValue ?? currentValue))}
        size={size}
        value={currentValue}
      >
        {items.map((item) => (
          <Stepper.Item
            disabled={item.disabled}
            id={item.value}
            key={item.value}
            view={item.view}
          >
            {item.label}
          </Stepper.Item>
        ))}
      </Stepper>
    </div>
  );
}

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
  return mapGravityButtonVariantToView(value);
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

function mapToneIconColor(value?: string) {
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

function mapEmptyStateIconSize(value?: string) {
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
  return mapGravityTextVariant(value);
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
  return mapGravityTextColor(value);
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
