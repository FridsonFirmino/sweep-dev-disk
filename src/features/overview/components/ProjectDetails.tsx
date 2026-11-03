import { Clock3, Folder } from "lucide-react";
import { formatActivity, formatBytes } from "@/lib/format";
import { secondaryButton } from "@/lib/styles";
import type { Artifact, Project } from "@/types/domain";
import { ArtifactItem } from "@/features/overview/components/ArtifactItem";

interface ProjectDetailsProps {
  project: Project;
  selectedIds: string[];
  onToggle: (artifact: Artifact) => void;
  onReview: () => void;
}

export function ProjectDetails({ project, selectedIds, onToggle, onReview }: ProjectDetailsProps) {
  const selectedBytes = project.artifacts
    .filter((artifact) => selectedIds.includes(artifact.id))
    .reduce((sum, artifact) => sum + artifact.reclaimableBytes, 0);

  return (
    <aside
      aria-label={`${project.name} details`}
      className="h-fit rounded-md border border-border bg-surface"
    >
      <div className="border-b border-border p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold">{project.name}</h2>
            <p className="mt-1 truncate font-mono text-[11px] text-muted" title={project.path}>
              {project.path}
            </p>
          </div>
          <Folder className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
        </div>
        <p className="mt-3 text-xs text-secondary">{project.technology}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
          <Clock3 className="size-3.5" aria-hidden="true" />
          Active {formatActivity(project.lastActivity)}
        </p>
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[13px] font-semibold">Artifacts</h3>
          <span className="text-[11px] text-muted">{project.artifacts.length} found</span>
        </div>
        {project.artifacts.length === 0 ? (
          <p className="py-4 text-xs text-secondary">No artifacts found.</p>
        ) : (
          <ul className="space-y-1">
            {project.artifacts.map((artifact) => (
              <ArtifactItem
                key={artifact.id}
                artifact={artifact}
                checked={selectedIds.includes(artifact.id)}
                onChange={() => onToggle(artifact)}
              />
            ))}
          </ul>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          <span className="text-xs text-secondary">Selected recovery</span>
          <span className="text-xs font-semibold tabular-nums">{formatBytes(selectedBytes)}</span>
        </div>
        <button
          type="button"
          disabled={selectedIds.length === 0}
          onClick={onReview}
          className={`${secondaryButton} mt-3 w-full justify-center`}
        >
          Review cleanup
        </button>
      </div>
    </aside>
  );
}
