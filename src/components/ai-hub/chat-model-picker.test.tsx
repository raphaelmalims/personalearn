import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ChatModelPicker,
  placeChatMenu,
} from "@/components/ai-hub/chat-model-picker";
import {
  resolveChatSettings,
  type ChatSettingsChoice,
} from "@/lib/ai/chat-settings";

afterEach(() => cleanup());

const defaults = {
  modelId: "deepseek-flash",
  thinking: "enabled" as const,
  effort: "low" as const,
};

function Harness({
  initial,
  onChange,
}: {
  initial: ChatSettingsChoice | (Omit<ChatSettingsChoice, "effort"> & { effort: "medium" });
  onChange?: (choice: ChatSettingsChoice) => void;
}) {
  const [choice, setChoice] = useState(initial);
  return (
    <ChatModelPicker
      settings={resolveChatSettings(choice, defaults)}
      onChange={(next) => {
        setChoice(next);
        onChange?.(next);
      }}
    />
  );
}

describe("placeChatMenu", () => {
  it("opens upward when the pill is near the bottom", () => {
    const placed = placeChatMenu(
      { top: 700, bottom: 732, left: 200, right: 280 },
      { width: 1024, height: 768 }
    );
    expect(placed.openUp).toBe(true);
    expect(placed.bottom).toBeGreaterThan(0);
    expect(placed.top).toBeUndefined();
  });

  it("stays on screen at 360px", () => {
    const placed = placeChatMenu(
      { top: 40, bottom: 72, left: 280, right: 352 },
      { width: 360, height: 640 }
    );
    expect(placed.left).toBeGreaterThanOrEqual(8);
    expect(placed.left + placed.width).toBeLessThanOrEqual(352);
    expect(placed.openUp).toBe(false);
  });
});

describe("ChatModelPicker", () => {
  it("shows effort on the pill and keeps the model name in the menu", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={{ modelId: "deepseek-flash", thinking: "enabled", effort: "low" }}
      />
    );
    const button = screen.getByRole("button", { name: "Low" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("title", "Thinking · Low");
    expect(button.className).toContain("focus-visible:ring-ring");
    expect(button).not.toHaveTextContent("DeepSeek");
    expect(button.querySelector("svg")).toBeNull();

    await user.click(button);
    const menu = screen.getByRole("menu", { name: "Model and thinking" });
    expect(menu.parentElement).toBe(document.body);
    expect(menu.className).toContain("fixed");
    expect(menu.className).toContain("z-50");
    expect(screen.getByRole("menuitemradio", { name: "DeepSeek Flash" })).toBeVisible();
  });

  it("shows Off when thinking is disabled", () => {
    render(
      <Harness
        initial={{ modelId: "deepseek-flash", thinking: "disabled", effort: "high" }}
      />
    );
    const button = screen.getByRole("button", { name: "Off" });
    expect(button).toHaveAttribute("title", "Thinking off");
    expect(button).not.toHaveTextContent("High");
  });

  it("closes on Escape and outside click, returning focus to the pill", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={{ modelId: "deepseek-flash", thinking: "enabled", effort: "high" }}
      />
    );
    const button = screen.getByRole("button", { name: "High" });
    await user.click(button);
    expect(screen.getByRole("menu")).toBeVisible();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(button).toHaveFocus();

    await user.click(button);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
    expect(button).toHaveFocus();
  });

  it("changes model, thinking, and effort without putting the model on the pill", async () => {
    const user = userEvent.setup();
    const onChange = viChange();
    render(
      <Harness
        initial={{ modelId: "deepseek-flash", thinking: "enabled", effort: "low" }}
        onChange={onChange.fn}
      />
    );

    await user.click(screen.getByRole("button", { name: "Low" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Grok 3 Mini" }));
    expect(onChange.calls[0]).toEqual({
      modelId: "grok-3-mini",
      thinking: "enabled",
      effort: "low",
    });
    expect(screen.getByRole("button", { name: "Low" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Grok/ })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Low" }));
    expect(screen.queryByRole("menuitemradio", { name: "Medium" })).toBeNull();
    expect(screen.getByRole("menuitemradio", { name: "Off" })).toBeVisible();
    expect(screen.getByRole("menuitemradio", { name: "High" })).toBeVisible();
    await user.click(screen.getByRole("menuitemradio", { name: "Off" }));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getByRole("button", { name: "Off" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Off" }));
    await user.click(screen.getByRole("menuitemradio", { name: "High" }));
    expect(onChange.calls.at(-1)).toEqual({
      modelId: "grok-3-mini",
      thinking: "enabled",
      effort: "high",
    });
    expect(screen.getByRole("button", { name: "High" })).toHaveFocus();
  });

  it("shows High when a stored medium effort is read", async () => {
    const user = userEvent.setup();
    render(
      <Harness
        initial={{
          modelId: "deepseek-flash",
          thinking: "enabled",
          effort: "medium",
        }}
      />
    );
    const button = screen.getByRole("button", { name: "High" });
    expect(screen.queryByRole("button", { name: "Medium" })).toBeNull();
    await user.click(button);
    expect(screen.queryByRole("menuitemradio", { name: "Medium" })).toBeNull();
    expect(screen.getByRole("menuitemradio", { name: "High" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
  });
});

function viChange() {
  const calls: ChatSettingsChoice[] = [];
  return {
    calls,
    fn: (choice: ChatSettingsChoice) => {
      calls.push(choice);
    },
  };
}
