"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { fadeTransition, spring } from "@/lib/motion";

type TabsProps = {
  tabs: { id: string; label: string }[];
  value: string;
  onValueChange: (id: string) => void;
  className?: string;
  labelledBy?: string;
};

export function Tabs({
  tabs,
  value,
  onValueChange,
  className,
  labelledBy,
}: TabsProps) {
  const reduce = useReducedMotion();

  return (
    <div
      role="tablist"
      aria-labelledby={labelledBy}
      className={cn(
        "relative inline-flex gap-1 rounded-full bg-muted p-1",
        className
      )}
    >
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onValueChange(tab.id)}
            className={cn(
              "relative z-10 h-9 min-w-11 rounded-full px-3 text-sm font-medium",
              selected ? "text-primary-foreground" : "text-muted-foreground"
            )}
          >
            {selected ? (
              <motion.span
                layoutId="tab-indicator"
                className="absolute inset-0 -z-10 rounded-full bg-primary"
                transition={reduce ? fadeTransition : spring.snappy}
              />
            ) : null}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
