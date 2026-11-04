import supportedArtifacts from "@/data/supported-artifacts.json";
import { Archive, Info, Search } from "lucide-react";
import { useMemo, useState } from "react";

export function SupportedArtifactsPage() {
  const [search, setSearch] = useState("");
  const query = search.trim().toLocaleLowerCase("pt-PT");
  const artifacts = useMemo(
    () =>
      supportedArtifacts.filter((artifact) =>
        [artifact.name, artifact.category, artifact.description].some((value) =>
          value.toLocaleLowerCase("pt-PT").includes(query),
        ),
      ),
    [query],
  );
  const lowRiskCount = supportedArtifacts.filter((artifact) => artifact.risk === "low").length;
  const mediumRiskCount = supportedArtifacts.filter(
    (artifact) => artifact.risk === "medium",
  ).length;

  return (
    <div className="mx-auto max-w-6xl px-8 py-8">
      <header className="mb-7 border-b border-border pb-5">
        <div className="flex items-center gap-2">
          <Archive className="size-5 text-secondary" aria-hidden="true" />
          <h1 className="text-2xl font-semibold tracking-tight">Artefactos suportados</h1>
        </div>
        <p className="mt-1.5 text-[13px] text-secondary">
          Directórios que o scanner reconhece dentro dos projectos analisados.
        </p>
      </header>

      <div className="mb-6 flex items-start gap-2.5 rounded-md border border-border bg-surface p-3.5 text-[13px] text-secondary">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          Esta página é apenas informativa, ela mostra os artefactos suportados ou reconhecidos pelo
          scanner. A lista não é exaustiva, novos artefactos podem ser adicionados a qualquer
          momento.
        </p>
      </div>

      <section aria-label="Resumo dos artefactos" className="mb-6 grid gap-3 sm:grid-cols-3">
        <CountCard label="Tipos reconhecidos" value={supportedArtifacts.length} />
        <CountCard label="Risco baixo" value={lowRiskCount} />
        <CountCard label="Risco médio" value={mediumRiskCount} />
      </section>

      <section
        aria-label="Lista de artefactos"
        className="overflow-hidden rounded-md border border-border bg-surface"
      >
        <label className="flex h-11 items-center gap-2 border-b border-border px-3.5 text-secondary">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            aria-label="Pesquisar artefactos"
            placeholder="Pesquisar por nome, categoria ou descrição"
            className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted"
          />
        </label>

        {artifacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left">
              <thead className="bg-sidebar text-[10px] font-medium uppercase tracking-wide text-muted">
                <tr>
                  <th scope="col" className="px-3.5 py-2.5">
                    Directório
                  </th>
                  <th scope="col" className="px-3.5 py-2.5">
                    Categoria
                  </th>
                  <th scope="col" className="px-3.5 py-2.5">
                    Descrição
                  </th>
                  <th scope="col" className="px-3.5 py-2.5">
                    Risco
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {artifacts.map((artifact) => (
                  <tr key={artifact.name}>
                    <td className="whitespace-nowrap px-3.5 py-3">
                      <code className="text-xs font-medium text-foreground">{artifact.name}</code>
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-3 text-xs text-secondary">
                      {artifact.category}
                    </td>
                    <td className="px-3 py-3 text-xs leading-5 text-secondary">
                      {artifact.description}
                    </td>
                    <td className="whitespace-nowrap px-3.5 py-3">
                      <RiskBadge risk={artifact.risk} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="px-4 py-8 text-center text-[13px] text-secondary">
            Não foram encontrados artefactos para esta pesquisa.
          </p>
        )}
      </section>
    </div>
  );
}

function CountCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-surface px-4 py-3">
      <p className="text-xs text-secondary">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const isLowRisk = risk === "low";
  return (
    <span
      className={`inline-flex rounded border px-2 py-1 text-[11px] font-medium ${isLowRisk ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning"}`}
    >
      {isLowRisk ? "Baixo" : "Médio"}
    </span>
  );
}
