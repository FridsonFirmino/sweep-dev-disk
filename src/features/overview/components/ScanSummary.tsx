import { formatBytes } from "@/lib/format";
import type { DiskSpace, Project } from "@/types/domain";

export function ScanSummary({ projects, disks }: { projects: Project[]; disks: DiskSpace[] }) {
  const recoverableBytes = projects.reduce(
    (total, project) =>
      total + project.artifacts.reduce((sum, artifact) => sum + artifact.reclaimableBytes, 0),
    0,
  );
  const totalDiskBytes = disks.reduce((total, disk) => total + disk.totalBytes, 0);
  const availableDiskBytes = disks.reduce((total, disk) => total + disk.availableBytes, 0);
  const multipleDisks = disks.length > 1;

  return (
    <section
      aria-label="Resumo da análise"
      className="flex flex-wrap gap-x-10 gap-y-5 border-b border-border py-5"
    >
      <SummaryValue label="Projectos encontrados" value={String(projects.length)} />
      {disks.length > 0 && (
        <>
          <SummaryValue
            label={multipleDisks ? "Capacidade total dos discos" : "Capacidade do disco"}
            value={formatBytes(totalDiskBytes)}
          />
          <SummaryValue
            label={multipleDisks ? "Disponível nos discos" : "Espaço disponível"}
            value={formatBytes(availableDiskBytes)}
          />
        </>
      )}
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
