import {
  ArrowRotateRight,
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
import { normalizeGravityIconName } from "@/lib/agent/gravityCapabilities";

export const gravityIconDataByName = {
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
  refresh: ArrowRotateRight,
  rocket: Rocket,
  search: Magnifier,
  shield: Shield,
  warning: TriangleExclamation,
} as const;

export type GravityIconDataName = keyof typeof gravityIconDataByName;

export const gravityIconNames = Object.keys(gravityIconDataByName) as [
  GravityIconDataName,
  ...GravityIconDataName[],
];

export function getGravityIconData(name: unknown) {
  const normalizedName = normalizeGravityIconName(name);

  return typeof normalizedName === "string" && hasGravityIcon(normalizedName)
    ? gravityIconDataByName[normalizedName as GravityIconDataName]
    : null;
}

function hasGravityIcon(name: string): name is GravityIconDataName {
  return Object.prototype.hasOwnProperty.call(gravityIconDataByName, name);
}
