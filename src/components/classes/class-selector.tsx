"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Pencil, Plus } from "lucide-react";
import { useClasses } from "@/lib/hooks/use-classes";
import { useActiveClassStore } from "@/lib/store/active-class";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ClassCreateDialog } from "@/components/classes/class-create-dialog";
import { ClassEditDialog } from "@/components/classes/class-edit-dialog";
import { classLevelLabel } from "@/lib/classes/level";
import { cn } from "@/lib/utils";
import type { Class } from "@/types/database";

type ClassSelectorProps = {
  /**
   * Stretch trigger and menu to the parent width (Hub class panel header)
   * so the list cannot grow into the chat.
   */
  fill?: boolean;
};

export function ClassSelector({ fill = false }: ClassSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: classes, isLoading } = useClasses();
  const activeClass = useActiveClassStore((state) => state.activeClass);
  const setActiveClass = useActiveClassStore((state) => state.setActiveClass);
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editClass, setEditClass] = useState<Class | null>(null);

  function selectClass(cls: NonNullable<typeof classes>[number]) {
    setActiveClass({
      id: cls.id,
      name: cls.name,
      grade_level: cls.grade_level,
      subject: cls.subject,
      section: cls.section,
      term: cls.term,
    });
    queryClient.invalidateQueries();
    const onClassIndex =
      pathname === "/classes" || /^\/classes\/[^/]+\/?$/.test(pathname);
    if (onClassIndex) {
      router.push("/ai-hub");
    }
  }

  function detailLabel(cls: {
    grade_level: Class["grade_level"];
    subject: string;
    section: string | null;
  }) {
    const base = `${classLevelLabel(cls.grade_level)} ${cls.subject}`;
    return cls.section ? `${base} · ${cls.section}` : base;
  }

  const label = isLoading
    ? "Loading…"
    : activeClass
      ? activeClass.name
      : classes?.length
        ? "Select class"
        : "No active class";

  return (
    <>
      <DropdownMenu
        align="start"
        portal
        matchTrigger
        rootClassName={cn("w-max max-w-full min-w-0", fill && "w-full")}
        contentClassName="min-w-0"
        trigger={
          <button
            type="button"
            data-pl-dropdown-trigger=""
            aria-label={`Class: ${label}`}
            title={label}
            className={cn(
              "flex min-h-10 items-center gap-2 rounded-full border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              fill ? "w-full max-w-full" : "max-w-[16rem]"
            )}
          >
            <span className="min-w-0 flex-1 truncate text-left">{label}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        }
      >
        {classes?.map((cls) => {
          const selected = activeClass?.id === cls.id;
          return (
            <div key={cls.id} className="flex min-w-0 items-center gap-1">
              <DropdownMenuItem
                active={selected}
                onClick={() => selectClass(cls)}
                className={cn(
                  "min-h-10 min-w-0 flex-1 gap-2",
                  selected ? "bg-primary/10 text-primary" : undefined
                )}
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    selected ? "opacity-100" : "opacity-0"
                  )}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{cls.name}</span>
                  <span className="block truncate text-xs font-normal text-muted-foreground">
                    {detailLabel(cls)}
                  </span>
                </span>
              </DropdownMenuItem>
              <button
                type="button"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Edit ${cls.name}`}
                onClick={() => setEditClass(cls)}
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          );
        })}
        {!classes?.length && !isLoading ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">No classes yet</p>
        ) : null}
        <div className="mx-1 my-1 border-t border-border" />
        <DropdownMenuItem onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4 shrink-0" />
          New class
        </DropdownMenuItem>
      </DropdownMenu>
      <ClassCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        showDefaultTrigger={false}
      />
      {editClass ? (
        <ClassEditDialog
          key={editClass.id}
          cls={editClass}
          open
          showTrigger={false}
          onOpenChange={(next) => {
            if (!next) setEditClass(null);
          }}
        />
      ) : null}
    </>
  );
}
