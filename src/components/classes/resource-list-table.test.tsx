import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Resource } from "@/types/database";
import { ResourceListTable } from "./resource-list-table";

vi.mock("@/lib/hooks/use-resources", () => ({
  useDeleteResource: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  }),
}));

const resource: Resource = {
  id: "res-1",
  class_id: "class-1",
  title: "Week 3 notes",
  raw_content: {},
  ai_generated: false,
  resource_type: "lesson_notes",
  status: "active",
  created_at: "2026-09-01T00:00:00.000Z",
  updated_at: "2026-09-01T00:00:00.000Z",
};

afterEach(() => cleanup());

describe("ResourceListTable", () => {
  it("opens and prefetches without navigating away from Hub", async () => {
    const user = userEvent.setup();
    const onOpenResource = vi.fn();
    const onPrefetchResource = vi.fn();

    render(
      <ResourceListTable
        classId="class-1"
        resources={[resource]}
        compact
        selectedResourceId="res-1"
        onOpenResource={onOpenResource}
        onPrefetchResource={onPrefetchResource}
      />
    );

    const row = screen.getAllByRole("button", { name: "Open Week 3 notes" })[0];
    expect(row).toHaveAttribute("aria-current", "true");
    await user.hover(row);
    expect(onPrefetchResource).toHaveBeenCalledWith("res-1");
    await user.click(row);
    expect(onOpenResource).toHaveBeenCalledWith("res-1");
    expect(screen.queryByRole("link")).toBeNull();
  });
});
