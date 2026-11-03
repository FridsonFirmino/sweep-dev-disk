import { ChevronRight, Folder } from "lucide-react";
import { formatBytes } from "@/lib/format";
import type { Project } from "@/types/domain";

interface ProjectRowProps {
  project: Project;
  selected: boolean;
  onClick: () => void;
}

export function ProjectRow({ project, selected, onClick }: ProjectRowProps) {
  const reclaimable = project.artifacts.reduce(
    (sum, artifact) => sum + artifact.reclaimableBytes,
    0,
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={selected}
      className={`grid w-full grid-cols-[minmax(0,1fr)_150px_92px_110px_20px] items-center gap-4 px-3.5 py-3 text-left focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-primary ${selected ? "bg-selected" : "hover:bg-hover"}`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Folder className="size-4 shrink-0 text-secondary" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium">{project.name}</span>
          <span
            className="mt-0.5 block truncate font-mono text-[11px] text-muted"
            title={project.path}
          >
            {project.path}
          </span>
        </span>
      </span>
      <span className="truncate text-xs text-secondary" title={project.technology}>
        {project.technology}
      </span>
      <span className="text-xs text-secondary">{project.artifacts.length} artefactos</span>
      <span className="text-right text-xs font-medium tabular-nums">
        {formatBytes(reclaimable)}
      </span>
      <ChevronRight
        className={`size-4 text-muted transition-transform ${selected ? "rotate-90" : ""}`}
        aria-hidden="true"
      />
    </button>
  );
}
