import type { ReactNode } from "react";
import {
  Clapperboard,
  Grid3x3,
  Users,
  Package,
  Map,
  Building2,
  Rocket,
  BookOpen,
  Settings,
  PenLine,
  Film,
} from "lucide-react";
import type { Route } from "@/router";

export interface NavItem {
  id: string;
  route: Route;
  label: string;
  icon: ReactNode;
  group: "production" | "extraction" | "library" | "system";
}

export const NAV_ITEMS: NavItem[] = [
  {
    id: "script",
    route: "script",
    label: "Script",
    icon: <PenLine className="h-4 w-4" />,
    group: "production",
  },
  {
    id: "storyboard",
    route: "storyboard",
    label: "Storyboard",
    icon: <Film className="h-4 w-4" />,
    group: "production",
  },
  {
    id: "scene-canvas",
    route: "scene-canvas",
    label: "Scene Canvas",
    icon: <Grid3x3 className="h-4 w-4" />,
    group: "production",
  },
  {
    id: "character",
    route: "character",
    label: "Character Extraction",
    icon: <Users className="h-4 w-4" />,
    group: "extraction",
  },
  {
    id: "assets",
    route: "assets",
    label: "Asset & Object Extraction",
    icon: <Package className="h-4 w-4" />,
    group: "extraction",
  },
  {
    id: "location",
    route: "location",
    label: "Location & Environment Extraction",
    icon: <Map className="h-4 w-4" />,
    group: "extraction",
  },
  {
    id: "building",
    route: "building",
    label: "Building & Architecture Extraction",
    icon: <Building2 className="h-4 w-4" />,
    group: "extraction",
  },
  {
    id: "spacecraft",
    route: "spacecraft",
    label: "Spacecraft, Space Station & Outpost Extraction",
    icon: <Rocket className="h-4 w-4" />,
    group: "extraction",
  },
  {
    id: "prompt-library",
    route: "prompt-library",
    label: "Prompt Library",
    icon: <BookOpen className="h-4 w-4" />,
    group: "library",
  },
  {
    id: "settings",
    route: "settings",
    label: "Settings",
    icon: <Settings className="h-4 w-4" />,
    group: "system",
  },
];

export const GROUP_ORDER = ["production", "extraction", "library", "system"] as const;
export type NavGroup = (typeof GROUP_ORDER)[number];
