import { formatBytes } from "@/lib/format";
import type { Project } from "@/types/domain";

export function ScanSummary({ projects }: { projects: Project[] }) {
  const recoverableBytes = projects.reduce(
    (total, project) =>
      total + project.artifacts.reduce((sum, artifact) => sum + artifact.reclaimableBytes, 0),
    0,
  );

  return (
    <section aria-label="Resumo da análise" className="flex gap-10 border-b border-border py-5">
      <SummaryValue label="Projectos encontrados" value={String(projects.length)} />
      <SummaryValue
        label="Espaço potencialmente recuperável"
        value={formatBytes(recoverableBytes)}
      />
    </section>
  );
}

function SummaryValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-secondary">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}
