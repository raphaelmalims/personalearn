import { QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  prefetchResourceDetail,
  resourceQueryKey,
  resourcesQueryKey,
} from "./use-resources";

describe("resource query cache", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("keeps list and detail on separate keys and reuses a warm detail cache", async () => {
    expect(resourcesQueryKey("class-1")).toEqual(["resources", "class-1"]);
    expect(resourceQueryKey("res-1")).toEqual(["resource", "res-1"]);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        resource: { id: "res-1", class_id: "class-1" },
        viewUrl: null,
        previewText: "cached body",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await prefetchResourceDetail(queryClient, "res-1");
    await prefetchResourceDetail(queryClient, "res-1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(resourceQueryKey("res-1"))).toMatchObject({
      previewText: "cached body",
    });
  });
});
