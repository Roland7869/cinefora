// Shared domain types for Cinefora — the Book-to-Screen AI Production Pipeline.

export type EngineKind = "openai" | "anthropic" | "gemini" | "xai" | "groq" | "mistral" | "together" | "local";

export type CloudProvider =
  | "openai"
  | "anthropic"
  | "gemini"
  | "xai"
  | "groq"
  | "mistral"
  | "together";

export type LocalEngine = "lm-studio" | "ollama" | "unsloth" | "llama-cpp";

export interface CloudEngineConfig {
  provider: CloudProvider;
  apiKey: string;
}

export interface LocalEngineConfig {
  kind: LocalEngine;
  baseUrl: string;
  model: string;
  // One-shot health probe used by "Test Connection".
  healthPath: string;
}

export type EngineConfig = {
  cloud: CloudEngineConfig;
  local: LocalEngineConfig[];
};

export interface AppSettings {
  engines: EngineConfig;
  // Markdown files authored inside the app.
  markdownFiles: MarkdownFile[];
}

export interface MarkdownFile {
  id: string;
  title: string;
  path: string;
  content: string;
  updatedAt: string;
}

// Structured extraction output. All extraction pages reduce ingested text into
// rows of this shape so they can render filterable tables + JSON export.
export interface ExtractionRow {
  id: string;
  name: string;
  look?: string;
  form?: string;
  size?: string;
  function?: string;
  role?: string;
  traits?: string;
  details?: string;
  // Page-specific fields used by the production pipeline.
  sceneHeading?: string;
  action?: string;
  dialogue?: string[];
  shotNumber?: string;
  angle?: string;
  movement?: string;
  visualPrompt?: string;
}

export type ExtractionCategory =
  | "characters"
  | "assets"
  | "locations"
  | "buildings"
  | "spacecraft";

export interface PromptLibraryDoc {
  id: string;
  title: string;
  category: "Video Prompt Engines" | "Image Prompt Engines" | "Camera Control" | "Lighting & Physics";
  content: string;
  updatedAt: string;
}

// The active ingested book section available to every page.
export type IngestedSource = {
  text: string;
  label?: string;
};

// Response from a live AI engine.
export interface AiResponse {
  content: string;
  engine: string;
  model: string;
  elapsedMs: number;
  error?: string;
}
