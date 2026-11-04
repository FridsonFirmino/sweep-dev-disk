//! Modelos serializados entre o frontend e o backend; os nomes IPC usam camelCase.
//! Avisos são não fatais e erros de comandos usam códigos estáveis definidos em docs/SCANNER.md.
use serde::{Deserialize, Serialize};

/// Preferências recebidas em cada análise; o backend não guarda estes caminhos.
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanOptions {
    #[serde(default)]
    pub project_directories: Vec<String>,
    #[serde(default)]
    pub excluded_directories: Vec<String>,
    #[serde(default)]
    pub follow_symbolic_links: bool,
    #[serde(default)]
    pub scan_hidden_directories: bool,
}

/// Progresso local emitido durante o percurso das raízes configuradas.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanProgress {
    pub current_path: String,
    pub projects_found: usize,
    pub artifacts_found: usize,
    pub completed: usize,
    pub total: usize,
}

/// Problema não fatal que não impede a análise das restantes raízes.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanWarning {
    pub code: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

/// Resultado final com caminhos absolutos, instante UTC e avisos recuperáveis.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub projects: Vec<Project>,
    pub disks: Vec<DiskSpace>,
    pub completed_at: String,
    pub warnings: Vec<ScanWarning>,
}

/// Capacidade e espaço disponível no volume onde está um directório analisado.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DiskSpace {
    pub mount_path: String,
    pub total_bytes: u64,
    pub available_bytes: u64,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub technology: String,
    pub last_activity: String,
    pub artifacts: Vec<Artifact>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Artifact {
    pub id: String,
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub reclaimable_bytes: u64,
    pub risk: ArtifactRisk,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ArtifactRisk {
    Low,
    Medium,
}

/// Artefactos escolhidos para uma operação de limpeza.
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupSelection {
    pub project_id: String,
    pub artifact_ids: Vec<String>,
}

/// Pedido completo de limpeza; o backend revalida com as definições recebidas.
#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupRequest {
    pub selection: CleanupSelection,
    #[serde(default)]
    pub project_directories: Vec<String>,
    #[serde(default)]
    pub excluded_directories: Vec<String>,
    #[serde(default)]
    pub dry_run: bool,
}

/// Falha isolada de um artefacto; não aborta o resto do pedido.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupFailure {
    pub artifact_id: String,
    pub code: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

/// Resultado de uma limpeza ou simulação, com falhas parciais.
#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupResult {
    pub dry_run: bool,
    pub removed_artifact_ids: Vec<String>,
    pub would_remove_artifact_ids: Vec<String>,
    pub reclaimed_bytes: u64,
    pub failures: Vec<CleanupFailure>,
}

/// Entrada do histórico local de limpezas executadas.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupHistoryEntry {
    pub id: String,
    pub finished_at: String,
    pub project_id: String,
    pub removed_artifact_ids: Vec<String>,
    pub reclaimed_bytes: u64,
    pub failure_count: usize,
    pub restorable: bool,
}

/// Envelope versionado do ficheiro de histórico.
#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupHistoryFile {
    pub version: u32,
    pub entries: Vec<CleanupHistoryEntry>,
}
