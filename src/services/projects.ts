import type {
  CleanupHistoryEntry,
  CleanupRequest,
  CleanupResult,
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

const cleanupErrorMessages: Record<string, string> = {
  cleanup_already_running: "Já existe uma limpeza em curso.",
  cleanup_invalid_request: "A selecção de artefactos é inválida.",
  cleanup_state_unavailable: "O serviço de limpeza não está disponível.",
  cleanup_failed: "Não foi possível concluir a limpeza.",
  cleanup_path_outside_roots: "Um caminho está fora dos directórios configurados.",
  cleanup_path_excluded: "Um caminho está num directório excluído.",
  cleanup_not_an_artifact: "Um caminho não corresponde a um artefacto suportado.",
  cleanup_invalid_target: "Um destino não é válido para remoção.",
  cleanup_trash_unavailable: "O lixo do sistema não está disponível.",
  cleanup_limit_reached: "O pedido excede o limite de artefactos.",
};

function mapCleanupError(error: unknown): Error {
  const code =
    typeof error === "string" ? error : error instanceof Error ? error.message : String(error);
  const match = Object.entries(cleanupErrorMessages).find(([key]) => code.includes(key));
  if (match) return new Error(match[1]);
  return new BackendUnavailableError("limpeza");
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

export async function cleanArtifacts(request: CleanupRequest): Promise<CleanupResult> {
  try {
    return await invoke<CleanupResult>("cleanup_artifacts", { request });
  } catch (error) {
    throw mapCleanupError(error);
  }
}

export async function listCleanupHistory(): Promise<CleanupHistoryEntry[]> {
  try {
    return await invoke<CleanupHistoryEntry[]>("list_cleanup_history");
  } catch {
    throw new BackendUnavailableError("histórico de limpezas");
  }
}

export async function restoreCleanupEntry(entry: CleanupHistoryEntry): Promise<number> {
  try {
    return await invoke<number>("restore_cleanup_entry", { entry });
  } catch (error) {
    throw mapCleanupError(error);
  }
}
