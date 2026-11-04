import { BackendUnavailableError, cleanArtifacts, listCleanupHistory } from "@/services/projects";
import { beforeEach, describe, expect, it, vi } from "vitest";

const invokeMock = vi.fn();

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(async () => () => {}),
}));

describe("cleanup service", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("invokes cleanup_artifacts with the request payload", async () => {
    const request = {
      selection: { projectId: "/p", artifactIds: ["/p/node_modules"] },
      projectDirectories: ["/p"],
      excludedDirectories: [],
      dryRun: true,
    };
    invokeMock.mockResolvedValue({
      dryRun: true,
      removedArtifactIds: [],
      wouldRemoveArtifactIds: ["/p/node_modules"],
      reclaimedBytes: 10,
      failures: [],
    });

    const result = await cleanArtifacts(request);

    expect(invokeMock).toHaveBeenCalledWith("cleanup_artifacts", { request });
    expect(result.wouldRemoveArtifactIds).toEqual(["/p/node_modules"]);
  });

  it("maps backend error codes to portuguese messages", async () => {
    invokeMock.mockRejectedValue("cleanup_already_running");
    await expect(
      cleanArtifacts({
        selection: { projectId: "/p", artifactIds: ["/p/node_modules"] },
        projectDirectories: ["/p"],
        excludedDirectories: [],
        dryRun: false,
      }),
    ).rejects.toThrow("Já existe uma limpeza em curso.");
  });

  it("falls back to BackendUnavailableError for unknown failures", async () => {
    invokeMock.mockRejectedValue("something_else");
    await expect(
      cleanArtifacts({
        selection: { projectId: "/p", artifactIds: ["/p/node_modules"] },
        projectDirectories: ["/p"],
        excludedDirectories: [],
        dryRun: false,
      }),
    ).rejects.toBeInstanceOf(BackendUnavailableError);
  });

  it("lists cleanup history entries", async () => {
    invokeMock.mockResolvedValue([]);
    await expect(listCleanupHistory()).resolves.toEqual([]);
    expect(invokeMock).toHaveBeenCalledWith("list_cleanup_history");
  });
});
