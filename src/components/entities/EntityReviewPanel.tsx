import { useMemo, useState } from "react";
import { Check, Pencil, Trash2, Search, Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProject } from "@/context/ProjectContext";
import { EVIDENCE_BADGE, EVIDENCE_LABELS, type EntityCategory } from "@/lib/entities";
import type { ReviewedEntity } from "@/types";
import { cn } from "@/lib/utils";

interface EntityReviewPanelProps {
  category: EntityCategory;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  justExtracted?: string[]; // ids added by the latest run, for highlighting
}

const CATEGORIES: EntityCategory[] = ["characters", "locations", "buildings", "assets", "spacecraft"];

const LABELS: Record<EntityCategory, string> = {
  characters: "Characters",
  locations: "Locations",
  buildings: "Buildings",
  assets: "Assets",
  spacecraft: "Spacecraft",
};

const DESCRIPTIONS: Record<EntityCategory, string> = {
  characters: "Master character sheets with visual-consistency prompts. AI output starts as *Inferred* — approve to confirm.",
  locations: "Places, biomes, and environments. AI output starts as *Inferred* — approve to confirm.",
  buildings: "Structures and architecture. AI output starts as *Inferred* — approve to confirm.",
  assets: "Props, tools, and objects. AI output starts as *Inferred* — approve to confirm.",
  spacecraft: "Vessels, stations, and outposts. AI output starts as *Inferred* — approve to confirm.",
};

const DISPLAY_COLUMNS: Record<EntityCategory, { key: keyof ReviewedEntity; label: string }[]> = {
  characters: [
    { key: "look", label: "Look" },
    { key: "traits", label: "Traits" },
    { key: "role", label: "Role" },
    { key: "details", label: "Details" },
  ],
  locations: [
    { key: "look", label: "Look" },
    { key: "form", label: "Form" },
    { key: "size", label: "Size" },
    { key: "function", label: "Function" },
  ],
  buildings: [
    { key: "look", label: "Look" },
    { key: "form", label: "Form" },
    { key: "size", label: "Size" },
    { key: "function", label: "Function" },
  ],
  assets: [
    { key: "look", label: "Look" },
    { key: "form", label: "Form" },
    { key: "size", label: "Size" },
    { key: "function", label: "Function" },
  ],
  spacecraft: [
    { key: "look", label: "Hull" },
    { key: "form", label: "Form" },
    { key: "size", label: "Scale" },
    { key: "function", label: "Function" },
  ],
};

export function EntityReviewPanel({ category, title, subtitle, icon, justExtracted = [] }: EntityReviewPanelProps) {
  const { project, updateEntity, removeEntities } = useProject();
  const entities = (project?.[category] ?? []).slice().sort((a, b) => a.name.localeCompare(b.name));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "inferred">("all");
  const [editing, setEditing] = useState<ReviewedEntity | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entities.filter((e) => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (!q) return true;
      return [e.name, e.look, e.form, e.size, e.function, e.role, e.traits, e.details, e.notes ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [entities, query, statusFilter]);

  const counts = useMemo(() => {
    const confirmed = entities.filter((e) => e.status === "confirmed").length;
    const inferred = entities.filter((e) => e.status === "inferred").length;
    return { confirmed, inferred, total: entities.length };
  }, [entities]);

  const approve = (id: string) => updateEntity(category, id, { status: "confirmed", notes: editing?.notes ?? "" });

  return (
    <Card className="overflow-hidden border-white/10 bg-white/5">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-lg bg-[#6366F1]/15 text-[#6366F1]">{icon}</div>
          <div className="flex-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <StatusPill label="Confirmed" count={counts.confirmed} tone="emerald" />
          <StatusPill label="Inferred" count={counts.inferred} tone="amber" />
          <span className="ml-auto font-mono text-white/40">{counts.total} total</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <Input
              placeholder="Search entries…"
              className="pl-9 font-sans text-sm bg-white/5 border-white/10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-white/40" />
            {(["all", "confirmed", "inferred"] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                className="border-white/10 text-[11px] capitalize"
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-lg border border-dashed border-white/15 p-8 text-center text-sm text-white/40">
            {counts.total === 0 ? "No entries yet. Run an extraction to populate this list." : "No entries match the current filter."}
          </div>
        ) : (
          <div className="grid gap-2">
            {visible.map((entity) => (
              <EntityRow
                key={entity.id}
                entity={entity}
                category={category}
                isFresh={justExtracted.includes(entity.id)}
                onApprove={() => approve(entity.id)}
                onEdit={() => setEditing(entity)}
                onRemove={() => removeEntities(category, [entity.id])}
              />
            ))}
          </div>
        )}
      </CardContent>

      {editing && (
        <EditDialog
          open={true}
          entity={editing}
          category={category}
          onClose={() => setEditing(null)}
          onSaved={() => setEditing(null)}
        />
      )}
    </Card>
  );
}

function StatusPill({ label, count, tone }: { label: string; count: number; tone: "emerald" | "amber" }) {
  const toneClass = tone === "emerald" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium", toneClass)}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone === "emerald" ? "#34d399" : "#fbbf24" }} />
      {label} {count}
    </span>
  );
}

function EntityRow({
  entity,
  category,
  isFresh,
  onApprove,
  onEdit,
  onRemove,
}: {
  entity: ReviewedEntity;
  category: EntityCategory;
  isFresh: boolean;
  onApprove: () => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const columns = DISPLAY_COLUMNS[category];
  const attrs = columns
    .filter((c) => (entity[c.key] as string) !== "" && (entity[c.key] as string) !== undefined)
    .map((c) => (
      <div key={c.key} className="text-[12px]">
        <span className="mr-2 text-white/30">{c.label}:</span>
        {(entity[c.key] as string)}
      </div>
    ));

  return (
    <div className={cn("rounded-lg border p-3 transition", isFresh ? "border-[#6366F1]/40 bg-[#6366F1]/5" : "border-white/10 bg-white/[0.03]")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-sans text-sm font-medium text-white/90 truncate">{entity.name}</span>
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", EVIDENCE_BADGE[entity.status])}>
              {EVIDENCE_LABELS[entity.status]}
            </span>
          </div>
          {entity.evidence.sourceRelativePath ? (
            <p className="mt-1 font-mono text-[11px] text-white/40 truncate">{entity.evidence.sourceRelativePath}</p>
          ) : null}
          {entity.status === "confirmed" && entity.notes ? (
            <p className="mt-1 text-[11px] text-white/50 italic">“{entity.notes}”</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {entity.status === "inferred" && (
            <Button size="xs" onClick={onApprove} className="gap-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30">
              <Check className="h-3 w-3" /> Approve
            </Button>
          )}
          <Button size="xs" variant="outline" className="border-white/10" onClick={onEdit}>
            <Pencil className="h-3 w-3" />
          </Button>
          <Button size="xs" variant="outline" className="border-white/10 text-red-300 hover:bg-red-500/10" onClick={onRemove}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {attrs.length > 0 && (
        <div className="mt-2 border-t border-white/5 pt-2 flex flex-wrap gap-x-3 gap-y-1">
          {attrs}
        </div>
      )}
    </div>
  );
}

interface EditDialogProps {
  open: boolean;
  entity: ReviewedEntity;
  category: EntityCategory;
  onClose: () => void;
  onSaved: () => void;
}

function EditDialog({ open, entity, category, onClose, onSaved }: EditDialogProps) {
  const { updateEntity } = useProject();
  const [draft, setDraft] = useState<ReviewedEntity>(entity);

  const save = () => {
    updateEntity(category, draft.id, draft);
    onSaved();
  };

  const set = <K extends keyof ReviewedEntity>(key: K, value: ReviewedEntity[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit {LABELS[category]}</DialogTitle>
          <DialogDescription>
            {draft.status === "inferred" ? "Review this AI extraction and edit it before confirming it as project data." : "Update the canonical project entry."}
            {draft.evidence.sourceRelativePath ? ` · Source: ${draft.evidence.sourceRelativePath}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Field label="Name">
            <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Role">
              <Input value={draft.role ?? ""} onChange={(e) => set("role", e.target.value)} placeholder="Optional" />
            </Field>
            <Field label="Notes">
              <Textarea value={draft.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Editor notes…" />
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Look">
              <Textarea value={draft.look ?? ""} onChange={(e) => set("look", e.target.value)} rows={2} />
            </Field>
            <Field label="Form">
              <Textarea value={draft.form ?? ""} onChange={(e) => set("form", e.target.value)} rows={2} />
            </Field>
            <Field label="Size">
              <Textarea value={draft.size ?? ""} onChange={(e) => set("size", e.target.value)} rows={2} />
            </Field>
            <Field label="Function">
              <Textarea value={draft.function ?? ""} onChange={(e) => set("function", e.target.value)} rows={2} />
            </Field>
            <Field label="Traits">
              <Textarea value={draft.traits ?? ""} onChange={(e) => set("traits", e.target.value)} rows={2} />
            </Field>
            <Field label="Details">
              <Textarea value={draft.details ?? ""} onChange={(e) => set("details", e.target.value)} rows={2} />
            </Field>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-white/40">Status:</span>
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", EVIDENCE_BADGE[draft.status])}>
              {EVIDENCE_LABELS[draft.status]}
            </span>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/10">
            Cancel
          </Button>
          <Button onClick={save}>Save changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-white/60">{label}</Label>
      {children}
    </div>
  );
}
