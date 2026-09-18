"use client";

import { ChevronLeft, ChevronRight, PanelRight, Search, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { AddStudentDialog } from "@/components/classes/add-student-dialog";
import { ClassResourcesSection } from "@/components/classes/class-resources-section";
import { ClassMetaReveal } from "@/components/classes/class-meta-reveal";
import { ClassSelector } from "@/components/classes/class-selector";
import { CsvImportDialog } from "@/components/classes/csv-import-dialog";
import { StudentRosterTable } from "@/components/classes/student-roster-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { filterStudentsByQuery } from "@/lib/classes/filter-class-lists";
import { useStudents } from "@/lib/hooks/use-classes";
import { useActiveClassStore } from "@/lib/store/active-class";
import { cn } from "@/lib/utils";

const CLASS_PANEL_COLLAPSED_KEY = "ai-hub-class-panel-collapsed";

export const HUB_CLASS_PANEL_TABS = [
  { id: "resources", label: "Resources" },
  { id: "students", label: "Students" },
] as const;

export type HubClassPanelTab = (typeof HUB_CLASS_PANEL_TABS)[number]["id"];

type HubClassPanelProps = {
  classId: string;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  activeTab: HubClassPanelTab;
  onTabChange: (tab: HubClassPanelTab) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  className?: string;
  /** Full-screen sheet (mobile): collapse control reads as back-to-chat. */
  sheetMode?: boolean;
};

/**
 * IDE-style class panel for the Hub landing (PSL-114): class switching plus
 * the Resources / Students surfaces that used to live on the class page.
 */
export function HubClassPanel({
  classId,
  collapsed,
  onCollapsedChange,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchQueryChange,
  className,
  sheetMode = false,
}: HubClassPanelProps) {
  const activeClass = useActiveClassStore((state) => state.activeClass);
  const { data: students, isLoading: studentsLoading } = useStudents(classId);
  const filteredStudents = useMemo(
    () => filterStudentsByQuery(students ?? [], searchQuery),
    [students, searchQuery]
  );

  useEffect(() => {
    if (collapsed) {
      onSearchQueryChange("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clear search only on collapse
  }, [collapsed]);

  if (collapsed) {
    return (
      <aside
        className="relative flex w-10 shrink-0 flex-col items-center gap-3 py-2"
        aria-label="Class panel collapsed"
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border"
          aria-hidden
        />
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="relative z-10 h-8 w-8 rounded-full bg-background shadow-none"
          onClick={() => onCollapsedChange(false)}
          title="Expand class panel"
          aria-label="Expand class panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <PanelRight
          className="relative z-10 h-4 w-4 text-muted-foreground"
          aria-hidden
        />
      </aside>
    );
  }

  const hasQuery = searchQuery.trim().length > 0;
  const searchLabel =
    activeTab === "resources" ? "Search resources…" : "Search students…";

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/50 shadow-xs backdrop-blur-sm",
        className ?? "w-full lg:w-[20rem]"
      )}
      aria-label="Class panel"
    >
      <div className="flex shrink-0 items-start justify-between gap-2 px-3 py-3">
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <ClassSelector />
          {activeClass ? (
            <ClassMetaReveal
              cls={activeClass}
              className="items-start gap-0.5"
              nameClassName="text-sm"
            />
          ) : null}
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="h-8 w-8 shrink-0 rounded-full"
          onClick={() => onCollapsedChange(true)}
          title={sheetMode ? "Back to chat" : "Collapse class panel"}
          aria-label={sheetMode ? "Back to chat" : "Collapse class panel"}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div
        className="flex shrink-0 gap-1 px-3 pb-2"
        role="tablist"
        aria-label="Class panel sections"
      >
        {HUB_CLASS_PANEL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`hub-class-panel-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`hub-class-panel-section-${tab.id}`}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "flex-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="shrink-0 px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
            placeholder={searchLabel}
            className="h-9 rounded-xl pl-8 pr-8 text-sm"
            aria-label={searchLabel}
          />
          {hasQuery ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0.5 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-muted-foreground"
              onClick={() => onSearchQueryChange("")}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`hub-class-panel-section-${activeTab}`}
        aria-labelledby={`hub-class-panel-tab-${activeTab}`}
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-3"
      >
        {activeTab === "resources" ? (
          <ClassResourcesSection
            classId={classId}
            searchQuery={searchQuery}
            compact
          />
        ) : (
          <section className="space-y-3" aria-label="Student roster">
            <div className="flex flex-wrap items-center gap-2">
              <AddStudentDialog classId={classId} />
              <CsvImportDialog classId={classId} />
            </div>
            {studentsLoading ? (
              <div
                className="space-y-2"
                aria-busy="true"
                aria-label="Loading students"
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <Skeleton key={index} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <StudentRosterTable
                classId={classId}
                students={filteredStudents}
                compact
                emptyMessage={
                  hasQuery
                    ? "No matching students."
                    : "No students yet. Use the buttons above to add one or import a CSV."
                }
              />
            )}
          </section>
        )}
      </div>
    </aside>
  );
}

export function readClassPanelCollapsedPreference(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(CLASS_PANEL_COLLAPSED_KEY);
    if (value === null) return null;
    return value === "true";
  } catch {
    return null;
  }
}

export function writeClassPanelCollapsedPreference(collapsed: boolean) {
  try {
    localStorage.setItem(CLASS_PANEL_COLLAPSED_KEY, collapsed ? "true" : "false");
  } catch {
    // Ignore quota / private mode failures.
  }
}
