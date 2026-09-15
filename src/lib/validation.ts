// Zod validation schemas for structured AI output.
//
// Every AI response passes through a schema check before touching project
// state. Malformed output is rejected or safely recovered so existing data
// is never corrupted.

import { z } from "zod";

// ── Entity schemas (characters, locations, buildings, assets, spacecraft) ──

export const ExtractionRowSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  name: z.union([z.string(), z.number()]).optional(),
  look: z.union([z.string(), z.number()]).optional(),
  form: z.union([z.string(), z.number()]).optional(),
  size: z.union([z.string(), z.number()]).optional(),
  function: z.union([z.string(), z.number()]).optional(),
  role: z.union([z.string(), z.number()]).optional(),
  traits: z.union([z.string(), z.number()]).optional(),
  details: z.union([z.string(), z.number()]).optional(),
  subject: z.union([z.string(), z.number()]).optional(),
  title: z.union([z.string(), z.number()]).optional(),
  chapter: z.union([z.string(), z.number()]).optional(),
}).passthrough();

export type ValidatedExtractionRow = z.infer<typeof ExtractionRowSchema>;

export const ExtractionArraySchema = z.array(ExtractionRowSchema);

// Wrapper schemas for named-key responses from AI.
const ResultsWrapperSchema = z.object({ results: ExtractionArraySchema });
const LocationsWrapperSchema = z.object({ locations: ExtractionArraySchema });
const BuildingsWrapperSchema = z.object({ buildings: ExtractionArraySchema });
const SpaceConstructsWrapperSchema = z.object({ space_constructs: ExtractionArraySchema });
const AssetsWrapperSchema = z.object({ assets: ExtractionArraySchema });
const CharactersWrapperSchema = z.object({ characters: ExtractionArraySchema });

// ── Script beat schema ────────────────────────────────────────────────────

const DialogueEntrySchema = z.object({
  character: z.union([z.string(), z.number()]).optional(),
  line: z.union([z.string(), z.number()]).optional(),
});

export const ScriptBeatSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  act: z.union([z.string(), z.number()]).optional(),
  sceneHeading: z.union([z.string(), z.number()]).optional(),
  location: z.union([z.string(), z.number()]).optional(),
  time_of_day: z.union([z.string(), z.number()]).optional(),
  beat_purpose: z.union([z.string(), z.number()]).optional(),
  speaking_characters: z.array(z.union([z.string(), z.number()])).optional(),
  action: z.union([z.string(), z.number()]).optional(),
  dialogue: z.array(DialogueEntrySchema).optional(),
});

export type ValidatedScriptBeat = z.infer<typeof ScriptBeatSchema>;

// ── Storyboard beat schema ────────────────────────────────────────────────

export const StoryboardBeatSchema = z.object({
  id: z.union([z.string(), z.number()]).optional(),
  act: z.union([z.string(), z.number()]).optional(),
  sceneHeading: z.union([z.string(), z.number()]).optional(),
  location: z.union([z.string(), z.number()]).optional(),
  time_of_day: z.union([z.string(), z.number()]).optional(),
  primary_focus: z.union([z.string(), z.number()]).optional(),
  shot_scale: z.union([z.string(), z.number()]).optional(),
  camera_movement: z.union([z.string(), z.number()]).optional(),
  panels: z.array(z.union([z.string(), z.number()])).optional(),
  lighting: z.union([z.string(), z.number()]).optional(),
  movement: z.union([z.string(), z.number()]).optional(),
});

export type ValidatedStoryboardBeat = z.infer<typeof StoryboardBeatSchema>;

// ── Extraction result validators ───────────────────────────────────────────

export interface ValidationResult<T> {
  success: boolean;
  items: T[];
  error?: string;
}

export function validateExtractionArray(jsonText: string): ValidationResult<ValidatedExtractionRow> {
  const cleaned = jsonText.replace(/```json\n?|```/gi, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { success: false, items: [], error: "Response is not valid JSON." };
  }

  // Try direct array first.
  const directResult = ExtractionArraySchema.safeParse(parsed);
  if (directResult.success) {
    return { success: true, items: directResult.data };
  }

  // Try named-key wrappers.
  const wrappers = [
    ResultsWrapperSchema,
    LocationsWrapperSchema,
    BuildingsWrapperSchema,
    SpaceConstructsWrapperSchema,
    AssetsWrapperSchema,
    CharactersWrapperSchema,
  ];
  for (const schema of wrappers) {
    const result = schema.safeParse(parsed);
    if (result.success) {
      const data = result.data as Record<string, ValidatedExtractionRow[]>;
      const key = Object.keys(data)[0];
      return { success: true, items: data[key] };
    }
  }

  // If the parsed value is a single object, wrap it.
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    const singleResult = ExtractionRowSchema.safeParse(parsed);
    if (singleResult.success) {
      return { success: true, items: [singleResult.data] };
    }
  }

  return { success: false, items: [], error: "AI response does not match expected schema." };
}

export function validateScriptBeats(jsonText: string): ValidationResult<ValidatedScriptBeat> {
  const cleaned = jsonText.replace(/```json\n?|```/gi, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { success: false, items: [], error: "Response is not valid JSON." };
  }

  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as Record<string, unknown>)?.beats)
      ? (parsed as Record<string, unknown>).beats as unknown[]
      : Array.isArray((parsed as Record<string, unknown>)?.scenes)
        ? (parsed as Record<string, unknown>).scenes as unknown[]
        : [parsed];

  const validated = z.array(ScriptBeatSchema).safeParse(arr);
  if (validated.success) {
    return { success: true, items: validated.data };
  }

  return { success: false, items: [], error: "AI script beat response does not match expected schema." };
}

export function validateStoryboardBeats(jsonText: string): ValidationResult<ValidatedStoryboardBeat> {
  const cleaned = jsonText.replace(/```json\n?|```/gi, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { success: false, items: [], error: "Response is not valid JSON." };
  }

  const arr = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as Record<string, unknown>)?.shots)
      ? (parsed as Record<string, unknown>).shots as unknown[]
      : Array.isArray((parsed as Record<string, unknown>)?.storyboards)
        ? (parsed as Record<string, unknown>).storyboards as unknown[]
        : [parsed];

  const validated = z.array(StoryboardBeatSchema).safeParse(arr);
  if (validated.success) {
    return { success: true, items: validated.data };
  }

  return { success: false, items: [], error: "AI storyboard response does not match expected schema." };
}
