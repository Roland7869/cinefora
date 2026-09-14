import { useMemo, useState } from "react";
import { Search, Download, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ExtractionRow, ExtractionCategory } from "@/types";

interface ExtractionTableProps {
  category: ExtractionCategory;
  rows: ExtractionRow[];
  filter: (row: ExtractionRow) => boolean;
  activeFilter: string;
  onFilterChange: (value: string) => void;
}

const LABELS: Record<ExtractionCategory, { key: keyof ExtractionRow; label: string }[]> = {
  characters: [
    { key: "name", label: "Name" },
    { key: "look", label: "Look" },
    { key: "form", label: "Form" },
    { key: "size", label: "Size" },
    { key: "role", label: "Role" },
    { key: "traits", label: "Traits" },
    { key: "details", label: "Details" },
  ],
  assets: [
    { key: "name", label: "Name" },
    { key: "look", label: "Look" },
    { key: "form", label: "Form" },
    { key: "size", label: "Size" },
    { key: "function", label: "Function" },
    { key: "details", label: "Details" },
  ],
  locations: [
    { key: "name", label: "Name" },
    { key: "look", label: "Look" },
    { key: "form", label: "Form" },
    { key: "size", label: "Size" },
    { key: "function", label: "Function" },
    { key: "details", label: "Details" },
  ],
  buildings: [
    { key: "name", label: "Name" },
    { key: "look", label: "Look" },
    { key: "form", label: "Form" },
    { key: "size", label: "Height/Size" },
    { key: "function", label: "Function" },
    { key: "details", label: "Details" },
  ],
  spacecraft: [
    { key: "name", label: "Name" },
    { key: "look", label: "Hull Look" },
    { key: "form", label: "Hull Form" },
    { key: "size", label: "Scale/Size" },
    { key: "function", label: "Function" },
    { key: "details", label: "Details" },
  ],
};

function attrValue(row: ExtractionRow, key: keyof ExtractionRow) {
  const v = row[key];
  return v ? String(v) : "";
}

export function ExtractionTable({ category, rows, filter, activeFilter, onFilterChange }: ExtractionTableProps) {
  const [query, setQuery] = useState("");
  const visibleColumns = LABELS[category];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (!filter(row)) return false;
      if (!q) return true;
      return visibleColumns.some((col) => attrValue(row, col.key).toLowerCase().includes(q));
    });
  }, [rows, query, filter, visibleColumns]);

  const exportJson = () => {
    const payload = JSON.stringify(rows, null, 2);
    navigator.clipboard.writeText(payload);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${category}-extraction.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Filter entries…"
            className="pl-9 font-mono text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={exportJson}
          className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <Download className="h-3.5 w-3.5" /> Export JSON
        </button>
      </div>

      <div className="mb-2 flex items-center gap-2 overflow-x-auto">
        <Filter className="h-3.5 w-3.5 shrink-0 text-white/40" />
        {visibleColumns.map((col) => (
          <button
            key={col.key}
            onClick={() => onFilterChange(activeFilter === col.key ? "" : col.key as string)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition",
              activeFilter === col.key ? "bg-[#6366F1] text-white" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80",
            )}
          >
            {col.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-white/10">
        <div className="grid grid-cols-[1.4fr_1fr] gap-4 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
          <span>Name</span>
          <span className="text-right">Attributes</span>
        </div>
        <div className="max-h-[460px] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-white/40">
              {rows.length === 0 ? "No entries yet. Run an extraction to populate this table." : "No entries match the current filter."}
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {filtered.map((row) => (
                <li key={row.id} className="grid grid-cols-[1.4fr_1fr] gap-4 px-4 py-3 font-mono text-sm">
                  <span className="text-white/90">{row.name}</span>
                  <span className="flex-1 text-right">
                    {visibleColumns
                      .filter((col) => attrValue(row, col.key) !== "")
                      .map((col) => (
                        <div key={col.key} className="text-right text-[12px]">
                          <span className="text-white/30 mr-2">{col.label}:</span>
                          {attrValue(row, col.key)}
                        </div>
                      ))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="mt-2 text-[11px] text-white/40">{filtered.length} of {rows.length} entries</p>
    </div>
  );
}
