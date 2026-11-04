import { formatBytes } from "@/lib/format";
import type { CleanupResult, ScanWarning } from "@/types/domain";
import { AlertTriangle, CheckCircle2, X } from "lucide-react";

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
        title="Fechar erro"
        aria-label="Fechar erro"
        onClick={onDismiss}
        className="rounded p-1 hover:bg-error/10 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

export function ScanWarningsNotice({ warnings }: { warnings: ScanWarning[] }) {
  const messages = warnings.map((warning) => {
    const path = warning.path ? ` (${warning.path})` : "";
    switch (warning.code) {
      case "no_scan_directories":
        return "Adicione pelo menos um directório de projectos nas Definições.";
      case "all_scan_directories_excluded":
        return "Todos os directórios de projectos estão excluídos da análise.";
      case "invalid_scan_directory":
        return `O directório de análise não é válido ou não está disponível${path}.`;
      case "invalid_excluded_directory":
        return `O directório excluído não é válido${path}.`;
      case "directory_unavailable":
        return `Não foi possível aceder a um directório durante a análise${path}.`;
      case "symlink_outside_scan_roots":
        return `Foi ignorada uma ligação simbólica para fora dos directórios seleccionados${path}.`;
      case "max_depth_reached":
        return `Foi atingida a profundidade máxima de análise${path}.`;
      case "scan_limit_reached":
        return "A análise atingiu o limite de entradas e foi concluída parcialmente.";
      case "size_overflow":
        return `O tamanho deste artefacto excede o limite de apresentação${path}.`;
      case "warnings_truncated":
        return "Existem mais avisos, a interface mostra apenas os primeiros.";
      default:
        return `A análise encontrou um aviso${path}.`;
    }
  });

  return (
    <div
      role="status"
      className="mt-4 rounded-md border border-warning/30 bg-warning/10 p-3 text-[13px] text-warning"
    >
      <p className="font-medium">A análise foi concluída com avisos.</p>
      <ul className="mt-1 list-inside list-disc space-y-1">
        {messages.map((message, index) => (
          <li key={`${index}-${message}`}>{message}</li>
        ))}
      </ul>
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
      Espaço recuperado: {formatBytes(result.reclaimedBytes)}.
    </div>
  );
}
