import type { Project } from "@/types/domain";
import { ProjectRow } from "@/features/overview/components/ProjectRow";

interface ProjectListProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelect: (projectId: string) => void;
}

export function ProjectList({ projects, selectedProjectId, onSelect }: ProjectListProps) {
  return (
    <section aria-labelledby="projects-heading" className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="projects-heading" className="text-[15px] font-semibold">
          Projects
        </h2>
        <span className="text-xs text-muted">Sorted by recent activity</span>
      </div>
      <div className="divide-y divide-border rounded-md border border-border">
        <div className="grid grid-cols-[minmax(0,1fr)_150px_92px_110px_20px] gap-4 bg-sidebar px-3.5 py-2 text-[10px] font-medium uppercase tracking-wide text-muted">
          <span>Project</span>
          <span>Technology</span>
          <span>Artifacts</span>
          <span className="text-right">Recoverable</span>
          <span />
        </div>
        {projects.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            selected={project.id === selectedProjectId}
            onClick={() => onSelect(project.id)}
          />
        ))}
      </div>
    </section>
  );
}
