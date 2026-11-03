import { ScanLine, X } from "lucide-react";
import { primaryButton, secondaryButton } from "@/lib/styles";

interface OverviewHeaderProps {
  scanning: boolean;
  hasProjects: boolean;
  onScan: () => void;
  onCancel: () => void;
}

export function OverviewHeader({ scanning, hasProjects, onScan, onCancel }: OverviewHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-6 border-b border-border pb-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Visão geral</h1>
        <p className="mt-1.5 text-[13px] text-secondary">
          Analise os seus projectos de desenvolvimento e recupere espaço em disco.
        </p>
      </div>
      {scanning ? (
        <button type="button" onClick={onCancel} className={secondaryButton}>
          <X className="size-4" aria-hidden="true" />
          Cancelar análise
        </button>
      ) : (
        <button type="button" onClick={onScan} className={primaryButton}>
          <ScanLine className="size-4" aria-hidden="true" />
          {hasProjects ? "Analisar novamente" : "Analisar projectos"}
        </button>
      )}
    </header>
  );
}
