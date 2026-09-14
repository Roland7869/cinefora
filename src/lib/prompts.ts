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
      "You are a Character Designer, Casting Director, AI Visual Consistency Specialist, and Character Sheet Prompter. Extract every character present or introduced in the chapter text into a production-ready character reference system. Build master character specifications, physical traits, expression sheets, multi-angle descriptions, pose references, Z-Image Turbo prompts, and 4-panel master reference sheet prompts to ensure 100% visual consistency across 15-second visual beats. Scope: Include all primary, secondary, and newly introduced background characters/entities (e.g., specific aliens, robots, guards). Naming Standard: Use ONE primary canonical name per character throughout the system. Unnamed entities in the prose (e.g., 'the Brute officer') MUST be assigned a specific name or clear identifier. Original Appearance & Celebrity Avoidance: All generated physical descriptions and visual prompts MUST depict unique, original character features. Prompts must explicitly avoid using famous actor names or likenesses to prevent celebrity resemblance. Format: Render positive-only visual prompts (80-250 words) optimized for few-step diffusion models (e.g., Z-Image Turbo in Amuse) without negative prompts. Return the full reference system as readable Markdown text.",
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
  const text = activeText(source);
  return `You are a Screenwriter and Dialogue Specialist. Transform the provided prose chapter directly into clean, formatted screenplay scripts divided into 15-second visual beats (minimum 10 beats per chapter). Isolate spoken dialogue and voiceover attributed strictly to speaking characters per beat. Character extraction, visual image prompts, and storyboard generation are handled externally in downstream modules.

PACING & BEAT RULES:
- Minimum Beat Count: Every chapter MUST be divided into a minimum of 10 visual beats. Longer or dense chapters scale up dynamically (12, 15, 20+ beats) based on narrative volume.
- Beat Duration: Each beat represents exactly 15 seconds of scene runtime.
- Audio & Dialogue Timing: All spoken lines (dialogue or voiceover) within a beat must complete by 00:11-00:12, leaving 3-4 seconds of quiet scene linger for visual impact before transitioning to the next beat.

BEAT BREAKDOWN OUTPUT FORMAT (Per Beat)
Every beat must be rendered using the structured XML metadata wrapper + formatted screenplay text below:
<scene number="[X]" duration="15s" act="[1/2/3]">
  <slugline>INT/EXT. LOCATION - TIME</slugline>
  <beat_purpose>[Primary Purpose]</beat_purpose>
  <speaking_characters>[List of characters with dialogue in this beat]</speaking_characters>
</scene>
Each beat must also include the screenplay text: SCENE HEADING / ACTION / CHARACTER / DIALOGUE / PARENTHETICAL. Dialogue and voiceover are attributed strictly to the speaking character.

PASSAGE:
"""${text}"""

Produce your output as a JSON array. Each element represents one beat and contains: id, act, sceneHeading, location, time_of_day, beat_purpose, speaking_characters[], action (the screenplay action lines), and dialogue[] (the screenplay dialogue lines, each attributed to its speaking character). Return ONLY the JSON array.`;
}

export function storyboardPrompt(source: IngestedSource | null): string {
  const text = activeText(source);
  return `You are a Professional Film Director, Storyboard Artist, and AI Cinematography Specialist. Transform the provided prose chapter directly into a dedicated, production-ready storyboard divided into 15-second visual beats (minimum 10 beats per chapter). Isolate the camera progression, 4-panel visual roadmap, atmospheric lighting, and physical movement per beat. Dialogue and character sheet extractions are handled in their respective dedicated files.

PACING & STORYBOARD BEAT RULES:
- Minimum Beat Count: Every chapter MUST be divided into a minimum of 10 visual beats. Longer or dense chapters scale up dynamically (12, 15, 20+ beats) based on narrative density.
- Beat Duration: Each beat represents exactly 15 seconds of scene runtime.
- 4-Panel Composition Rule: Each beat features a 4-panel breakdown mapping the visual progression:
  * Panel 1 (00:00): Opening framing, initial posture, camera positioning.
  * Panel 2 (00:05): Movement development, camera tracking/dolly, lighting shifts.
  * Panel 3 (00:10): Climax/peak emotional or visual action beat.
  * Panel 4 (00:15): Final frame state inherited by the next beat.

STORYBOARD OUTPUT FORMAT (Per Beat)
Every beat must be rendered using the structured XML metadata wrapper + formatted screenplay text below:
<storyboard_beat number="[X]" duration="15s" act="[1/2/3]">
  <slugline>INT/EXT. LOCATION - TIME</slugline>
  <primary_focus>[Main character / object / environment focus]</primary_focus>
  <shot_scale>[Extreme Wide / Wide / Medium / Medium Close-Up / Close-Up / ECU]</shot_scale>
  <camera_movement>[Static / Dolly In / Tracking / Pan / Crane / Handheld]</camera_movement>
</storyboard_beat>
Each beat must also include the 4-panel visual roadmap (Panel 1 @00:00, Panel 2 @00:05, Panel 3 @00:10, Panel 4 @00:15), atmospheric lighting notes, and physical movement description.

PASSAGE:
"""${text}"""

Produce your output as a JSON array. Each element represents one beat and contains: id, act, sceneHeading, location, time_of_day, primary_focus, shot_scale, camera_movement, panels[] (an array of 4 panel descriptions with timestamps 00:00, 00:05, 00:10, 00:15), lighting, and movement. Return ONLY the JSON array.`;
}

export function characterPrompt(source: IngestedSource | null): string {
  const text = activeText(source);
  return `You are a Character Designer, Casting Director, AI Visual Consistency Specialist, and Character Sheet Prompter. Extract every character present or introduced in the chapter text into a dedicated characters.md file. Build master character specifications, physical traits, expression sheets, multi-angle descriptions, pose references, Z-Image Turbo prompts, and 4-panel master reference sheet prompts (for Nano Banana 2 / external tools) to ensure 100% visual consistency across 15-second visual beats.

CHARACTER EXTRACTION RULES:
- Scope: Include all primary, secondary, and newly introduced background characters/entities (e.g., specific aliens, robots, guards).
- Naming Standard: Use ONE primary canonical name per character throughout the system. Unnamed entities in the prose (e.g., "the Brute officer") MUST be assigned a specific name or clear identifier.
- Original Appearance & Celebrity Avoidance: All generated physical descriptions and visual prompts MUST depict unique, original character features. Prompts must explicitly avoid using famous actor names or likenesses to prevent celebrity resemblance.
- Format: Render positive-only visual prompts (80-250 words) optimized for few-step diffusion models (e.g., Z-Image Turbo in Amuse) without negative prompts.
- Actor-to-Character-Sheet Prompter Integration: When a custom reference image is provided or used as the identity source, generate a ready-to-run 4-panel master character sheet prompt using the locked 4-panel template format (close-up far left → full-body front → 45° facing left → 45° facing right, mirrored, neutral expression with mouth slightly open, pure white background).

CHARACTER REFERENCE OUTPUT FORMAT (characters.md)
Generate the full reference system for each extracted character using the structured template below.

### Character Master Sheet: [CHARACTER NAME]

* **Source & First Appearance:** Chapter [X], Beat [Y]
* **Age & Species/Race:** [Age range, human / alien / cyborg / etc.]
* **Physical Build & Height:** [Height, body type, posture, physical presence]
* **Facial Features:** [Unique face shape, eye color/shape, nose, mouth/lips, distinguishing marks/scars - distinctly original appearance, non-celebrity]
* **Hair:** [Color, length, style, texture]
* **Skin / Texture:** [Tone, texture, complexion, scarring]
* **Default Wardrobe:** [Primary clothing, fabric type, wear-and-tear, colors, fit]
* **Voice & Behavior:** [Vocal pitch/tone, characteristic posture, gestures, movement signature]

#### Expression Reference Sheet

| Emotion | Facial Cues (Brows, Eyes, Jaw, Mouth) | Visual Camera Features |
| :--- | :--- | :--- |
| **Fear** | Eyes wide, pupils dilated, jaw tight, brows knit | Forehead tension, slight tremor in lower lip |
| **Anger** | Jaw clenched, brows furrowed, nostrils flared | Flushed skin, rigid posture, temple strain |
| **Exhaustion** | Eyelids drooping, slack jaw, sunken cheeks | Dark under-eye circles, pale complexion |
| **Determination** | Set jaw, locked gaze, steady brows | Squared shoulders, sharp focus on eyes |

#### Multi-Angle Description

* **Front:** [Symmetry, key facial alignment, frontal proportion]
* **Left / Right Profile:** [Nose bridge, jawline, forehead slope, ear position]
* **Three-Quarter View:** [3/4 angle transition, primary hero shot features]

#### Z-Image Turbo Generation Prompts (Positive-Only, 80-250 words)

> **Master Portrait (Head & Shoulders):**
> Photorealistic portrait of [NAME], an original person, distinct unique face, [age] [gender/species], [hair description], [eye color/shape], [skin texture/marks], [face shape]. Wearing [default wardrobe fabric/color]. Neutral expression looking into camera. Soft, even lighting. Neutral background. Shot on 85mm lens, sharp facial focus, natural skin texture.

> **Full Body Reference:**
> Photorealistic full-body shot of [NAME], an original person, distinct unique face, [age] [gender/species], [hair description], [skin/build]. Wearing [full wardrobe top-to-bottom]. Natural standing stance, head-to-toe in frame. Soft studio lighting. Plain backdrop. Shot on 50mm lens, full-figure clarity.

> **Cinematic In-Character Still:**
> Cinematic landscape 16:9 still of [NAME], an original character, [scene context], [lighting mood], [atmosphere]. Shot on 35mm film, shallow depth of field, natural movement frozen mid-gesture.

PASSAGE:
"""${text}"""

Produce the complete character reference system for every character found in the passage, using the template above. Return the output as readable Markdown text.`;
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
