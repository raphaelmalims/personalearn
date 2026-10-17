"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
  CHAT_MODEL_OPTIONS,
  PICKER_EFFORTS,
  effortLabel,
  type ChatEffortChoice,
  type ChatSettingsChoice,
  type ResolvedChatSettings,
} from "@/lib/ai/chat-settings";
import type { ChatThinking } from "@/lib/ai/env";
import { cn } from "@/lib/utils";

type ChatModelPickerProps = {
  settings: ResolvedChatSettings;
  disabled?: boolean;
  onChange: (choice: ChatSettingsChoice) => void;
};

export function ChatModelPicker({
  settings,
  disabled = false,
  onChange,
}: ChatModelPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const thinkingOn = settings.thinking === "enabled";
  const efforts: ChatEffortChoice[] =
    settings.effort === "max" ? [...PICKER_EFFORTS, "max"] : [...PICKER_EFFORTS];

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function choose(next: Partial<ChatSettingsChoice>) {
    onChange({
      modelId: next.modelId ?? settings.modelId,
      thinking: next.thinking ?? settings.thinking,
      effort: next.effort ?? settings.effort,
    });
  }

  const title = thinkingOn
    ? `${settings.label} · Thinking · ${effortLabel(settings.effort) ?? "Low"}`
    : `${settings.label} · Thinking off`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title={title}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-8 max-w-[11rem] items-center gap-1 rounded-full px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 sm:max-w-none"
      >
        <span className="truncate">{settings.label}</span>
        {thinkingOn ? (
          <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
        ) : null}
        <span className="sr-only">{thinkingOn ? "Thinking on" : "Thinking off"}</span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Model and thinking"
          className="absolute right-0 bottom-full z-50 mb-2 w-[min(16rem,calc(100vw-2rem))] rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <MenuLabel>Model</MenuLabel>
          {CHAT_MODEL_OPTIONS.map((option) => (
            <MenuRadio
              key={option.id}
              checked={settings.modelId === option.id}
              onClick={() => {
                choose({ modelId: option.id });
                setOpen(false);
              }}
            >
              {option.label}
            </MenuRadio>
          ))}

          <MenuLabel>Thinking</MenuLabel>
          <MenuRadio
            checked={thinkingOn}
            onClick={() => choose({ thinking: "enabled" satisfies ChatThinking })}
          >
            On
          </MenuRadio>
          <MenuRadio
            checked={!thinkingOn}
            onClick={() => choose({ thinking: "disabled" })}
          >
            Off
          </MenuRadio>

          {thinkingOn ? (
            <>
              <MenuLabel>Effort</MenuLabel>
              {efforts.map((effort) => (
                <MenuRadio
                  key={effort}
                  checked={settings.effort === effort}
                  onClick={() => {
                    choose({ effort });
                    setOpen(false);
                  }}
                >
                  {effortLabel(effort)}
                </MenuRadio>
              ))}
            </>
          ) : null}
        </div>
      ) : null}
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
