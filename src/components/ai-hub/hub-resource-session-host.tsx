"use client";

import { useEffect } from "react";
import { ChevronLeft, Maximize2, Minimize2, X } from "lucide-react";
import {
  ResourceViewer,
  ResourceViewerSkeleton,
} from "@/components/classes/resource-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/lib/hooks/use-is-mobile";
import { useResource } from "@/lib/hooks/use-resources";
import {
  formatResourceDate,
  formatResourceType,
} from "@/lib/resources/format";
import { useHubResourceSessionStore } from "@/lib/store/hub-resource-session";
import { cn } from "@/lib/utils";

type HubResourceSessionHostProps = {
  onMobileBackToList?: () => void;
};

export function HubResourceSessionHost({
  onMobileBackToList,
}: HubResourceSessionHostProps) {
  const openResourceId = useHubResourceSessionStore((s) => s.openResourceId);
  const classId = useHubResourceSessionStore((s) => s.classId);
  const fullscreen = useHubResourceSessionStore((s) => s.fullscreen);
  const setFullscreen = useHubResourceSessionStore((s) => s.setFullscreen);
  const close = useHubResourceSessionStore((s) => s.close);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!openResourceId) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      const state = useHubResourceSessionStore.getState();
      if (state.fullscreen) {
        state.setFullscreen(false);
        return;
      }
      state.close();
      if (isMobile) onMobileBackToList?.();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openResourceId, isMobile, onMobileBackToList]);

  if (!openResourceId || !classId) {
    return null;
  }

  const coverViewport = fullscreen || isMobile;

  function handleClose() {
    close();
    if (isMobile) onMobileBackToList?.();
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col bg-background",
        coverViewport
          ? "fixed inset-0 z-40"
          : "absolute inset-0 z-20"
      )}
      role="region"
      aria-label="Resource reader"
      style={{ viewTransitionName: "hub-resource-reader" }}
    >
      <HubResourcePane
        classId={classId}
        resourceId={openResourceId}
        fullscreen={fullscreen}
        isMobile={isMobile}
        onToggleFullscreen={() => setFullscreen(!fullscreen)}
        onClose={handleClose}
      />
    </div>
  );
}

function HubResourcePane({
  classId,
  resourceId,
  fullscreen,
  isMobile,
  onToggleFullscreen,
  onClose,
}: {
  classId: string;
  resourceId: string;
  fullscreen: boolean;
  isMobile: boolean;
  onToggleFullscreen: () => void;
  onClose: () => void;
}) {
  const { data, isLoading, error, isFetching, dataUpdatedAt } = useResource(
    resourceId
  );
  const resource = data?.resource;
  const waitingOnNetwork = isLoading && !data;

  return (
    <>
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2 print:hidden">
        <div className="min-w-0 flex-1">
          {isMobile ? (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={onClose}
            >
              <ChevronLeft className="h-4 w-4" />
              Back to list
            </Button>
          ) : (
            <p className="truncate text-sm font-medium">
              {resource?.title ?? "Resource"}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center">
          {!isMobile ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={onToggleFullscreen}
              aria-pressed={fullscreen}
              aria-label={fullscreen ? "Exit full-screen" : "Full-screen"}
              title={fullscreen ? "Exit full-screen" : "Full-screen"}
            >
              {fullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          ) : null}
          {!isMobile && fullscreen ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={onClose}
              aria-label="Close resource"
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          ) : null}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {waitingOnNetwork ? (
          <ResourceViewerSkeleton />
        ) : error && !resource ? (
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : "Failed to load resource"}
          </p>
        ) : !resource || resource.class_id !== classId ? (
          <p className="text-sm text-muted-foreground">
            Resource not found.
          </p>
        ) : (
          <div className="mx-auto max-w-4xl space-y-4">
            <div>
              {isMobile ? (
                <h2 className="text-xl font-semibold tracking-tight print:text-lg">
                  {resource.title}
                </h2>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground print:hidden">
                <span>{formatResourceType(resource.resource_type)}</span>
                <span aria-hidden>·</span>
                <span>{formatResourceDate(resource.created_at)}</span>
                <Badge variant={resource.ai_generated ? "accent" : "secondary"}>
                  {resource.ai_generated ? "AI-generated" : "Uploaded"}
                </Badge>
                {isFetching && dataUpdatedAt === 0 ? (
                  <span className="sr-only">Loading resource</span>
                ) : null}
              </div>
            </div>
            <ResourceViewer
              classId={classId}
              resource={resource}
              viewUrl={data?.viewUrl ?? null}
              previewText={data?.previewText ?? ""}
            />
          </div>
        )}
      </div>
    </>
  );
}
