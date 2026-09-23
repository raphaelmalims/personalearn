"use client";

import { motion, useReducedMotion } from "motion/react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip } from "@/components/ui/tooltip";
import { presets } from "@/lib/motion";
import { useState } from "react";

const swatches = [
  ["canvas", "bg-canvas"],
  ["surface-1", "bg-surface-1"],
  ["surface-2", "bg-surface-2"],
  ["surface-3", "bg-surface-3"],
  ["primary", "bg-primary"],
  ["success", "bg-success"],
  ["warning", "bg-warning"],
  ["destructive", "bg-destructive"],
  ["info", "bg-info"],
];

export default function DesignSystemPage() {
  const reduce = useReducedMotion();
  const enter = reduce ? presets.pageEnterReduced : presets.pageEnter;
  const [tab, setTab] = useState("type");

  return (
    <motion.main
      className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-10"
      initial={enter.initial}
      animate={enter.animate}
      transition={enter.transition}
    >
      <header className="space-y-2">
        <p className="font-mono text-xs text-text-tertiary">/dev/design-system</p>
        <h1 className="text-display font-display">Design system</h1>
        <p className="text-text-secondary">
          Dark is the default. This page is not in the teacher navigation.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Color</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {swatches.map(([name, tone]) => (
            <div key={name} className="space-y-1">
              <div className={`h-12 rounded-md border border-border ${tone}`} />
              <p className="font-mono text-[10px] text-text-tertiary">{name}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Buttons and icon</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Tooltip label="Search" kbd="⌘K">
            <Button variant="ghost" size="icon" aria-label="Search">
              <Icon icon={Search} />
            </Button>
          </Tooltip>
          <Kbd>⌘K</Kbd>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Inputs</h2>
        <Input placeholder="Input" aria-label="Sample input" />
        <Textarea placeholder="Textarea" aria-label="Sample textarea" />
        <Tabs
          tabs={[
            { id: "type", label: "Type" },
            { id: "motion", label: "Motion" },
          ]}
          value={tab}
          onValueChange={setTab}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Motion presets</h2>
        <ul className="space-y-2 overflow-hidden">
          {["press", "page", "sheet", "drawer", "list"].map((name, index) => {
            const item = reduce
              ? presets.crossfade
              : name === "page"
                ? presets.pageEnter
                : name === "sheet"
                  ? presets.sheet
                  : name === "drawer"
                    ? presets.drawer
                    : name === "press"
                      ? {
                          initial: { scale: 1 },
                          animate: { scale: 1 },
                          transition: presets.press.transition,
                        }
                      : presets.listItem(index);
            return (
              <motion.li
                key={name}
                className="surface-1 rounded-lg px-3 py-2 text-sm"
                initial={item.initial}
                animate={item.animate}
                whileTap={name === "press" && !reduce ? presets.press.whileTap : undefined}
                transition={item.transition}
              >
                {name}
                {reduce ? " · crossfade" : ""}
              </motion.li>
            );
          })}
        </ul>
      </section>
    </motion.main>
  );
}
