import { useEffect, useRef } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { formatBytes } from "@/lib/format";
import { destructiveButton, secondaryButton } from "@/lib/styles";
import type { Artifact, Project } from "@/types/domain";

interface CleanupReviewDialogProps {
  project: Project;
  artifacts: Artifact[];
  onCancel: () => void;
  onConfirm: () => void;
}

export function CleanupReviewDialog({
  project,
  artifacts,
  onCancel,
  onConfirm,
}: CleanupReviewDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const total = artifacts.reduce((sum, artifact) => sum + artifact.reclaimableBytes, 0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="cleanup-title"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      onClick={(event) => event.target === event.currentTarget && onCancel()}
      className="m-auto max-h-[calc(100dvh-48px)] w-[min(100%,32rem)] overflow-auto rounded-lg border border-border bg-surface p-5 text-foreground shadow-xl backdrop:bg-black/40"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-md bg-hover text-secondary">
          <AlertTriangle className="size-4" aria-hidden="true" />
        </div>
        <div>
          <h2 id="cleanup-title" className="text-base font-semibold">
            Review cleanup
          </h2>
          <p className="mt-1 text-xs text-secondary">
            Review these paths before confirming the cleanup.
          </p>
        </div>
      </div>
      <p className="mt-4 text-xs font-medium">{project.name}</p>
      <p className="mt-1 break-all font-mono text-[11px] text-muted">{project.path}</p>
      <ul className="mt-4 max-h-48 divide-y divide-border overflow-auto rounded-md border border-border">
        {artifacts.map((artifact) => (
          <li key={artifact.id} className="px-3 py-2.5">
            <p className="text-xs font-medium">{artifact.name}</p>
            <p className="mt-1 break-all font-mono text-[10px] text-muted">{artifact.path}</p>
            <p className="mt-1 text-[11px] text-secondary">
              {formatBytes(artifact.reclaimableBytes)} · {artifact.risk} risk
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex justify-between border-t border-border pt-3 text-xs">
        <span>Estimated space to reclaim</span>
        <strong>{formatBytes(total)}</strong>
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryButton}>
          Cancel
        </button>
        <button type="button" onClick={onConfirm} className={destructiveButton}>
          <Trash2 className="size-4" aria-hidden="true" />
          Confirm cleanup
        </button>
      </div>
    </dialog>
  );
}
