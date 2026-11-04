import { formatBytes } from "@/lib/format";
import { secondaryButton } from "@/lib/styles";
import { listCleanupHistory, restoreCleanupEntry } from "@/services/projects";
import type { CleanupHistoryEntry } from "@/types/domain";
import { History, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function formatFinishedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-PT", { dateStyle: "medium", timeStyle: "short" });
}

function projectLabel(projectId: string): string {
  const parts = projectId.split(/[\\/]/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : projectId;
}

export function CleanupHistoryPage() {
  const [entries, setEntries] = useState<CleanupHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEntries(await listCleanupHistory());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar o histórico.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRestore(entry: CleanupHistoryEntry) {
    setRestoringId(entry.id);
    setError(null);
    setNotice(null);
    try {
      const restored = await restoreCleanupEntry(entry);
      setNotice(
        restored === 1
          ? "Item restaurado a partir do lixo."
          : `${restored} itens restaurados a partir do lixo.`,
      );
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível restaurar a partir do lixo.",
      );
    } finally {
      setRestoringId(null);
    }
  }

  return (
    <div className="mx-auto max-w-360 px-8 py-8">
      <header className="mb-7 border-b border-border pb-5">
        <h1 className="text-2xl font-semibold tracking-tight">Histórico de limpezas</h1>
        <p className="mt-1.5 text-[13px] text-secondary">
          Registo local das limpezas executadas. O histórico é limitado a 90 dias e 200 entradas.
          Restaurar usa o lixo do sistema quando disponível.
        </p>
      </header>

      {error && (
        <div
          role="alert"
          className="mb-4 rounded-md border border-error/30 bg-error/10 p-3 text-[13px] text-error"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="mb-4 rounded-md border border-success/30 bg-success/10 p-3 text-[13px] text-success"
        >
          {notice}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-secondary" role="status">
          A carregar o histórico…
        </p>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-8 text-center">
          <History className="mx-auto size-8 text-muted" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium">Ainda não há limpezas registadas</p>
          <p className="mt-1 text-xs text-secondary">
            As limpezas confirmadas aparecem aqui para consulta e restauro.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-start gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">{projectLabel(entry.projectId)}</p>
                <p className="mt-0.5 break-all font-mono text-[11px] text-muted">
                  {entry.projectId}
                </p>
                <p className="mt-1.5 text-xs text-secondary">
                  {formatFinishedAt(entry.finishedAt)} · {entry.removedArtifactIds.length}{" "}
                  artefacto(s) · {formatBytes(entry.reclaimedBytes)}
                  {entry.failureCount > 0 && ` · ${entry.failureCount} falha(s)`}
                </p>
                {entry.removedArtifactIds.length > 0 && (
                  <ul className="mt-2 list-inside list-disc space-y-0.5">
                    {entry.removedArtifactIds.slice(0, 8).map((path) => (
                      <li key={path} className="break-all font-mono text-[10px] text-muted">
                        {path}
                      </li>
                    ))}
                    {entry.removedArtifactIds.length > 8 && (
                      <li className="text-[10px] text-muted">
                        +{entry.removedArtifactIds.length - 8} mais…
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <button
                type="button"
                disabled={!entry.restorable || restoringId !== null}
                onClick={() => void handleRestore(entry)}
                className={`${secondaryButton} shrink-0`}
                title={
                  entry.restorable
                    ? "Restaurar a partir do lixo do sistema"
                    : "Restauro não disponível para esta entrada"
                }
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                {restoringId === entry.id ? "A restaurar…" : "Anular"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
