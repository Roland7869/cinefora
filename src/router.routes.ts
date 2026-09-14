// Route path -> Route id mapping. Kept in one place so the sidebar and router
// never drift out of sync.
export const ROUTES = {
  script: "/script",
  storyboard: "/storyboard",
  "scene-canvas": "/scene-canvas",
  character: "/character",
  assets: "/assets",
  location: "/location",
  building: "/building",
  spacecraft: "/spacecraft",
  "prompt-library": "/prompt-library",
  settings: "/settings",
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
