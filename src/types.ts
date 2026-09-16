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

// A single ingested unit retained with provenance so that every extracted
// fact can be traced back to the source it came from.
export interface SourceEntry {
  id: string;
  filename: string;
  relativePath: string;
  title: string;
  content: string;
  chapter?: string;
  section?: string;
  sourceType: "markdown" | "txt" | "manual";
  metadata: Record<string, string>;
}

// An ingested book section. `sources` carries provenance for files/folders;
// `text` is the concatenated content used to drive AI extraction.
export interface IngestedSource {
  text: string;
  label?: string;
  sources?: SourceEntry[];
}

// Response from a live AI engine.
export interface AiResponse {
  content: string;
  engine: string;
  model: string;
  elapsedMs: number;
  error?: string;
}

// How confident the app is that an extracted fact is established. AI output is
// never treated as automatic truth — it starts as "inferred" until a human
// approves it as canonical project data.
export type EvidenceStatus = "confirmed" | "inferred" | "unknown";

export interface EntityEvidence {
  status: EvidenceStatus;
  // Where this fact was taken from, when known.
  sourceId?: string;
  sourceRelativePath?: string;
  sourceTitle?: string;
  chapter?: string;
}

// A reviewable extracted entity. Created by AI as "inferred"; a human can edit
// it and mark it "confirmed" to promote it to canonical project data.
export interface ReviewedEntity {
  id: string;
  name: string;
  look?: string;
  form?: string;
  size?: string;
  function?: string;
  role?: string;
  traits?: string;
  details?: string;
  status: EvidenceStatus;
  notes?: string;
  evidence: EntityEvidence;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptBeat {
  id: string;
  act: string;
  sceneHeading: string;
  location: string;
  timeOfDay: string;
  beatPurpose: string;
  speakingCharacters: string[];
  action: string;
  dialogue: { character: string; line: string }[];
  sourceId?: string;
  sourceRelativePath?: string;
  status: "confirmed" | "inferred" | "unknown";
  evidence: {
    sourceId?: string;
    sourceRelativePath?: string;
    sourceTitle?: string;
    chapter?: string;
  };
  // Beat-to-beat continuity
  previousBeatId?: string;
  continuityState?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoryboardBeat {
  id: string;
  act: string;
  sceneHeading: string;
  location: string;
  timeOfDay: string;
  primaryFocus: string;
  shotScale: string;
  cameraMovement: string;
  panels: string[];
  lighting: string;
  movement: string;
  sourceId?: string;
  sourceRelativePath?: string;
  status: "confirmed" | "inferred" | "unknown";
  evidence: {
    sourceId?: string;
    sourceRelativePath?: string;
    sourceTitle?: string;
    chapter?: string;
  };
  // Beat-to-beat continuity
  previousBeatId?: string;
  continuityState?: string;
  createdAt: string;
  updatedAt: string;
}

// Scene canvas actor for spatial blocking.
export interface CanvasActor {
  id: string;
  name: string;
  type: "character" | "object";
  x: number;
  y: number;
  color: string;
}

// Persisted scene canvas state.
export interface SceneCanvas {
  id: string;
  name: string;
  actors: CanvasActor[];
  generatedOutput: string;
  seedSourceId?: string;
  createdAt: string;
  updatedAt: string;
}

// Extraction types
export type ExtractionCategory = "characters" | "assets" | "locations" | "buildings" | "spacecraft";

export interface ExtractionRow {
  id?: string;
  name?: string;
  look?: string;
  form?: string;
  size?: string;
  function?: string;
  role?: string;
  traits?: string;
  details?: string;
}

// Uploaded character reference files (plain text / Markdown).
export interface CharacterFile {
  id: string;
  name: string;
  content: string;
  uploadedAt: string;
}

// Prompt library
export interface PromptLibraryDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  updatedAt: string;
}
