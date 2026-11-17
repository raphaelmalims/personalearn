import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { DropdownMenu, DropdownMenuItem } from "./dropdown-menu";

afterEach(() => cleanup());

function Menu() {
  return (
    <DropdownMenu
      trigger={<button type="button">Open menu</button>}
    >
      {Array.from({ length: 12 }, (_, index) => (
        <DropdownMenuItem key={index}>Item {index + 1}</DropdownMenuItem>
      ))}
    </DropdownMenu>
  );
}

describe("DropdownMenu", () => {
  it("scrolls a tall list and closes on Escape and outside click", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <Menu />
        <button type="button">Outside</button>
      </div>
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const panel = document.querySelector("[data-pl-dropdown-panel]");
    expect(panel).toHaveAttribute("role", "menu");
    expect(panel?.className).toContain("max-h-");
    expect(panel?.className).toContain("overflow-y-auto");
    expect(screen.getByRole("menuitem", { name: "Item 12" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(document.querySelector("[data-pl-dropdown-panel]")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Outside" }));
    expect(document.querySelector("[data-pl-dropdown-panel]")).toBeNull();
  });
});
