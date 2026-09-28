import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MobileHubToolbar } from "@/components/ai-hub/mobile-hub-toolbar";

afterEach(() => cleanup());

describe("MobileHubToolbar", () => {
  it("sticks the drawer and new-chat controls to the top of the scrollport", () => {
    render(
      <MobileHubToolbar
        title="Week 3 fractions"
        onOpenPanel={() => undefined}
        onNewConversation={() => undefined}
      />
    );

    const toolbar = screen.getByText("Week 3 fractions").parentElement;
    expect(toolbar).toHaveAttribute("data-mobile-hub-toolbar");
    expect(toolbar).toHaveClass("fixed", "top-0", "inset-x-0", "md:hidden");
    expect(screen.getByRole("button", { name: "Open hub panel" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "New conversation" })
    ).toBeVisible();
  });

  it("opens the panel and starts a chat from the sticky controls", async () => {
    const user = userEvent.setup();
    const onOpenPanel = vi.fn();
    const onNewConversation = vi.fn();
    render(
      <MobileHubToolbar
        title="Week 3 fractions"
        onOpenPanel={onOpenPanel}
        onNewConversation={onNewConversation}
      />
    );

    await user.click(screen.getByRole("button", { name: "Open hub panel" }));
    await user.click(screen.getByRole("button", { name: "New conversation" }));
    expect(onOpenPanel).toHaveBeenCalledOnce();
    expect(onNewConversation).toHaveBeenCalledOnce();
  });
});
