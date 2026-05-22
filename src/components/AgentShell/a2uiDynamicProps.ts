import type { ComponentContext } from "@a2ui/web_core/v0_9";
import type { z } from "zod";

export function resolveDynamicProps<T>(props: T, context: ComponentContext): T {
  return resolveDynamicValue(props, context) as T;
}

export function resolveDynamicArray<Item extends z.ZodTypeAny>(
  props: unknown,
  key: string,
  context: ComponentContext,
  schema: z.ZodArray<Item>,
): z.infer<typeof schema> {
  const value = isPlainObject(props) ? props[key] : undefined;
  const parsed = schema.safeParse(resolveDynamicValue(value, context));

  return parsed.success ? parsed.data : [];
}

export function resolveDynamicValue(
  value: unknown,
  context: ComponentContext,
): unknown {
  if (typeof value === "function") {
    return value;
  }

  if (isDynamicBinding(value)) {
    return context.dataContext.resolveDynamicValue(
      value as Parameters<ComponentContext["dataContext"]["resolveDynamicValue"]>[0],
    );
  }

  if (Array.isArray(value)) {
    return value.map((item) => resolveDynamicValue(item, context));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      resolveDynamicValue(item, context),
    ]),
  );
}

function isDynamicBinding(value: unknown): value is { path: string } | { call: string } {
  return (
    isPlainObject(value) &&
    (typeof value.path === "string" || typeof value.call === "string")
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
