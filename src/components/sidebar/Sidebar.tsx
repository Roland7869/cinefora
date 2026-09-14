import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { NAV_ITEMS, type NavGroup } from "@/components/sidebar/nav-items";
import { ROUTES } from "@/router.routes";
import type { Route } from "@/router";
import { cn } from "@/lib/utils";

const GROUP_LABELS: Record<NavGroup, string> = {
  production: "Production Pipeline",
  extraction: "Extraction",
  library: "Library",
  system: "System",
};

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const path = location.pathname.replace(/^\//, "");
  const active: Route = (ROUTES[path] ?? "script") as Route;

  const visibleGroups = useMemo(
    () => GROUP_ORDER.filter((g) => NAV_ITEMS.some((item) => item.group === g)),
    [],
  );

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen shrink-0 border-r border-white/5 bg-[#0a0a12] transition-[width] duration-300",
        collapsed ? "w-[72px]" : "w-[264px]",
      )}
    >
      <div className="flex h-screen flex-col">
        <div className="flex items-center justify-between px-4 h-16 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-[0_6px_20px_-8px_theme('colors.primary.glow')]">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            {!collapsed && (
              <span className="truncate text-sm font-semibold tracking-tight text-white">Cinefora</span>
            )}
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="grid size-7 place-items-center rounded-md text-[11px] opacity-50 transition hover:opacity-100 hover:bg-white/5"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
              <path d="M10 4L4 8l6 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-2 pt-3 pb-4">
          {visibleGroups.map((group) => (
            <div key={group}>
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">
                  {GROUP_LABELS[group]}
                </p>
              )}
              <div className="relative flex flex-col gap-0.5">
                {NAV_ITEMS.filter((item) => item.group === group).map((item) => {
                  const isActive = item.route === active;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        window.location.hash = item.route;
                        window.scrollTo(0, 0);
                      }}
                      title={collapsed ? item.label : undefined}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-150",
                        collapsed ? "justify-center" : "justify-between",
                        isActive
                          ? "bg-[#6366F1] text-white shadow-[0_8px_22px_-14px_theme('colors.primary.glow')]"
                          : "text-white/60 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      <span className={cn(isActive ? "text-white" : "text-white/70 group-hover:text-white")}>{item.icon}</span>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-white/5 p-3">
          {!collapsed && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="text-xs font-medium text-white/80">Book-to-Screen AI Pipeline</p>
              <p className="mt-1 text-[11px] leading-snug text-white/40">
                Ingest a book section, then run cloud or local AI engines across your production stages.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
