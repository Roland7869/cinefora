// Structured project entity types + helpers.
//
// Every extracted fact lives in a ReviewedEntity that starts as "inferred" and
// can only become canonical project data once a human edits it and marks it
// "confirmed". This keeps AI output from silently becoming truth.

import type { EntityEvidence, EvidenceStatus, ReviewedEntity, ScriptBeat } from "@/types";
import { validateExtractionArray } from "@/lib/validation";

export type EntityCategory = "characters" | "locations" | "buildings" | "assets" | "spacecraft";

export const EVIDENCE_LABELS: Record<EvidenceStatus, string> = {
  confirmed: "Confirmed",
  inferred: "Inferred",
  unknown: "Unknown",
};

export const EVIDENCE_COLORS: Record<EvidenceStatus, string> = {
  confirmed: "text-emerald-400",
  inferred: "text-amber-300",
  unknown: "text-white/40",
};

export const EVIDENCE_BADGE: Record<EvidenceStatus, string> = {
  confirmed: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  inferred: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  unknown: "bg-white/5 text-white/40 border-white/10",
};

function now(): string {
  return new Date().toISOString();
}

// Turn a raw AI extraction row into a project entity stamped as "inferred"
// with provenance back to its source.
export function makeInferredEntity(input: {
  id: string;
  name: string;
  look?: string;
  form?: string;
  size?: string;
  function?: string;
  role?: string;
  traits?: string;
  details?: string;
  sourceId?: string;
  sourceRelativePath?: string;
  sourceTitle?: string;
  chapter?: string;
}): ReviewedEntity {
  return {
    id: input.id,
    name: input.name,
    look: input.look,
    form: input.form,
    size: input.size,
    function: input.function,
    role: input.role,
    traits: input.traits,
    details: input.details,
    status: "inferred",
    notes: "",
    evidence: {
      status: "inferred",
      sourceId: input.sourceId,
      sourceRelativePath: input.sourceRelativePath,
      sourceTitle: input.sourceTitle,
      chapter: input.chapter,
    },
    createdAt: now(),
    updatedAt: now(),
  };
}

// Parse an AI JSON response into reviewed entities, attaching provenance from
// the active source and marking every item as "inferred".
// Uses Zod validation to ensure AI output matches expected schema before
// adding to project state.
export function parseEntitiesToReviewed(
  jsonText: string,
  activeSource: { sources?: { relativePath?: string; title?: string; chapter?: string }[] } | null,
  category: string,
): ReviewedEntity[] {
  const validation = validateExtractionArray(jsonText);
  if (!validation.success || validation.items.length === 0) {
    return [];
  }

  const sources = activeSource?.sources ?? [];
  const resolveSource = (chapter: string | undefined) => {
    const match = sources.find((s) => s.chapter === chapter || s.title === chapter);
    return {
      sourceId: match?.id,
      sourceRelativePath: match?.relativePath,
      sourceTitle: match?.title,
      chapter,
    };
  };

  return validation.items.map((item, i) => {
    const chapter = item.chapter ?? undefined;
    const evidence = resolveSource(chapter);
    return makeInferredEntity({
      id: String(item.id ?? `${category}-${i + 1}`),
      name: item.name ? String(item.name) : item.look ? String(item.look) : item.subject ? String(item.subject) : item.title ? String(item.title) : `Entry ${i + 1}`,
      look: item.look ? String(item.look) : undefined,
      form: item.form ? String(item.form) : undefined,
      size: item.size ? String(item.size) : undefined,
      function: item.function ? String(item.function) : undefined,
      role: item.role ? String(item.role) : undefined,
      traits: item.traits ? String(item.traits) : undefined,
      details: item.details ? String(item.details) : undefined,
      ...evidence,
    });
  });
}

export function parseScriptBeats(
  jsonText: string,
  activeSource: { sources?: { id?: string; relativePath?: string; title?: string; chapter?: string }[] } | null,
): ScriptBeat[] {
  const cleaned = jsonText.replace(/```json\n?|```/gi, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }

  const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.beats) ? parsed.beats : Array.isArray(parsed?.scenes) ? parsed.scenes : [parsed];
  const sources = activeSource?.sources ?? [];

  const resolveSource = (chapter: string | undefined) => {
    const match = sources.find((s) => s.chapter === chapter || s.title === chapter);
    return {
      sourceId: match?.id,
      sourceRelativePath: match?.relativePath,
      sourceTitle: match?.title,
      chapter,
    };
  };

  const now = new Date().toISOString();
  return (arr as Array<Record<string, unknown>>).map((item, i) => {
    const chapter = item.act ? String(item.act) : undefined;
    const evidence = resolveSource(chapter);
    return {
      id: String(item.id ?? `beat-${i + 1}`),
      act: String(item.act ?? "1"),
      sceneHeading: String(item.sceneHeading ?? ""),
      location: String(item.location ?? ""),
      timeOfDay: String(item.time_of_day ?? ""),
      beatPurpose: String(item.beat_purpose ?? ""),
      speakingCharacters: Array.isArray(item.speaking_characters)
        ? (item.speaking_characters as unknown[]).map(String)
        : [],
      action: String(item.action ?? ""),
      dialogue: Array.isArray(item.dialogue)
        ? (item.dialogue as Array<Record<string, unknown>>).map((d) => ({
            character: String(d.character ?? ""),
            line: String(d.line ?? ""),
          }))
        : [],
      sourceId: evidence.sourceId,
      sourceRelativePath: evidence.sourceRelativePath,
      status: "inferred" as const,
      evidence,
      createdAt: now,
      updatedAt: now,
    };
  });
}

// AI models sometimes return storyboard panels as objects instead of plain
// strings (e.g. { timestamp, description }). Flatten them to readable text.
function panelToString(panel: unknown): string {
  if (typeof panel === "string") return panel;
  if (typeof panel === "number" || typeof panel === "boolean") return String(panel);
  if (Array.isArray(panel)) return panel.map(panelToString).join(" — ");
  if (panel && typeof panel === "object") {
    const record = panel as Record<string, unknown>;
    const keys = ["description", "content", "text", "caption", "action", "visual", "shot", "panel", "time", "timestamp"];
    const preferred = keys.map((k) => record[k]).filter((v) => typeof v === "string" && v.trim()) as string[];
    if (preferred.length > 0) {
      const rest = Object.values(record).filter(
        (v) => typeof v === "string" && v.trim() && !preferred.includes(v),
      ) as string[];
      return [...preferred, ...rest].join(" — ");
    }
    return Object.values(record)
      .filter((v) => typeof v === "string" || typeof v === "number")
      .map(String)
      .join(" — ");
  }
  return "";
}

export function parseStoryboardBeats(
  jsonText: string,
  activeSource: { sources?: { id?: string; relativePath?: string; title?: string; chapter?: string }[] } | null,
): import("@/types").StoryboardBeat[] {
  const cleaned = jsonText.replace(/```json\n?|```/gi, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return [];
  }

  const arr = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.shots) ? parsed.shots : Array.isArray(parsed?.storyboards) ? parsed.storyboards : [parsed];
  const sources = activeSource?.sources ?? [];

  const resolveSource = (chapter: string | undefined) => {
    const match = sources.find((s) => s.chapter === chapter || s.title === chapter);
    return {
      sourceId: match?.id,
      sourceRelativePath: match?.relativePath,
      sourceTitle: match?.title,
      chapter,
    };
  };

  const now = new Date().toISOString();
  return (arr as Array<Record<string, unknown>>).map((item, i) => {
    const chapter = item.act ? String(item.act) : undefined;
    const evidence = resolveSource(chapter);
    return {
      id: String(item.id ?? `shot-${i + 1}`),
      act: String(item.act ?? "1"),
      sceneHeading: String(item.sceneHeading ?? ""),
      location: String(item.location ?? ""),
      timeOfDay: String(item.time_of_day ?? ""),
      primaryFocus: String(item.primary_focus ?? ""),
      shotScale: String(item.shot_scale ?? ""),
      cameraMovement: String(item.camera_movement ?? ""),
      panels: Array.isArray(item.panels) ? (item.panels as unknown[]).map(panelToString) : [],
      lighting: String(item.lighting ?? ""),
      movement: String(item.movement ?? ""),
      sourceId: evidence.sourceId,
      sourceRelativePath: evidence.sourceRelativePath,
      status: "inferred" as const,
      evidence,
      createdAt: now,
      updatedAt: now,
    };
  });
}
