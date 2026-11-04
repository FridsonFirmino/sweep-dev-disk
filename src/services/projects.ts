import type {
  CleanupResult,
  CleanupSelection,
  ScanOptions,
  ScanProgress,
  ScanResult,
} from "@/types/domain";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export class BackendUnavailableError extends Error {
  constructor(operation: string) {
    super(`O serviço de ${operation} não está disponível nesta versão.`);
    this.name = "BackendUnavailableError";
  }
}

export async function scanProjects(
  options: ScanOptions,
  onProgress: (progress: ScanProgress) => void,
  signal: AbortSignal,
): Promise<ScanResult> {
  let unlisten = () => {};
  try {
    if (signal.aborted) throw new DOMException("A análise foi cancelada.", "AbortError");
    unlisten = await listen<ScanProgress>("scan-progress", ({ payload }) => onProgress(payload));
    if (signal.aborted) throw new DOMException("A análise foi cancelada.", "AbortError");
    const result = await invoke<ScanResult>("scan_projects", { options });
    if (signal.aborted) throw new DOMException("A análise foi cancelada.", "AbortError");
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (signal.aborted || message.includes("scan_cancelled")) {
      throw new DOMException("A análise foi cancelada.", "AbortError");
    }
    if (message.includes("scan_already_running")) {
      throw new Error("Já existe uma análise em curso.");
    }
    throw new BackendUnavailableError("análise de projectos");
  } finally {
    unlisten();
  }
}

export async function cancelScan() {
  await invoke("cancel_scan");
}

export async function cleanArtifacts(selection: CleanupSelection): Promise<CleanupResult> {
  try {
    return await invoke<CleanupResult>("cleanup_artifacts", { selection });
  } catch {
    throw new BackendUnavailableError("limpeza");
  }
}
