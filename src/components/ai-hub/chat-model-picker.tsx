"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  PICKER_EFFORTS,
  effortLabel,
  type ChatEffortChoice,
  type ChatSettingsChoice,
  type ResolvedChatSettings,
} from "@/lib/ai/chat-settings";
import { cn } from "@/lib/utils";

type ChatModelPickerProps = {
  settings: ResolvedChatSettings;
  disabled?: boolean;
  onChange: (choice: ChatSettingsChoice) => void;
};

type MenuBox = { top: number; bottom: number; left: number; right: number };
type Viewport = { width: number; height: number };

export function placeChatMenu(box: MenuBox, viewport: Viewport) {
  const width = Math.min(256, Math.max(160, viewport.width - 16));
  const gap = 8;
  const spaceAbove = box.top;
  const spaceBelow = viewport.height - box.bottom;
  const openUp = spaceAbove >= 180 || spaceAbove >= spaceBelow;
  const left = Math.max(8, Math.min(box.right - width, viewport.width - width - 8));
  if (openUp) {
    return {
      openUp,
      width,
      left,
      bottom: viewport.height - box.top + gap,
    };
  }
  return {
    openUp,
    width,
    left,
    top: box.bottom + gap,
  };
}

export function ChatModelPicker({
  settings,
  disabled = false,
  onChange,
}: ChatModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<ReturnType<typeof placeChatMenu> | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const movedFocusRef = useRef(false);
  const menuId = useId();
  const thinkingOn = settings.thinking === "enabled";
  const efforts: ChatEffortChoice[] =
    settings.effort === "max" ? [...PICKER_EFFORTS, "max"] : [...PICKER_EFFORTS];
  const pillLabel = thinkingOn ? (effortLabel(settings.effort) ?? "On") : "Off";

  const closeMenu = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) {
      setCoords(null);
      return;
    }
    function place() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords(
        placeChatMenu(rect, {
          width: window.innerWidth,
          height: window.innerHeight,
        })
      );
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      movedFocusRef.current = false;
      return;
    }
    if (!panelRef.current || movedFocusRef.current) return;
    movedFocusRef.current = true;
    panelRef.current
      ?.querySelector<HTMLElement>("[role='menuitemradio']")
      ?.focus();
  }, [open, coords]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      closeMenu();
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, closeMenu]);

  function choose(next: Partial<ChatSettingsChoice>) {
    onChange({
      thinking: next.thinking ?? settings.thinking,
      effort: next.effort ?? settings.effort,
    });
  }

  const menu =
    open && coords && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="menu"
            aria-label="Thinking"
            style={{
              left: coords.left,
              width: coords.width,
              ...(coords.openUp
                ? { bottom: coords.bottom, top: "auto" }
                : { top: coords.top, bottom: "auto" }),
            }}
            className="fixed z-50 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg"
          >
            <MenuLabel>Thinking</MenuLabel>
            <MenuRadio
              checked={!thinkingOn}
              onClick={() => {
                choose({ thinking: "disabled" });
                closeMenu();
              }}
            >
              Off
            </MenuRadio>
            {efforts.map((effort) => (
              <MenuRadio
                key={effort}
                checked={thinkingOn && settings.effort === effort}
                onClick={() => {
                  choose({ thinking: "enabled", effort });
                  closeMenu();
                }}
              >
                {effortLabel(effort)}
              </MenuRadio>
            ))}
          </div>,
          document.body
        )
      : null;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title={thinkingOn ? `Thinking · ${pillLabel}` : "Thinking off"}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 items-center rounded-full px-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
      >
        {pillLabel}
      </button>
      {menu}
    </div>
  );
}

function MenuLabel({ children }: { children: string }) {
  return (
    <p className="px-2 pt-2 pb-1 text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function MenuRadio({
  checked,
  onClick,
  children,
}: {
  checked: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={checked}
      onClick={onClick}
      className={cn(
        "flex min-h-11 w-full items-center justify-between rounded-lg px-2 text-left text-sm text-foreground",
        "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked && "bg-muted"
      )}
    >
      <span>{children}</span>
    </button>
  );
}
