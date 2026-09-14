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
      "You are an expert literary archivist and asset extractor. Analyze the provided text excerpt and extract every significant physical object, artifact, tool, vehicle, or item mentioned. For each identified asset, extract the following specific attributes: 1. Asset Name: The name or common designator of the object. 2. Look: Physical appearance, colors, materials, markings, texture, or state of wear. 3. Form: Shape, structure, geometry, or overall build (e.g., blade-like, spherical, modular). 4. Size: Absolute dimensions, weight, or relative size compared to standard objects/people. 5. Function: Purpose, practical use, supernatural/technological abilities, or operational mechanism. RULES: Extract ONLY facts explicitly stated or strongly implied by the text. Do not invent details. If an attribute (e.g., size) is not mentioned, set its value to \"Not specified\". Output MUST be valid JSON matching the schema below. OUTPUT FORMAT: { \"assets\": [ { \"name\": \"Object Name\", \"look\": \"Detailed appearance description\", \"form\": \"Shape and physical structural build\", \"size\": \"Dimensions or relative scale\", \"function\": \"Primary purpose and operational capabilities\" } ] }",
    locations:
      "You are an expert world-building cartographer and location analyst. Analyze the provided text excerpt and extract every distinct place, venue, geography, or environment mentioned. For each identified location, extract the following specific attributes: 1. Location Name: The proper name or descriptive title of the place. 2. Look: Visual aesthetic, lighting, atmosphere, color palette, architectural style, or decorative elements. 3. Form: Spatial layout, architectural geography, structural arrangement, or terrain type (e.g., multi-tiered cavern, narrow corridor grid, open tundra). 4. Size: Physical dimensions, scale, footprint, or boundary limits (e.g., holds 50 people, spans 10 square miles, cramped room). 5. Function: The operational role or purpose of the location (e.g., military outpost, living quarters, religious shrine, trading portal). RULES: Extract ONLY facts explicitly stated or strongly implied by the text. Do not invent details. If an attribute (e.g., size) is not mentioned, set its value to \"Not specified\". Output MUST be valid JSON matching the schema below. OUTPUT FORMAT: { \"locations\": [ { \"name\": \"Location Name\", \"look\": \"Aesthetic, lighting, and visual attributes\", \"form\": \"Layout, structure, and spatial form\", \"size\": \"Scale, area, or capacity\", \"function\": \"Role, purpose, or activities held here\" } ] }",
    buildings:
      "You are an architectural historian and structural analyst. Analyze the provided text excerpt and extract every distinct building, architectural structure, or constructed edifice mentioned. For each identified building, extract the following specific attributes: 1. Building Name: The proper name, designation, or descriptive title of the building. 2. Look: External and internal aesthetics, building materials (e.g., stone, glass, rusted steel), architectural style, color palette, surface details, or visual condition. 3. Form: Overall shape, geometry, structural design, height, layout, and roof/facade profile (e.g., vaulted dome, rectangular tower, sprawling compound). 4. Size: Dimensions, height, footprint, floor count, or capacity. 5. Function: Primary utility, historical or current operational purpose (e.g., government seat, residential unit, power plant, archive). RULES: Extract ONLY facts explicitly stated or strongly implied by the text. Do not invent details. If an attribute (e.g., size) is not mentioned, set its value to \"Not specified\". Output MUST be valid JSON matching the schema below. OUTPUT FORMAT: { \"buildings\": [ { \"name\": \"Building Name\", \"look\": \"Materials, visual condition, and aesthetic style\", \"form\": \"Overall architectural geometry, shape, and structure\", \"size\": \"Height, scale, floor count, or physical footprint\", \"function\": \"Primary purpose and operational utility\" } ] }",
    spacecraft:
      "You are a naval space system analyst and orbital strategist. Analyze the provided text excerpt and extract every spacecraft, starship, space station, orbital structure, or planetary outpost mentioned. For each identified construct, extract the following specific attributes: 1. Asset Name: The proper vessel name, station callsign, or outpost designation. 2. Look: Exterior hull appearance, finish, color, weathering, visible lights, insignia, and overall visual profile (e.g., metallic silver, biomechanical organic chitin, charred plating). 3. Form: Structural geometry, hull configuration, modular layout, propulsion placement, or docking frame design (e.g., wedge-shaped hull, toroidal spinning ring, clustered dome complex). 4. Size: Physical length/width, tonnage, deck count, crew capacity, or scale classification (e.g., 500-meter corvette, multi-kilometer station). 5. Function: Class, role, mission profile, weapon systems, drive capabilities, or primary operation (e.g., deep-space science vessel, mining outpost, carrier, orbital defense hub). RULES: Extract ONLY facts explicitly stated or strongly implied by the text. Do not invent details. If an attribute (e.g., size) is not mentioned, set its value to \"Not specified\". Output MUST be valid JSON matching the schema below. OUTPUT FORMAT: { \"space_constructs\": [ { \"name\": \"Name/Designation\", \"look\": \"Hull finish, aesthetic, surface details, and visual profile\", \"form\": \"Structural layout, geometry, and physical configuration\", \"size\": \"Scale, dimensions, crew capacity, or tonnage\", \"function\": \"Class, operational mission, armaments, or capabilities\" } ] }",
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
    const arr = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.results)
      ? parsed.results
      : Array.isArray(parsed?.locations)
      ? parsed.locations
      : Array.isArray(parsed?.buildings)
      ? parsed.buildings
      : Array.isArray(parsed?.space_constructs)
      ? parsed.space_constructs
      : Array.isArray(parsed?.assets)
      ? parsed.assets
      : [parsed];
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
