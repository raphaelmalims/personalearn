"use client";

import { PanelRight, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import { ConversationList } from "@/components/ai-hub/conversation-sidebar";
import { ClassResourcesSection } from "@/components/classes/class-resources-section";
import { StudentRosterTable } from "@/components/classes/student-roster-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { ConversationRow } from "@/lib/ai-hub/conversations";
import { filterStudentsByQuery } from "@/lib/classes/filter-class-lists";
import { useStudents } from "@/lib/hooks/use-classes";
import { cn } from "@/lib/utils";

const CLASS_PANEL_COLLAPSED_KEY = "ai-hub-class-panel-collapsed";

/** Desktop width of the combined Hub side panel (Chats / Resources / Students). */
export const HUB_SIDE_PANEL_WIDTH = "18rem";

export const HUB_CLASS_PANEL_TABS = [
  { id: "conversations", label: "Chats" },
  // Visible label stays short so three tabs fit; accessible name is Conversations.
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
  conversations?: ConversationRow[];
  selectedConversationId?: string | null;
  conversationsLoading?: boolean;
  deletingConversationId?: string | null;
  onSelectConversation?: (conversationId: string) => void;
  onNewConversation?: () => void;
  onDeleteConversation?: (conversationId: string) => void;
  className?: string;
  /** Full-screen sheet (mobile): collapse control reads as back-to-chat. */
  sheetMode?: boolean;
};

/**
 * Combined Hub side panel: chats, resources, and students.
 */
export function HubClassPanel({
  classId,
  collapsed,
  onCollapsedChange,
  activeTab,
  onTabChange,
  searchQuery,
  onSearchQueryChange,
  conversations = [],
  selectedConversationId = null,
  conversationsLoading = false,
  deletingConversationId = null,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  className,
  sheetMode = false,
}: HubClassPanelProps) {
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
          variant="ghost"
          size="icon"
          className="relative z-10 h-8 w-8"
          onClick={() => onCollapsedChange(false)}
          title="Expand class panel"
          aria-label="Expand class panel"
          aria-pressed
        >
          <X className="h-4 w-4 rotate-45 transition-transform duration-200 ease-out motion-reduce:transition-none" />
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
    activeTab === "conversations"
      ? "Search conversations…"
      : activeTab === "resources"
        ? "Search resources…"
        : "Search students…";
  const activeTabIndex = Math.max(
    0,
    HUB_CLASS_PANEL_TABS.findIndex((tab) => tab.id === activeTab)
  );

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-2xl border border-border/80 bg-card/50 shadow-xs backdrop-blur-sm",
        className ?? "w-full lg:w-[18rem]"
      )}
      aria-label="Class panel"
    >
      <div className="flex shrink-0 justify-start">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onCollapsedChange(true)}
          title={sheetMode ? "Back to chat" : "Collapse class panel"}
          aria-label={sheetMode ? "Back to chat" : "Collapse class panel"}
          aria-pressed={false}
        >
          <X className="h-4 w-4 rotate-0 transition-transform duration-200 ease-out motion-reduce:transition-none" />
        </Button>
      </div>

      <div
        className="relative mx-3 mb-2 flex shrink-0 gap-0.5 rounded-xl bg-muted/60 p-0.5"
        role="tablist"
        aria-label="Hub panel sections"
        onKeyDown={(event) => {
          if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
          event.preventDefault();
          const current = HUB_CLASS_PANEL_TABS.findIndex(
            (tab) => tab.id === activeTab
          );
          const delta = event.key === "ArrowRight" ? 1 : -1;
          const next =
            HUB_CLASS_PANEL_TABS[
              (current + delta + HUB_CLASS_PANEL_TABS.length) %
                HUB_CLASS_PANEL_TABS.length
            ];
          onTabChange(next.id);
          document.getElementById(`hub-class-panel-tab-${next.id}`)?.focus();
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0.5"
        >
          <span
            className="block h-full w-1/3 rounded-[10px] bg-primary/10 transition-transform duration-200 ease-out motion-reduce:transition-none"
            style={{ transform: `translateX(${activeTabIndex * 100}%)` }}
          />
        </span>
        {HUB_CLASS_PANEL_TABS.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`hub-class-panel-tab-${tab.id}`}
              aria-label={tab.id === "conversations" ? "Conversations" : undefined}
              aria-selected={selected}
              aria-controls={`hub-class-panel-section-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "relative z-10 min-w-0 flex-1 rounded-xl px-2 py-1.5 text-[11px] font-medium transition-colors sm:text-xs",
                selected
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="shrink-0 px-3 pb-2">
        <div className="flex items-center">
          <div className="relative min-w-0 flex-1">
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
          {activeTab === "conversations" ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => onNewConversation?.()}
              aria-label="New conversation"
              title="New conversation"
            >
              <Plus className="h-4 w-4" />
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
        {activeTab === "conversations" ? (
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            isLoading={conversationsLoading}
            deletingConversationId={deletingConversationId}
            searchQuery={searchQuery}
            onSelect={(conversationId) => {
              onSelectConversation?.(conversationId);
              if (sheetMode) onCollapsedChange(true);
            }}
            onDelete={(conversationId) => onDeleteConversation?.(conversationId)}
          />
        ) : activeTab === "resources" ? (
          <ClassResourcesSection
            classId={classId}
            searchQuery={searchQuery}
            compact
            onOpenedOnMobile={
              sheetMode ? () => onCollapsedChange(true) : undefined
            }
          />
        ) : (
          <section className="space-y-3" aria-label="Student roster">
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
                  hasQuery ? "No matching students." : "No students yet."
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
