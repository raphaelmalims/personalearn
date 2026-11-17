"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type DropdownMenuProps = {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  /** Where the panel opens relative to the trigger. Use `top` for bottom tab bars. */
  side?: "top" | "bottom";
  contentClassName?: string;
  /** Classes for the relative positioning wrapper. */
  rootClassName?: string;
  /**
   * Render the panel on `document.body` with fixed coordinates.
   * Use for hero headers where a later sibling stacking context steals clicks.
   */
  portal?: boolean;
  /**
   * Size the panel from the trigger control, clamped to 15–20rem.
   * Ignores a full-width positioning wrapper.
   */
  matchTrigger?: boolean;
};

const DropdownMenuContext = createContext<{ close: () => void } | null>(null);

export function DropdownMenu({
  trigger,
  children,
  align = "end",
  side = "bottom",
  contentClassName,
  rootClassName,
  portal = false,
  matchTrigger = false,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<React.CSSProperties | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (
        ref.current?.contains(target) ||
        panelRef.current?.contains(target) ||
        (event.target as HTMLElement | null)?.closest?.("[data-pl-dropdown-panel]")
      ) {
        return;
      }
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        ref.current
          ?.querySelector<HTMLElement>("[data-pl-dropdown-trigger]")
          ?.focus();
        return;
      }
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const items = Array.from(
        panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []
      );
      if (!items.length) return;
      event.preventDefault();
      const current = items.indexOf(document.activeElement as HTMLElement);
      const delta = event.key === "ArrowDown" ? 1 : -1;
      const next = items[(current + delta + items.length) % items.length];
      next?.focus();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  useLayoutEffect(() => {
    if (!portal || !open || !ref.current) {
      setCoords(null);
      return;
    }
    const triggerEl = ref.current.querySelector<HTMLElement>("[data-pl-dropdown-trigger]");
    const box = (matchTrigger && triggerEl ? triggerEl : ref.current).getBoundingClientRect();
    const margin = 8;
    const spaceBelow = window.innerHeight - box.bottom - margin;
    const spaceAbove = box.top - margin;
    const openUp =
      side === "top" || (side === "bottom" && spaceBelow < 160 && spaceAbove > spaceBelow);
    const available = Math.max(120, openUp ? spaceAbove : spaceBelow);
    const room = Math.max(
      0,
      align === "end" ? box.right - margin : window.innerWidth - box.left - margin
    );
    const width = Math.min(320, Math.max(240, box.width), room);
    setCoords({
      ...(matchTrigger ? { width, minWidth: width, maxWidth: width } : { minWidth: Math.min(box.width, room), maxWidth: room }),
      maxHeight: Math.min(288, available),
      overflowY: "auto",
      ...(openUp
        ? { bottom: window.innerHeight - box.top + margin, top: "auto" }
        : { top: box.bottom + margin, bottom: "auto" }),
      ...(align === "end"
        ? { right: window.innerWidth - box.right, left: "auto" }
        : { left: box.left, right: "auto" }),
    });
  }, [portal, open, side, align, matchTrigger]);

  useEffect(() => {
    if (!open || !panelRef.current) return;
    const active = panelRef.current.querySelector<HTMLElement>("[data-pl-active-item]");
    if (active && typeof active.scrollIntoView === "function") {
      active.scrollIntoView({ block: "nearest" });
    }
    active?.focus();
  }, [open, coords]);

  if (!open) {
    return (
      <DropdownMenuContext.Provider value={{ close: () => setOpen(false) }}>
        <div className={cn("relative", rootClassName)} ref={ref}>
          <div aria-expanded={false} aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
            {trigger}
          </div>
        </div>
      </DropdownMenuContext.Provider>
    );
  }

  const panel = (
    <div
      ref={panelRef}
      style={portal ? coords ?? undefined : undefined}
      role="menu"
      className={cn(
        "z-50 max-h-72 w-max max-w-[calc(100vw-1rem)] overflow-x-hidden overflow-y-auto rounded-md bg-card p-1 shadow-lg",
        portal
          ? "fixed"
          : cn(
              "absolute",
              side === "top" ? "bottom-full mb-2" : "top-full mt-2",
              align === "end" ? "right-0" : "left-0"
            ),
        contentClassName
      )}
      data-pl-dropdown-panel=""
    >
      {children}
    </div>
  );

  return (
    <DropdownMenuContext.Provider value={{ close: () => setOpen(false) }}>
      <div className={cn("relative", rootClassName)} ref={ref}>
        <div aria-expanded aria-haspopup="menu" onClick={() => setOpen((value) => !value)}>
          {trigger}
        </div>
        {portal
          ? coords && typeof document !== "undefined"
            ? createPortal(panel, document.body)
            : null
          : panel}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuItem({
  className,
  onClick,
  active = false,
  children,
}: {
  className?: string;
  onClick?: () => void;
  /** Scroll this row into view and focus it when the menu opens. */
  active?: boolean;
  children: React.ReactNode;
}) {
  const menu = useContext(DropdownMenuContext);

  return (
    <button
      type="button"
      role="menuitem"
      data-pl-active-item={active ? "" : undefined}
      className={cn(
        "flex w-full min-w-0 items-center rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
        className
      )}
      onClick={() => {
        onClick?.();
        menu?.close();
      }}
    >
      {children}
    </button>
  );
}
