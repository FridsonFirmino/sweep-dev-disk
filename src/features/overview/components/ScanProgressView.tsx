import { LoaderCircle } from "lucide-react";
import type { ScanProgress } from "@/types/domain";

export function ScanProgressView({ progress }: { progress: ScanProgress | null }) {
  const hasMeasuredProgress =
    progress?.completed !== undefined && progress.total !== undefined && progress.total > 0;
  const percentage = hasMeasuredProgress
    ? Math.min(100, Math.round((progress.completed! / progress.total!) * 100))
    : null;

  return (
    <section
      aria-live="polite"
      className="mt-5 rounded-md border border-border bg-surface px-4 py-3.5"
    >
      <div className="flex items-center gap-2.5">
        <LoaderCircle className="size-4 animate-spin text-secondary" aria-hidden="true" />
        <span className="text-[13px] font-medium">Scanning projects…</span>
        <span className="ml-auto text-xs text-secondary">
          {progress?.projectsFound ?? 0} projects · {progress?.artifactsFound ?? 0} artifacts found
        </span>
      </div>
      {progress?.currentPath && (
        <p
          className="mt-2 truncate pl-6 font-mono text-[11px] text-muted"
          title={progress.currentPath}
        >
          {progress.currentPath}
        </p>
      )}
      {percentage !== null && (
        <div
          className="mt-3 h-1 overflow-hidden rounded-full bg-hover"
          role="progressbar"
          aria-label="Scan progress"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </section>
  );
}
