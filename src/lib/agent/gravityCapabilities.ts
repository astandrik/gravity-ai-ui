export const ALLOWED_GRAVITY_ICONS = [
  "arrowRight",
  "bell",
  "check",
  "clock",
  "cloud",
  "code",
  "copy",
  "database",
  "folder",
  "gear",
  "home",
  "info",
  "list",
  "person",
  "plus",
  "rocket",
  "search",
  "shield",
  "warning",
] as const;

export type GravityIconName = (typeof ALLOWED_GRAVITY_ICONS)[number];
