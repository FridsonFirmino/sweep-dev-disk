import { formatBytes } from "@/lib/format";
import { destructiveButton, secondaryButton } from "@/lib/styles";
import type { Artifact, CleanupResult, Project } from "@/types/domain";
import { AlertTriangle, FlaskConical, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CleanupReviewDialogProps {
  project: Project;
  artifacts: Artifact[];
  simulating: boolean;
  cleaning: boolean;
  simulation: CleanupResult | null;
  onCancel: () => void;
  onSimulate: () => void;
  onConfirm: () => void;
}

export function CleanupReviewDialog({
  project,
  artifacts,
  simulating,
  cleaning,
  simulation,
  onCancel,
  onSimulate,
  onConfirm,
}: CleanupReviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const total = artifacts.reduce((sum, artifact) => sum + artifact.reclaimableBytes, 0);
  const [simulated, setSimulated] = useState(false);
  const busy = simulating || cleaning;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  useEffect(() => {
    if (simulation) setSimulated(true);
  }, [simulation]);

  const simulatedIds = new Set(simulation?.wouldRemoveArtifactIds ?? []);
  const simulationFailures = simulation?.failures ?? [];
  const confirmDisabled =
    busy || (simulated && simulation !== null && simulation.wouldRemoveArtifactIds.length === 0);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cleanup-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
      onClick={(event) => event.target === event.currentTarget && !busy && onCancel()}
      className="m-auto max-h-[calc(100dvh-48px)] w-[min(100%,32rem)] overflow-auto rounded-lg border border-border bg-surface p-5 text-foreground shadow-xl backdrop:bg-black/40"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-md bg-hover text-secondary">
          <AlertTriangle className="size-4" aria-hidden="true" />
        </div>
        <div>
          <h2 id="cleanup-title" className="text-base font-semibold">
            Rever limpeza
          </h2>
          <p className="mt-1 text-xs text-secondary">
            Reveja estes caminhos antes de confirmar. A simulação valida sem remover nada.
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs font-medium">{project.name}</p>
      <p className="mt-1 break-all font-mono text-[11px] text-muted">{project.path}</p>
      <ul className="mt-4 max-h-48 divide-y divide-border overflow-auto rounded-md border border-border">
        {artifacts.map((artifact) => {
          const wouldRemove = simulation ? simulatedIds.has(artifact.id) : null;
          return (
            <li key={artifact.id} className="px-3 py-2.5">
              <p className="text-xs font-medium">
                {artifact.name}
                {wouldRemove === true && (
                  <span className="ml-2 text-[10px] font-medium text-success">seria removido</span>
                )}
                {wouldRemove === false && (
                  <span className="ml-2 text-[10px] font-medium text-error">inválido</span>
                )}
              </p>
              <p className="mt-1 break-all font-mono text-[10px] text-muted">{artifact.path}</p>
              <p className="mt-1 text-[11px] text-secondary">
                {formatBytes(artifact.reclaimableBytes)} · risco {artifact.risk}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 flex justify-between border-t border-border pt-3 text-xs">
        <span>{simulation ? "Espaço simulado a recuperar" : "Espaço estimado a recuperar"}</span>
        <strong>{formatBytes(simulation?.reclaimedBytes ?? total)}</strong>
      </p>
      {simulation && simulationFailures.length > 0 && (
        <p className="mt-2 rounded-md border border-warning/30 bg-warning/10 p-2 text-[11px] text-warning">
          {simulationFailures.length} destino(s) não passaram na validação e serão ignorados.
        </p>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" disabled={busy} onClick={onCancel} className={secondaryButton}>
          Cancelar
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onSimulate}
          className={secondaryButton}
          title="Validar destinos sem remover"
        >
          <FlaskConical className="size-4" aria-hidden="true" />
          {simulating ? "A simular…" : "Simular"}
        </button>
        <button
          type="button"
          disabled={confirmDisabled}
          onClick={onConfirm}
          className={destructiveButton}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          {cleaning ? "A limpar…" : "Confirmar limpeza"}
        </button>
      </div>
    </dialog>
  );
}
