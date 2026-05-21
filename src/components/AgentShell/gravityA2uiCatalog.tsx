"use client";

import { A2uiSurface, createComponentImplementation } from "@a2ui/react/v0_9";
import { Catalog, CommonSchemas, MessageProcessor } from "@a2ui/web_core/v0_9";
import type { A2uiClientAction } from "@a2ui/web_core/v0_9";
import type { SurfaceModel } from "@a2ui/web_core/v0_9";
import { Fragment } from "react";
import type { ReactNode } from "react";
import { z } from "zod";
import {
  Button,
  Card,
  Checkbox,
  RadioGroup,
  Text,
  TextInput,
} from "@/components/GravityUI/GravityUI";
import { GRAVITY_A2UI_CATALOG_ID } from "@/lib/agent/a2uiContract";

export type GravitySurface = SurfaceModel<GravityReactComponent>;
export type GravityActionHandler = (action: A2uiClientAction) => void;

type GravityReactComponent = ReturnType<typeof createComponentImplementation>;
type BuildChild = (id: string, basePath?: string) => ReactNode;

const commonProps = {
  weight: z.number().optional(),
  accessibility: CommonSchemas.AccessibilityAttributes.optional(),
};

const layoutSchema = z.object({
  ...commonProps,
  children: CommonSchemas.ChildList,
  justify: z.enum(["start", "center", "end", "spaceBetween"]).optional(),
  align: z.enum(["start", "center", "end", "stretch"]).optional(),
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
      theme: z.enum(["normal", "info", "success", "warning", "danger"]).optional(),
      view: z.enum(["outlined", "filled", "raised"]).optional(),
    }),
  },
  ({ props, buildChild }) => (
    <Card
      className="a2ui-card"
      theme={mapCardTheme(props.theme)}
      view={props.view ?? "outlined"}
      size="l"
      type="container"
    >
      {buildChild(props.child)}
    </Card>
  ),
);

const TextSurface = createComponentImplementation(
  {
    name: "Text",
    schema: z.object({
      ...commonProps,
      text: CommonSchemas.DynamicString,
      variant: z
        .enum(["h1", "h2", "h3", "h4", "h5", "body", "caption"])
        .optional(),
      color: z
        .enum(["primary", "secondary", "positive", "warning", "danger"])
        .optional(),
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
      variant: z.enum(["primary", "normal", "outlined", "flat"]).optional(),
      action: CommonSchemas.Action.optional(),
      disabled: CommonSchemas.DynamicBoolean.optional(),
    }),
  },
  ({ props, buildChild }) => (
    <Button
      className="a2ui-button"
      disabled={Boolean(props.disabled) || props.isValid === false}
      onClick={props.action}
      size="m"
      view={mapButtonView(props.variant)}
    >
      {props.child ? buildChild(props.child) : props.text}
    </Button>
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
      textFieldType: z
        .enum(["shortText", "number", "email", "tel", "url"])
        .optional(),
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

const ChoicePickerSurface = createComponentImplementation(
  {
    name: "ChoicePicker",
    schema: z.object({
      ...commonProps,
      label: z.string().optional(),
      variant: z.enum(["mutuallyExclusive", "multiple"]).optional(),
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
      axis: z.enum(["horizontal", "vertical"]).optional(),
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
    TextFieldSurface,
    CheckBoxSurface,
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
