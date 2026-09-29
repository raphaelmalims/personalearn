"use client";

import { PanelLeft, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";

type MobileHubToolbarProps = {
  title: string;
  onOpenPanel: () => void;
  onNewConversation: () => void;
};

/** Clears the fixed toolbar, including the iOS safe area. */
export const mobileHubToolbarOffsetClass =
  "pt-[calc(2.75rem+env(safe-area-inset-top))]";

/**
 * Drawer and new-chat controls for the mobile hub (below the desktop split).
 * Fixed to the viewport so a scrolling thread does not carry them away.
 */
export function MobileHubToolbar({
  title,
  onOpenPanel,
  onNewConversation,
}: MobileHubToolbarProps) {
  return (
    <div
      data-mobile-hub-toolbar
      className="fixed inset-x-0 top-0 z-30 flex h-[calc(2.75rem+env(safe-area-inset-top))] items-center gap-1 bg-background/90 px-1 pt-[env(safe-area-inset-top)] backdrop-blur-xl md:hidden"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onOpenPanel}
        title="Hub panel"
        aria-label="Open hub panel"
      >
        <PanelLeft className="h-6 w-6" strokeWidth={1.5} />
      </Button>
      <p className="min-w-0 flex-1 truncate text-sm font-medium">{title}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onNewConversation}
        title="New conversation"
        aria-label="New conversation"
      >
        <SquarePen className="h-6 w-6" strokeWidth={1.5} />
      </Button>
    </div>
  );
}
