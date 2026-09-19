"use client";

import { formatDistanceToNow } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useMemo } from "react";
import type { ConversationRow } from "@/lib/ai-hub/conversations";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SIDEBAR_COLLAPSED_KEY = "ai-hub-conversations-collapsed";

type ConversationListProps = {
  conversations: ConversationRow[];
  selectedConversationId: string | null;
  isLoading: boolean;
  deletingConversationId: string | null;
  searchQuery?: string;
  onSelect: (conversationId: string) => void;
  onNewConversation: () => void;
  onDelete: (conversationId: string) => void;
};

/** Thread list used inside the Hub side panel Conversations tab. */
export function ConversationList({
  conversations,
  selectedConversationId,
  isLoading,
  deletingConversationId,
  searchQuery = "",
  onSelect,
  onNewConversation,
  onDelete,
}: ConversationListProps) {
  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter((conversation) =>
      conversation.title.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  return (
    <section className="flex min-h-0 flex-col gap-3" aria-label="Conversations">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-8 rounded-xl"
          onClick={onNewConversation}
        >
          <Plus className="h-3.5 w-3.5" />
          New conversation
        </Button>
      </div>

      {isLoading ? (
        <div
          className="space-y-1"
          aria-busy="true"
          aria-label="Loading conversations"
        >
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-1.5 rounded-xl px-2.5 py-2">
              <Skeleton className="h-4 w-[75%]" />
              <Skeleton className="h-3 w-[50%]" />
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <p className="px-1 py-2 text-sm leading-relaxed text-muted-foreground">
          No conversations yet. Start a new chat to begin.
        </p>
      ) : filteredConversations.length === 0 ? (
        <p className="px-1 py-2 text-sm leading-relaxed text-muted-foreground">
          No conversations match “{searchQuery.trim()}”.
        </p>
      ) : (
        <ul className="space-y-1">
          {filteredConversations.map((conversation) => {
            const isSelected = conversation.id === selectedConversationId;
            const isDeleting = deletingConversationId === conversation.id;

            return (
              <li key={conversation.id}>
                <div
                  className={cn(
                    "group relative rounded-xl transition-colors",
                    isSelected ? "bg-primary/10" : "hover:bg-muted/80"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(conversation.id)}
                    disabled={isDeleting}
                    className="w-full px-2.5 py-2 text-left"
                  >
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        isSelected ? "text-primary" : "text-foreground"
                      )}
                    >
                      {conversation.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.updated_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${conversation.title}`}
                    disabled={isDeleting}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(conversation.id);
                    }}
                    className="absolute top-1/2 right-0.5 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg bg-card/90 text-muted-foreground opacity-0 shadow-xs backdrop-blur-sm transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export function readSidebarCollapsedPreference(): boolean | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    if (value === null) return null;
    return value === "true";
  } catch {
    return null;
  }
}

export function writeSidebarCollapsedPreference(collapsed: boolean) {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? "true" : "false");
  } catch {
    // Ignore quota / private mode failures.
  }
}
