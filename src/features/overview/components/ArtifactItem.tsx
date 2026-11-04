import { artifactRecovery, type ArtifactRecovery } from "@/lib/artifacts";
import { formatBytes } from "@/lib/format";
import type { Artifact } from "@/types/domain";
import { AlertTriangle, Download, RefreshCw, ShieldCheck } from "lucide-react";
import type { ComponentType } from "react";

interface ArtifactItemProps {
  artifact: Artifact;
  checked: boolean;
  onChange: () => void;
}

const RECOVERY_ICONS: Record<ArtifactRecovery, ComponentType<{ className?: string }>> = {
  reinstallable: Download,
  regenerable: RefreshCw,
  review: AlertTriangle,
};

const RECOVERY_TONES: Record<ArtifactRecovery, string> = {
  reinstallable: "text-success",
  regenerable: "text-success",
  review: "text-warning",
};

export function ArtifactItem({ artifact, checked, onChange }: ArtifactItemProps) {
  const recovery = artifactRecovery(artifact.name);
  const RecoveryIcon = recovery ? RECOVERY_ICONS[recovery.kind] : null;

  return (
    <li>
      <label className="flex cursor-pointer items-start gap-2.5 rounded px-1.5 py-2 hover:bg-hover">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="mt-0.5 size-3.5 accent-primary focus-visible:outline-2 focus-visible:outline-primary"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium">{artifact.name}</span>
            <span className="shrink-0 text-[11px] tabular-nums text-secondary">
              {formatBytes(artifact.sizeBytes)}
            </span>
          </span>
          <span
            className="mt-1 block truncate font-mono text-[10px] text-muted"
            title={artifact.path}
          >
            {artifact.path}
          </span>
          <span className="mt-1 flex items-center gap-1 text-[10px] capitalize text-secondary">
            <ShieldCheck className="size-3" aria-hidden="true" /> risco {artifact.risk}
          </span>
          {recovery && RecoveryIcon && (
            <span
              className={`mt-1 flex items-start gap-1 text-[10px] leading-4 ${RECOVERY_TONES[recovery.kind]}`}
            >
              <RecoveryIcon className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
              <span>
                <span className="font-medium">{recovery.label}</span>: {recovery.note}
              </span>
            </span>
          )}
        </span>
      </label>
    </li>
  );
}
