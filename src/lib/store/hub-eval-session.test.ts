import { describe, expect, it } from "vitest";
import { useHubEvalSessionStore } from "./hub-eval-session";

describe("useHubEvalSessionStore", () => {
  it("opens a batch session then a script without leaving Hub", () => {
    useHubEvalSessionStore.setState({
      expanded: false,
      classId: null,
      batchId: null,
      assessmentId: null,
      scriptId: null,
      view: "batch",
      composerHint: null,
    });

    useHubEvalSessionStore.getState().openBatch({
      classId: "class-1",
      batchId: "batch-1",
      assessmentId: "assess-1",
    });
    expect(useHubEvalSessionStore.getState()).toMatchObject({
      expanded: true,
      view: "batch",
      batchId: "batch-1",
    });

    useHubEvalSessionStore.getState().openScript("script-1");
    expect(useHubEvalSessionStore.getState().view).toBe("script");
    expect(useHubEvalSessionStore.getState().scriptId).toBe("script-1");

    useHubEvalSessionStore.getState().backToQueue();
    expect(useHubEvalSessionStore.getState().view).toBe("batch");
    expect(useHubEvalSessionStore.getState().scriptId).toBeNull();

    useHubEvalSessionStore.getState().collapse();
    expect(useHubEvalSessionStore.getState().expanded).toBe(false);
  });
});
