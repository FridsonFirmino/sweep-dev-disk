import { ProjectRow } from "@/features/overview/components/ProjectRow";
import type { Project } from "@/types/domain";
import { useState } from "react";

interface ProjectListProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelect: (projectId: string) => void;
}

function reclaimableBytes(project: Project): number {
  return project.artifacts.reduce((sum, artifact) => sum + artifact.reclaimableBytes, 0);
}

export function ProjectList({ projects, selectedProjectId, onSelect }: ProjectListProps) {
  const [onlyRecoverable, setOnlyRecoverable] = useState(true);

  const visibleProjects = onlyRecoverable
    ? projects.filter((project) => reclaimableBytes(project) > 0)
    : projects;
  const hiddenCount = projects.length - visibleProjects.length;

  return (
    <section aria-labelledby="projects-heading" className="min-w-0">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 id="projects-heading" className="text-[15px] font-semibold">
            Projectos
          </h2>
          <span className="text-xs text-muted">
            {onlyRecoverable
              ? `${visibleProjects.length} com espaço recuperável`
              : "Ordenados pela actividade recente"}
          </span>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-secondary">
          <input
            type="checkbox"
            checked={onlyRecoverable}
            onChange={(event) => setOnlyRecoverable(event.currentTarget.checked)}
            className="size-3.5 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
          Só com espaço recuperável
        </label>
      </div>
      <div className="divide-y divide-border rounded-md border border-border">
        <div className="grid grid-cols-[minmax(0,1fr)_130px_140px_92px_110px_20px] gap-3 bg-sidebar px-3.5 py-2 text-[10px] font-medium uppercase tracking-wide text-muted">
          <span>Projecto</span>
          <span>Tecnologia</span>
          <span>Última alteração</span>
          <span>Artefactos</span>
          <span className="text-right">Recuperável</span>
          <span />
        </div>
        {visibleProjects.length === 0 ? (
          <p className="px-3.5 py-6 text-center text-xs text-secondary">
            {projects.length === 0
              ? "Não foram encontrados projectos."
              : `Nenhum projecto com espaço recuperável${hiddenCount > 0 ? ` (${hiddenCount} ocultado(s))` : ""}.`}
          </p>
        ) : (
          visibleProjects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              selected={project.id === selectedProjectId}
              onClick={() => onSelect(project.id)}
            />
          ))
        )}
      </div>
      {onlyRecoverable && hiddenCount > 0 && (
        <p className="mt-2 text-[11px] text-muted">
          {hiddenCount} projecto(s) sem espaço recuperável foram ocultados.
        </p>
      )}
    </section>
  );
}
