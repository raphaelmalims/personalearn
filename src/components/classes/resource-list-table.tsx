"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Resource } from "@/types/database";
import { useDeleteResource } from "@/lib/hooks/use-resources";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatResourceDate,
  formatResourceType,
} from "@/lib/resources/format";
import { ResourceDeleteDialog } from "@/components/classes/resource-delete-dialog";
import { cn } from "@/lib/utils";

type ResourceListTableProps = {
  classId: string;
  resources: Resource[];
  emptyMessage?: string;
  /** Narrow container (Hub class panel): conversation-row density, no card chrome. */
  compact?: boolean;
  selectedResourceId?: string | null;
  onOpenResource?: (resourceId: string) => void;
  onPrefetchResource?: (resourceId: string) => void;
};

export function ResourceListTable({
  classId,
  resources,
  emptyMessage = "No resources yet. Upload a scheme, notes, or assignment to get started.",
  compact = false,
  selectedResourceId = null,
  onOpenResource,
  onPrefetchResource,
}: ResourceListTableProps) {
  const deleteResource = useDeleteResource(classId);
  const [deleteTarget, setDeleteTarget] = useState<Resource | null>(null);

  function handleOpen(resourceId: string) {
    onPrefetchResource?.(resourceId);
    onOpenResource?.(resourceId);
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteResource.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  }

  if (!resources.length) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <>
      <div className={compact ? "hidden" : "hidden md:block"}>
        <Table containerClassName="overflow-visible">
          <TableHeader>
            <TableRow>
              <TableHead sticky>Title</TableHead>
              <TableHead sticky>Type</TableHead>
              <TableHead sticky>Source</TableHead>
              <TableHead sticky>Added</TableHead>
              <TableHead sticky className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources.map((resource) => {
              const selected = selectedResourceId === resource.id;
              return (
                <TableRow
                  key={resource.id}
                  className={cn("group", selected && "bg-primary/10")}
                >
                  <TableCell>
                    <button
                      type="button"
                      aria-label={`Open ${resource.title}`}
                      aria-current={selected ? "true" : undefined}
                      onMouseEnter={() => onPrefetchResource?.(resource.id)}
                      onFocus={() => onPrefetchResource?.(resource.id)}
                      onClick={() => handleOpen(resource.id)}
                      className="text-left font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {resource.title}
                    </button>
                  </TableCell>
                  <TableCell>
                    {formatResourceType(resource.resource_type)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={resource.ai_generated ? "accent" : "secondary"}
                    >
                      {resource.ai_generated ? "AI-generated" : "Uploaded"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatResourceDate(resource.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                        disabled={deleteResource.isPending}
                        onClick={() => setDeleteTarget(resource)}
                        aria-label={`Delete ${resource.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <ul className={cn("space-y-1", !compact && "md:hidden")}>
        {resources.map((resource) => {
          const selected = selectedResourceId === resource.id;
          return (
            <li key={resource.id}>
              <div
                className={cn(
                  "group relative rounded-xl transition-colors hover:bg-muted/80",
                  selected && "bg-primary/10"
                )}
              >
                <button
                  type="button"
                  aria-label={`Open ${resource.title}`}
                  aria-current={selected ? "true" : undefined}
                  onMouseEnter={() => onPrefetchResource?.(resource.id)}
                  onFocus={() => onPrefetchResource?.(resource.id)}
                  onClick={() => handleOpen(resource.id)}
                  className="block w-full min-w-0 py-2 pr-8 pl-2.5 text-left"
                >
                  <p className="truncate text-sm font-medium text-foreground">
                    {resource.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {formatResourceType(resource.resource_type)} ·{" "}
                    {formatResourceDate(resource.created_at)} ·{" "}
                    {resource.ai_generated ? "AI" : "Uploaded"}
                  </p>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute top-1/2 right-0.5 h-7 w-7 -translate-y-1/2 p-0 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 focus-visible:opacity-100"
                  disabled={deleteResource.isPending}
                  onClick={() => setDeleteTarget(resource)}
                  aria-label={`Delete ${resource.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </li>
          );
        })}
      </ul>

      <ResourceDeleteDialog
        resource={deleteTarget}
        open={Boolean(deleteTarget)}
        isDeleting={deleteResource.isPending}
        error={
          deleteResource.error instanceof Error
            ? deleteResource.error.message
            : null
        }
        onOpenChange={(open) => {
          if (!open && !deleteResource.isPending) setDeleteTarget(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
