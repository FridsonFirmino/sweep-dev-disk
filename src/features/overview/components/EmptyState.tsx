import { FolderSearch, ScanLine } from "lucide-react";
import { primaryButton } from "@/lib/styles";

export function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <div className="flex min-h-[390px] flex-col items-center justify-center px-8 text-center">
      <FolderSearch className="size-10 text-muted" strokeWidth={1.5} aria-hidden="true" />
      <h2 className="mt-5 text-base font-semibold">Ainda não foram analisados projectos</h2>
      <p className="mt-2 max-w-md text-[13px] leading-5 text-secondary">
        Analise os seus directórios de desenvolvimento para encontrar projectos e identificar
        ficheiros de compilação desnecessários.
      </p>
      <button type="button" onClick={onScan} className={`${primaryButton} mt-5`}>
        <ScanLine className="size-4" aria-hidden="true" />
        Analisar projectos
      </button>
    </div>
  );
}
