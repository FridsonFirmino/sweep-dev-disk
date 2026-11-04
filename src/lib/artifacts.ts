import supportedArtifacts from "@/data/supported-artifacts.json";

export type ArtifactRecovery = "reinstallable" | "regenerable" | "review";

export interface RecoveryInfo {
  kind: ArtifactRecovery;
  label: string;
  note: string;
}

interface CatalogEntry {
  name: string;
  category: string;
  description: string;
  risk: "low" | "medium" | "high";
  recovery: ArtifactRecovery;
}

const RECOVERY: Record<ArtifactRecovery, Omit<RecoveryInfo, "kind">> = {
  reinstallable: {
    label: "Reinstalável",
    note: "remover é seguro, recupera-se ao instalar novamente as dependências.",
  },
  regenerable: {
    label: "Regenerável",
    note: "remover é seguro, volta a ser gerado na próxima compilação.",
  },
  review: {
    label: "Requer revisão",
    note: "pode conter dados não recuperáveis, rever antes de remover.",
  },
};

const recoveryByName = new Map<string, ArtifactRecovery>(
  (supportedArtifacts as CatalogEntry[]).map((entry) => [
    entry.name.toLocaleLowerCase("pt-PT"),
    entry.recovery,
  ]),
);

export function artifactRecovery(name: string): RecoveryInfo | null {
  const kind = recoveryByName.get(name.toLocaleLowerCase("pt-PT"));
  if (kind === undefined) {
    return null;
  }
  return { kind, ...RECOVERY[kind] };
}
