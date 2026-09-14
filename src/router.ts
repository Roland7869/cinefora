import type { ReactNode } from "react";

export type Route =
  | "script"
  | "storyboard"
  | "scene-canvas"
  | "character"
  | "assets"
  | "location"
  | "building"
  | "spacecraft"
  | "prompt-library"
  | "settings";

export type LayoutProps = {
  children: ReactNode;
  active: Route;
  onNavigate: (route: Route) => void;
  hasSource: boolean;
  onOpenIngestion: () => void;
};
