import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ChatModelPicker } from "@/components/ai-hub/chat-model-picker";
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
  initial: ChatSettingsChoice;
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

describe("ChatModelPicker", () => {
  it("shows the current model and thinking indicator", () => {
    render(
      <Harness
        initial={{ modelId: "deepseek-flash", thinking: "enabled", effort: "low" }}
      />
    );
    const button = screen.getByRole("button", { name: /DeepSeek Flash/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("title", "DeepSeek Flash · Thinking · Low");
    expect(button.className).toContain("focus-visible:ring-ring");
  });

  it("changes model, thinking, and effort", async () => {
    const user = userEvent.setup();
    const onChange = viChange();
    render(
      <Harness
        initial={{ modelId: "deepseek-flash", thinking: "enabled", effort: "low" }}
        onChange={onChange.fn}
      />
    );

    await user.click(screen.getByRole("button", { name: /DeepSeek Flash/ }));
    expect(screen.getByRole("menu", { name: "Model and thinking" })).toBeVisible();
    await user.click(screen.getByRole("menuitemradio", { name: "Grok 3 Mini" }));
    expect(onChange.calls[0]).toEqual({
      modelId: "grok-3-mini",
      thinking: "enabled",
      effort: "low",
    });

    await user.click(screen.getByRole("button", { name: /Grok 3 Mini/ }));
    await user.click(screen.getByRole("menuitemradio", { name: "Off" }));
    expect(screen.queryByText("Effort")).toBeNull();

    await user.click(screen.getByRole("menuitemradio", { name: "On" }));
    await user.click(screen.getByRole("menuitemradio", { name: "Medium" }));
    expect(onChange.calls.at(-1)).toEqual({
      modelId: "grok-3-mini",
      thinking: "enabled",
      effort: "medium",
    });
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
