import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HubResourceSessionHost } from "./hub-resource-session-host";
import { useHubResourceSessionStore } from "@/lib/store/hub-resource-session";

vi.mock("@/lib/hooks/use-is-mobile", () => ({
  useIsMobile: () => false,
}));

vi.mock("@/lib/hooks/use-resources", () => ({
  useResource: () => ({
    data: {
      resource: {
        id: "res-1",
        class_id: "class-1",
        title: "Week 3 notes",
        raw_content: { text: "hello" },
        ai_generated: false,
        resource_type: "lesson_notes",
        status: "active",
        created_at: "2026-09-01T00:00:00.000Z",
        updated_at: "2026-09-01T00:00:00.000Z",
      },
      viewUrl: null,
      previewText: "hello",
    },
    isLoading: false,
    error: null,
    isFetching: false,
    dataUpdatedAt: 1,
  }),
}));

vi.mock("@/components/classes/resource-viewer", () => ({
  ResourceViewer: () => <div>viewer</div>,
  ResourceViewerSkeleton: () => <div>loading</div>,
}));

afterEach(() => {
  cleanup();
  useHubResourceSessionStore.setState({
    openResourceId: null,
    classId: null,
    fullscreen: false,
  });
});

describe("HubResourceSessionHost", () => {
  it("exits full-screen on the first Escape, then closes the reader", () => {
    useHubResourceSessionStore.setState({
      openResourceId: "res-1",
      classId: "class-1",
      fullscreen: true,
    });

    render(<HubResourceSessionHost />);
    expect(screen.getByRole("region", { name: "Resource reader" })).toBeVisible();

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(useHubResourceSessionStore.getState().fullscreen).toBe(false);
    expect(useHubResourceSessionStore.getState().openResourceId).toBe("res-1");

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(useHubResourceSessionStore.getState().openResourceId).toBeNull();
  });
});
