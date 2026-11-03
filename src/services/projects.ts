import { demoProjects } from "@/services/demo-data";
import type { CleanupResult, CleanupSelection, ScanProgress, ScanResult } from "@/types/domain";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export class BackendUnavailableError extends Error {
  constructor(operation: string) {
    super(`The ${operation} service is not available in this build.`);
    this.name = "BackendUnavailableError";
  }
}

function getDemoMode(): string | null {
  if (!import.meta.env.DEV || typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("demo");
}

export function getInitialProjects() {
  return getDemoMode() === "results" ? demoProjects : [];
}

function wait(delayMs: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(resolve, delayMs);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        reject(new DOMException("The scan was cancelled.", "AbortError"));
      },
      { once: true },
    );
  });
}

async function runDemoScan(
  onProgress: (progress: ScanProgress) => void,
  signal: AbortSignal,
): Promise<ScanResult> {
  const demoMode = getDemoMode();
  if (demoMode === "error")
    throw new Error("Demo error: access to the selected folder was denied.");

  const paths = [
    "/home/ines/Projects",
    "/home/ines/Projects/sweep-dev-disk",
    "/home/ines/Projects/notes-app",
    "/home/ines/Projects/api-service",
  ];
  for (const [index, currentPath] of paths.entries()) {
    await wait(550, signal);
    onProgress({
      currentPath,
      projectsFound: Math.max(0, index),
      artifactsFound: index * 2,
      completed: index + 1,
      total: paths.length,
    });
  }

  return { projects: demoProjects, completedAt: new Date().toISOString() };
}

export async function scanProjects(
  onProgress: (progress: ScanProgress) => void,
  signal: AbortSignal,
): Promise<ScanResult> {
  if (getDemoMode()) return runDemoScan(onProgress, signal);

  let unlisten = () => {};
  try {
    unlisten = await listen<ScanProgress>("scan-progress", ({ payload }) => onProgress(payload));
    return await invoke<ScanResult>("scan_projects");
  } catch (error) {
    if (error instanceof Error && error.message.includes("not available")) throw error;
    throw new BackendUnavailableError("project scanning");
  } finally {
    unlisten();
  }
}

export async function cancelScan() {
  if (getDemoMode()) return;
  await invoke("cancel_scan");
}

export async function cleanArtifacts(selection: CleanupSelection): Promise<CleanupResult> {
  if (getDemoMode()) {
    const project = demoProjects.find((item) => item.id === selection.projectId);
    const artifacts =
      project?.artifacts.filter((item) => selection.artifactIds.includes(item.id)) ?? [];
    return {
      removedArtifactIds: artifacts.map((artifact) => artifact.id),
      reclaimedBytes: artifacts.reduce((sum, artifact) => sum + artifact.reclaimableBytes, 0),
      failures: [],
    };
  }
  try {
    return await invoke<CleanupResult>("cleanup_artifacts", { selection });
  } catch {
    throw new BackendUnavailableError("cleanup");
  }
}
