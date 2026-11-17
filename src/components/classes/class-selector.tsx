"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, GraduationCap, Plus } from "lucide-react";
import { useClasses } from "@/lib/hooks/use-classes";
import { useActiveClassStore } from "@/lib/store/active-class";
import { DropdownMenu, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ClassCreateDialog } from "@/components/classes/class-create-dialog";
import { cn } from "@/lib/utils";

type ClassSelectorProps = {
  /**
   * Stretch trigger and menu to the parent width (Hub class panel header)
   * so the list cannot grow into the chat.
   */
  fill?: boolean;
  /** Icon trigger for the narrow desktop rail. Always visible; menu portals. */
  rail?: boolean;
};

export function ClassSelector({ fill = false, rail = false }: ClassSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: classes, isLoading } = useClasses();
  const activeClass = useActiveClassStore((state) => state.activeClass);
  const setActiveClass = useActiveClassStore((state) => state.setActiveClass);
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);

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

  function shortLabel(cls: {
    grade_level: number;
    subject: string;
    section: string | null;
  }) {
    const base = `G${cls.grade_level} ${cls.subject}`;
    return cls.section ? `${base} · ${cls.section}` : base;
  }

  const label = isLoading
    ? "Loading…"
    : activeClass
      ? shortLabel(activeClass)
      : classes?.length
        ? "Select class"
        : "No active class";

  return (
    <>
      <DropdownMenu
        align="start"
        portal
        rootClassName={cn("min-w-0", fill && "w-full")}
        contentClassName={cn("min-w-0", fill ? "w-full max-w-full" : "max-w-xs")}
        trigger={
          <button
            type="button"
            aria-label={rail ? `Class: ${label}` : undefined}
            title={label}
            className={cn(
              "flex items-center gap-1 text-xs font-medium text-muted-foreground hover:bg-muted",
              rail
                ? "h-11 w-11 justify-center rounded-2xl"
                : "rounded-full border border-border bg-card px-3 py-1.5",
              !rail && (fill ? "w-full max-w-full" : "max-w-[12rem] sm:max-w-[16rem]")
            )}
          >
            {rail ? (
              <GraduationCap className="h-5 w-5 shrink-0" />
            ) : (
              <>
                <span className="min-w-0 truncate">{label}</span>
                <ChevronDown className="h-3 w-3 shrink-0" />
              </>
            )}
          </button>
        }
      >
        {classes?.map((cls) => (
          <DropdownMenuItem
            key={cls.id}
            onClick={() => selectClass(cls)}
            className={cn(
              "min-w-0",
              activeClass?.id === cls.id ? "bg-primary/10 text-primary" : undefined
            )}
          >
            <span className="min-w-0 truncate font-medium">{shortLabel(cls)}</span>
          </DropdownMenuItem>
        ))}
        {!classes?.length && !isLoading ? (
          <p className="px-3 py-2 text-xs text-muted-foreground">No classes yet</p>
        ) : null}
        <div className="my-1 border-t border-border" />
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
    </>
  );
}
