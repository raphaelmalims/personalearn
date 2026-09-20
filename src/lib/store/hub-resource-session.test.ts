import { describe, expect, it } from "vitest";
import { useHubEvalSessionStore } from "./hub-eval-session";
import { useHubResourceSessionStore } from "./hub-resource-session";

function resetStores() {
  useHubResourceSessionStore.setState({
    openResourceId: null,
    classId: null,
    fullscreen: false,
  });
  useHubEvalSessionStore.setState({
    expanded: false,
    classId: null,
    batchId: null,
    assessmentId: null,
    scriptId: null,
    view: "batch",
    composerHint: null,
  });
}

describe("useHubResourceSessionStore", () => {
  it("opens a resource on Hub and replaces an eval sheet", () => {
    resetStores();
    useHubEvalSessionStore.getState().openBatch({
      classId: "class-1",
      batchId: "batch-1",
    });
    expect(useHubEvalSessionStore.getState().expanded).toBe(true);

    useHubResourceSessionStore.getState().openResource({
      classId: "class-1",
      resourceId: "res-1",
    });

    expect(useHubResourceSessionStore.getState()).toMatchObject({
      classId: "class-1",
      openResourceId: "res-1",
      fullscreen: false,
    });
    expect(useHubEvalSessionStore.getState().expanded).toBe(false);
  });

  it("swaps the open file without clearing the session", () => {
    resetStores();
    useHubResourceSessionStore.getState().openResource({
      classId: "class-1",
      resourceId: "res-1",
    });
    useHubResourceSessionStore.getState().openResource({
      classId: "class-1",
      resourceId: "res-2",
    });
    expect(useHubResourceSessionStore.getState().openResourceId).toBe("res-2");
  });

  it("closes the reader from fullscreen", () => {
    resetStores();
    useHubResourceSessionStore.getState().openResource({
      classId: "class-1",
      resourceId: "res-1",
    });
    useHubResourceSessionStore.getState().setFullscreen(true);
    expect(useHubResourceSessionStore.getState().fullscreen).toBe(true);
    useHubResourceSessionStore.getState().close();
    expect(useHubResourceSessionStore.getState().openResourceId).toBeNull();
    expect(useHubResourceSessionStore.getState().fullscreen).toBe(false);
  });
});
