import { describe, expect, it } from "vitest";
import {
  GRAVITY_UI_COMPONENT_CATALOG,
  GRAVITY_UI_COMPONENT_CATALOG_VERSION,
} from "./generatedGravityComponentCatalog";
import { formatGravityComponentCatalogForPrompt } from "./gravityComponentCatalog";
import {
  GRAVITY_UI_BUTTON_VIEWS,
  GRAVITY_UI_CARD_CONTAINER_VIEWS,
  GRAVITY_UI_CARD_THEMES,
  GRAVITY_UIKIT_VERSION,
  GRAVITY_UI_TEXT_COLORS,
  GRAVITY_UI_TEXT_VARIANTS,
} from "./generatedGravityCapabilities";
import {
  GRAVITY_BUTTON_VARIANTS,
  GRAVITY_CARD_VIEWS,
  GRAVITY_TEXT_COLOR_BY_ALIAS,
  GRAVITY_TEXT_VARIANT_BY_ALIAS,
  GRAVITY_TONES,
  mapGravityButtonVariantToView,
} from "./gravityCapabilities";

describe("Gravity UI capability sync", () => {
  it("keeps generated capability files on the same Gravity UI version", () => {
    expect(GRAVITY_UI_COMPONENT_CATALOG_VERSION).toBe(GRAVITY_UIKIT_VERSION);
  });

  it("maps every curated button variant to a valid Gravity UI button view", () => {
    const rawViews = new Set<string>(GRAVITY_UI_BUTTON_VIEWS);

    expect(GRAVITY_BUTTON_VARIANTS).not.toContain("action");
    expect(mapGravityButtonVariantToView("primary")).toBe("action");

    for (const variant of GRAVITY_BUTTON_VARIANTS) {
      expect(rawViews.has(mapGravityButtonVariantToView(variant))).toBe(true);
    }

    expect(
      GRAVITY_BUTTON_VARIANTS.filter(
        (variant) => mapGravityButtonVariantToView(variant) === "action",
      ),
    ).toEqual(["primary"]);
  });

  it("keeps curated card values valid for Gravity UI container cards", () => {
    const rawContainerViews = new Set<string>(
      GRAVITY_UI_CARD_CONTAINER_VIEWS,
    );
    const rawThemes = new Set<string>(GRAVITY_UI_CARD_THEMES);

    for (const view of GRAVITY_CARD_VIEWS) {
      expect(rawContainerViews.has(view)).toBe(true);
    }

    for (const theme of GRAVITY_TONES) {
      expect(rawThemes.has(theme)).toBe(true);
    }
  });

  it("keeps mapped text variants and colors valid for Gravity UI Text", () => {
    const rawVariants = new Set<string>(GRAVITY_UI_TEXT_VARIANTS);
    const rawColors = new Set<string>(GRAVITY_UI_TEXT_COLORS);

    for (const variant of Object.values(GRAVITY_TEXT_VARIANT_BY_ALIAS)) {
      expect(rawVariants.has(variant)).toBe(true);
    }

    for (const color of Object.values(GRAVITY_TEXT_COLOR_BY_ALIAS)) {
      expect(rawColors.has(color)).toBe(true);
    }
  });

  it("generates a Gravity UI component prop catalog for agent context", () => {
    expect(GRAVITY_UI_COMPONENT_CATALOG.length).toBeGreaterThan(50);

    const alert = GRAVITY_UI_COMPONENT_CATALOG.find(
      (component) => component.name === "Alert",
    );
    const button = GRAVITY_UI_COMPONENT_CATALOG.find(
      (component) => component.name === "Button",
    );
    const card = GRAVITY_UI_COMPONENT_CATALOG.find(
      (component) => component.name === "Card",
    );
    const text = GRAVITY_UI_COMPONENT_CATALOG.find(
      (component) => component.name === "Text",
    );

    expect(alert?.docsPath).toBe("src/components/Alert/README.md");
    expect(alert?.docsUrl).toBe(
      "https://github.com/gravity-ui/uikit/blob/v7.39.0/src/components/Alert/README.md",
    );
    expect(alert?.propDescriptions?.theme).toBe("Alert appearance");
    expect(button?.docsPath).toBe("src/components/Button/README.md");
    expect(button?.docsUrl).toBe(
      "https://github.com/gravity-ui/uikit/blob/v7.39.0/src/components/Button/README.md",
    );
    expect(button?.purpose).toContain("trigger for certain actions");
    expect(button?.usage?.join(" ")).toContain("primary action");
    expect(button?.propDescriptions?.view).toContain("appearance");
    expect(button?.propDescriptions?.size).toContain("size");
    expect(card?.docsPath).toBe("src/components/Card/README.md");
    expect(card?.usage?.join(" ")).toContain("card-like container");
    expect(text?.docsPath).toBe("src/components/Text/README.md");
    expect(text?.propDescriptions?.variant).toBe("Text font");
    expect(
      new Set(button?.props.find((prop) => prop.name === "view")?.values),
    ).toEqual(new Set(GRAVITY_UI_BUTTON_VIEWS));
    expect(text?.props.find((prop) => prop.name === "variant")?.values).toEqual(
      expect.arrayContaining(["inherit", ...GRAVITY_UI_TEXT_VARIANTS]),
    );
    expect(text?.props.find((prop) => prop.name === "color")?.values).toEqual(
      expect.arrayContaining([...GRAVITY_UI_TEXT_COLORS]),
    );
  });

  it("formats the generated component catalog for the agent prompt", () => {
    const promptCatalog = formatGravityComponentCatalogForPrompt();
    const guideIndex = promptCatalog.indexOf("Component choice guide:");
    const technicalIndex = promptCatalog.indexOf("Technical props/settings");

    expect(promptCatalog).toContain("Generated Gravity UI component catalog");
    expect(guideIndex).toBeGreaterThan(-1);
    expect(technicalIndex).toBeGreaterThan(-1);
    expect(guideIndex).toBeLessThan(technicalIndex);
    expect(promptCatalog).toContain("Button: Buttons act as a trigger");
    expect(promptCatalog).toContain("primary action");
    expect(promptCatalog).toContain("Button(");
    expect(promptCatalog).toContain("view?: [action|normal|outlined");
    expect(promptCatalog).toContain("Text(");
    expect(promptCatalog).toContain("variant?: [inherit|display-4");
    expect(promptCatalog).toContain("Card(");
    expect(promptCatalog).toContain(GRAVITY_UI_CARD_THEMES.join("|"));
  });
});
