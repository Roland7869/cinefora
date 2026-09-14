// Prompt builders that combine the active ingested book section with a
// category-specific instruction and ask the model to return structured JSON.

import type { ExtractionCategory, ExtractionRow, IngestedSource } from "@/types";

function activeText(source: IngestedSource | null): string {
  if (!source) return "";
  return source.text.slice(0, 40_000); // keep the prompt within limits
}

function system(): string {
  return `You are a meticulous film-production extraction specialist for a Book-to-Screen pipeline. You read a passage from a novel and distill it into structured data for screen adaptation. You ALWAYS respond with a single valid JSON array, nothing else — no prose, no markdown fences. Each element is an object with these fields (omit fields that do not apply):
{ "id": string, "name": string, "look": string, "form": string, "size": string, "function": string, "role": string, "traits": string, "details": string }
Prefer to include only the most salient entries. When a field is not applicable, omit it rather than filling with "N/A".`;
}

function build(category: ExtractionCategory, source: IngestedSource | null): string {
  const text = activeText(source);
  const instruction: Record<ExtractionCategory, string> = {
    characters:
      "Extract every CHARACTER mentioned or implied. For each: name, physical LOOK (age, build, distinguishing features), FORM (posture, gait, silhouette), SIZE (height relative to others), ROLE (function within the story/world), PSYCHOLOGICAL PROFILE (traits, motives, emotional state), and DETAILS (key facts). Return a JSON array.",
    assets:
      "Extract every significant ASSET / OBJECT: props, tools, artifacts, technology, clothing, vehicles, weapons, instruments. For each: name, LOOK, FORM, SIZE, FUNCTION (how it is used / its purpose). Return a JSON array.",
    locations:
      "Extract every LOCATION / ENVIRONMENT: places, biomes, interiors, landscapes, atmospheres. For each: name, LOOK (visual mood, palette, lighting), FORM (spatial layout, shape), SIZE/SCALE, FUNCTION (how it is used or operated). Return a JSON array.",
    buildings:
      "Extract every BUILDING / ARCHITECTURE: edifices, structures, habitats, installations. For each: name, LOOK (architectural style, materials), FORM (structural shape), HEIGHT/SIZE, FUNCTION (purpose, occupancy). Return a JSON array.",
    spacecraft:
      "Extract every SPACECRAFT / SPACE STATION / OUTPOST: vessels, habitats, orbital structures, colonies. For each: name, EXTERIOR HULL LOOK, HULL FORM/GEOMETRY, PHYSICAL SCALE/SIZE, MISSION/DEFENSE FUNCTION. Return a JSON array.",
  };

  return `${system()}\n\nProduce the extraction for the following passage.\n\nINSTRUCTION:\n${instruction[category]}\n\nPASSAGE:\n"""${text}"""\n\nReturn ONLY the JSON array.`;
}

export function scriptPrompt(source: IngestedSource | null): string {
  return `${system()}\n\nBreak the passage into a SCREEN SCRIPT: scene headings, action lines, and dialogue formatted in standard screenplay form (SCENE HEADING / ACTION / CHARACTER / DIALOGUE / PARENTHETICAL). Preserve act structure where implied. Return a JSON array of scenes, each:
{ "id": string, "act": number, "sceneHeading": string, "location": string, "characters": string[], "action": string, "dialogue": string[] }
Passage:
"""${activeText(source)}"""
Return ONLY the JSON array.`;
}

export function storyboardPrompt(source: IngestedSource | null): string {
  return `${system()}\n\nCreate a STORYBOARD shot list for adapting the passage. For each shot: shot number, CAMERA ANGLE, MOVEMENT, SUBJECT, VISUAL PROMPT (a vivid image-generation prompt), and DURATION. Return a JSON array:
{ "id": string, "shotNumber": string, "angle": string, "movement": string, "subject": string, "visualPrompt": string, "duration": string }
Passage:
"""${activeText(source)}"""
Return ONLY the JSON array.`;
}

export function extractPrompt(category: ExtractionCategory, source: IngestedSource | null): string {
  return build(category, source);
}

export function parseExtraction(jsonText: string, category: ExtractionCategory): ExtractionRow[] {
  const cleaned = jsonText.replace(/```json\n?|```/gi, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.results) ? parsed.results : [parsed];
    return arr.map((item: Record<string, unknown>, i: number) => ({
      id: String(item.id ?? `${category}-${i}`),
      name: String(item.name ?? item.look ?? item.subject ?? item.title ?? `Entry ${i + 1}`),
      look: item.look ? String(item.look) : undefined,
      form: item.form ? String(item.form) : undefined,
      size: item.size ? String(item.size) : undefined,
      function: item.function ? String(item.function) : undefined,
      role: item.role ? String(item.role) : undefined,
      traits: item.traits ? String(item.traits) : undefined,
      details: item.details ? String(item.details) : undefined,
    }));
  } catch {
    return [];
  }
}

export function sanitizeAiResponse(text: string): string {
  return text.replace(/```json\n?|```/gi, "").trim();
}
