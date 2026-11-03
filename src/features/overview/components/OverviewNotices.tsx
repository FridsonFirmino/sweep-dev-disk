import { AlertTriangle, CheckCircle2, X } from "lucide-react";
import { formatBytes } from "@/lib/format";
import type { CleanupResult } from "@/types/domain";

export function DemoNotice() {
  if (!import.meta.env.DEV || !new URLSearchParams(window.location.search).has("demo")) {
    return null;
  }

  return (
    <p className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-[11px] text-secondary">
      <AlertTriangle className="size-3.5" aria-hidden="true" />
      Development demo data — no real folders are being scanned.
    </p>
  );
}

export function ErrorNotice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      role="alert"
      className="mt-5 flex items-start gap-3 rounded-md border border-error/30 bg-error/10 p-3 text-[13px] text-error"
    >
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1">{message}</p>
      <button
        type="button"
        title="Dismiss error"
        aria-label="Dismiss error"
        onClick={onDismiss}
        className="rounded p-1 hover:bg-error/10 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function CleanupSuccessNotice({ result }: { result: CleanupResult }) {
  return (
    <div
      role="status"
      className="mt-5 flex items-center gap-2 rounded-md border border-success/30 bg-success/10 p-3 text-[13px] text-success"
    >
      <CheckCircle2 className="size-4" aria-hidden="true" />
      Reclaimed {formatBytes(result.reclaimedBytes)}.
    </div>
  );
}
