//! Limpeza de artefactos: revalidação imediata, simulação e envio para o lixo.
//! O contrato completo está documentado em docs/CLEANUP.md.
use std::collections::HashSet;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::LazyLock;

use serde::Deserialize;

use crate::core::paths::{expand_home, is_excluded, names_equal, path_is_within};
use crate::models::{CleanupFailure, CleanupRequest, CleanupResult};

/// Número máximo de artefactos tratados num único pedido.
const MAX_ARTIFACTS_PER_REQUEST: usize = 500;
/// Profundidade máxima ao medir o conteúdo de um artefacto.
const MAX_MEASURE_DEPTH: usize = 64;
const MAX_SAFE_INTEGER: u64 = 9_007_199_254_740_991;

#[derive(Deserialize)]
struct ArtifactPattern {
    name: String,
}

static ARTIFACT_NAMES: LazyLock<Vec<ArtifactPattern>> = LazyLock::new(|| {
    serde_json::from_str(include_str!("../../../src/data/supported-artifacts.json"))
        .expect("the shared supported-artifacts catalog must be valid")
});

/// Executa a limpeza ou a simulação conforme `request.dry_run`.
pub fn cleanup(request: CleanupRequest) -> Result<CleanupResult, String> {
    let CleanupRequest {
        selection,
        project_directories,
        excluded_directories,
        dry_run,
    } = request;

    if selection.artifact_ids.is_empty() {
        return Err("cleanup_invalid_request".to_owned());
    }

    let roots = normalize_roots(&project_directories);
    let excluded = normalize_exclusions(&excluded_directories);
    let project_root = resolve_project_root(&selection.project_id, &roots);

    let mut artifact_ids = selection.artifact_ids;
    artifact_ids.sort();
    artifact_ids.dedup();

    if artifact_ids.len() > MAX_ARTIFACTS_PER_REQUEST {
        return Err("cleanup_invalid_request".to_owned());
    }

    let mut removed = Vec::new();
    let mut would_remove = Vec::new();
    let mut failures = Vec::new();
    let mut reclaimed_bytes = 0u64;

    for artifact_id in artifact_ids {
        match validate_target(&artifact_id, &roots, &excluded, project_root.as_deref()) {
            Ok(path) => {
                let bytes = measure_directory(&path).unwrap_or(0);
                if dry_run {
                    would_remove.push(artifact_id);
                    reclaimed_bytes = reclaimed_bytes.saturating_add(bytes);
                } else {
                    match trash::delete(&path) {
                        Ok(()) => {
                            removed.push(artifact_id);
                            reclaimed_bytes = reclaimed_bytes.saturating_add(bytes);
                        }
                        Err(error) => {
                            let code = trash_error_code(&error);
                            failures.push(CleanupFailure {
                                artifact_id,
                                code: code.to_owned(),
                                message: Some(error.to_string()),
                            });
                        }
                    }
                }
            }
            Err(code) => {
                failures.push(CleanupFailure {
                    artifact_id,
                    code: code.to_owned(),
                    message: None,
                });
            }
        }
    }

    Ok(CleanupResult {
        dry_run,
        removed_artifact_ids: removed,
        would_remove_artifact_ids: would_remove,
        reclaimed_bytes,
        failures,
    })
}

fn trash_error_code(error: &trash::Error) -> &'static str {
    match error {
        trash::Error::Unknown { .. } => "cleanup_trash_unavailable",
        _ => "cleanup_failed",
    }
}

/// Revalida um caminho de artefacto imediatamente antes da remoção.
fn validate_target(
    artifact_id: &str,
    roots: &[PathBuf],
    excluded: &[PathBuf],
    project_root: Option<&Path>,
) -> Result<PathBuf, &'static str> {
    let raw = Path::new(artifact_id);
    if !raw.is_absolute() {
        return Err("cleanup_path_outside_roots");
    }

    let canonical = fs::canonicalize(raw).map_err(|_| "cleanup_invalid_target")?;
    if !canonical.is_dir() {
        return Err("cleanup_invalid_target");
    }

    if is_root_or_protected(&canonical, roots) {
        return Err("cleanup_invalid_target");
    }
    if !roots.iter().any(|root| path_is_within(&canonical, root)) {
        return Err("cleanup_path_outside_roots");
    }
    if is_excluded(&canonical, excluded) {
        return Err("cleanup_path_excluded");
    }

    if let Some(project_root) = project_root {
        if canonical == project_root {
            return Err("cleanup_invalid_target");
        }
        if !path_is_within(&canonical, project_root) {
            return Err("cleanup_path_outside_roots");
        }
    }

    let name = canonical
        .file_name()
        .map(|name| name.to_string_lossy().into_owned())
        .ok_or("cleanup_invalid_target")?;
    if !is_artifact_name(&name) {
        return Err("cleanup_not_an_artifact");
    }

    Ok(canonical)
}

fn is_root_or_protected(path: &Path, roots: &[PathBuf]) -> bool {
    if path.parent().is_none() {
        return true;
    }
    if let Some(home) = crate::core::paths::home_directory()
        && path == home
    {
        return true;
    }
    roots.iter().any(|root| path == root)
}

fn resolve_project_root(project_id: &str, roots: &[PathBuf]) -> Option<PathBuf> {
    let raw = Path::new(project_id);
    if !raw.is_absolute() {
        return None;
    }
    let canonical = fs::canonicalize(raw).ok()?;
    if !roots.iter().any(|root| path_is_within(&canonical, root)) {
        return None;
    }
    Some(canonical)
}

fn is_artifact_name(name: &str) -> bool {
    ARTIFACT_NAMES
        .iter()
        .any(|pattern| names_equal(name, &pattern.name))
}

fn normalize_roots(input: &[String]) -> Vec<PathBuf> {
    let mut roots: Vec<PathBuf> = Vec::new();
    for value in input {
        let Some(path) = expand_home(value) else {
            continue;
        };
        if !path.is_absolute() {
            continue;
        }
        let Ok(canonical) = fs::canonicalize(&path) else {
            continue;
        };
        if !canonical.is_dir() {
            continue;
        }
        if !roots.iter().any(|root| path_is_within(&canonical, root)) {
            roots.push(canonical);
        }
    }
    roots
}

fn normalize_exclusions(input: &[String]) -> Vec<PathBuf> {
    let mut excluded: Vec<PathBuf> = Vec::new();
    for value in input {
        let Some(path) = expand_home(value) else {
            continue;
        };
        if !path.is_absolute() {
            continue;
        }
        let normalized = fs::canonicalize(&path)
            .unwrap_or_else(|_| crate::core::paths::normalize_lexically(&path));
        if !excluded
            .iter()
            .any(|existing| path_is_within(&normalized, existing))
        {
            excluded.push(normalized);
        }
    }
    excluded
}

/// Soma o tamanho lógico dos ficheiros alcançáveis dentro do artefacto.
fn measure_directory(root: &Path) -> Option<u64> {
    let mut pending = vec![(root.to_path_buf(), 0usize)];
    let mut visited: HashSet<PathBuf> = HashSet::new();
    let mut total = 0u64;

    while let Some((directory, depth)) = pending.pop() {
        if depth > MAX_MEASURE_DEPTH {
            continue;
        }
        let canonical = fs::canonicalize(&directory).ok()?;
        if !visited.insert(canonical.clone()) {
            continue;
        }
        let Ok(entries) = fs::read_dir(&canonical) else {
            continue;
        };
        for entry in entries.flatten() {
            let path = entry.path();
            let Ok(file_type) = entry.file_type() else {
                continue;
            };
            if file_type.is_symlink() {
                // Ligações simbólicas não são seguidas na medição de segurança.
                continue;
            }
            if file_type.is_dir() {
                pending.push((path, depth + 1));
            } else if file_type.is_file() {
                let len = entry.metadata().map(|meta| meta.len()).unwrap_or(0);
                total = total.saturating_add(len);
            }
        }
    }
    Some(total.min(MAX_SAFE_INTEGER))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::paths::display_path;
    use crate::models::CleanupSelection;
    use std::fs::{self, File};
    use std::io::Write;
    use tempfile::TempDir;

    struct TestTree {
        // Mantém o directório temporário vivo durante o teste.
        _dir: TempDir,
        root: PathBuf,
        project: PathBuf,
        artifact: PathBuf,
        outside_artifact: PathBuf,
        excluded_artifact: PathBuf,
        not_artifact: PathBuf,
    }

    fn setup() -> TestTree {
        let dir = tempfile::tempdir().expect("temp dir");
        let root_path = dir.path().to_path_buf();

        let project = root_path.join("project-a");
        let artifact = project.join("node_modules");
        let outside_artifact = root_path.join("other").join("node_modules");
        let excluded_artifact = project.join("vendor");
        let not_artifact = project.join("src");

        fs::create_dir_all(&artifact).unwrap();
        fs::create_dir_all(&outside_artifact).unwrap();
        fs::create_dir_all(&excluded_artifact).unwrap();
        fs::create_dir_all(&not_artifact).unwrap();
        fs::create_dir_all(project.join("docs")).unwrap();

        let mut file = File::create(artifact.join("index.js")).unwrap();
        writeln!(file, "console.log(1);").unwrap();
        let mut file = File::create(outside_artifact.join("lib.rs")).unwrap();
        writeln!(file, "fn main() {{}}").unwrap();

        TestTree {
            _dir: dir,
            root: root_path,
            project,
            artifact,
            outside_artifact,
            excluded_artifact,
            not_artifact,
        }
    }

    fn request(tree: &TestTree, ids: Vec<String>, dry_run: bool) -> CleanupRequest {
        CleanupRequest {
            selection: CleanupSelection {
                project_id: display_path(&tree.project),
                artifact_ids: ids,
            },
            project_directories: vec![display_path(&tree.root)],
            excluded_directories: vec![display_path(&tree.excluded_artifact)],
            dry_run,
        }
    }

    #[test]
    fn dry_run_lists_target_without_removing() {
        let tree = setup();
        let id = display_path(&tree.artifact);
        let result = cleanup(request(&tree, vec![id.clone()], true)).unwrap();

        assert!(result.dry_run);
        assert_eq!(result.would_remove_artifact_ids, vec![id.clone()]);
        assert!(result.removed_artifact_ids.is_empty());
        assert!(result.failures.is_empty());
        assert!(tree.artifact.exists());
        assert!(result.reclaimed_bytes > 0);
    }

    #[test]
    fn rejects_path_outside_roots() {
        let tree = setup();
        let id = display_path(&tree.outside_artifact);
        let result = cleanup(request(&tree, vec![id.clone()], true)).unwrap();

        assert!(result.would_remove_artifact_ids.is_empty());
        assert_eq!(result.failures.len(), 1);
        assert_eq!(result.failures[0].code, "cleanup_path_outside_roots");
        assert_eq!(result.failures[0].artifact_id, id);
    }

    #[test]
    fn rejects_excluded_path() {
        let tree = setup();
        let id = display_path(&tree.excluded_artifact);
        let result = cleanup(request(&tree, vec![id], true)).unwrap();

        assert_eq!(result.failures.len(), 1);
        assert_eq!(result.failures[0].code, "cleanup_path_excluded");
    }

    #[test]
    fn rejects_non_artifact_directory() {
        let tree = setup();
        let id = display_path(&tree.not_artifact);
        let result = cleanup(request(&tree, vec![id], true)).unwrap();

        assert_eq!(result.failures.len(), 1);
        assert_eq!(result.failures[0].code, "cleanup_not_an_artifact");
    }

    #[test]
    fn rejects_project_root_as_target() {
        let tree = setup();
        let id = display_path(&tree.project);
        let result = cleanup(request(&tree, vec![id], true)).unwrap();

        assert_eq!(result.failures.len(), 1);
        assert_eq!(result.failures[0].code, "cleanup_invalid_target");
    }

    #[test]
    fn rejects_configured_root_as_target() {
        let tree = setup();
        let id = display_path(&tree.root);
        let result = cleanup(request(&tree, vec![id], true)).unwrap();

        assert_eq!(result.failures.len(), 1);
        assert_eq!(result.failures[0].code, "cleanup_invalid_target");
    }

    #[test]
    fn partial_failure_continues_remaining_targets() {
        let tree = setup();
        let good = display_path(&tree.artifact);
        let bad = display_path(&tree.outside_artifact);
        let result = cleanup(request(&tree, vec![bad.clone(), good.clone()], true)).unwrap();

        assert_eq!(result.would_remove_artifact_ids, vec![good]);
        assert_eq!(result.failures.len(), 1);
        assert_eq!(result.failures[0].artifact_id, bad);
    }

    #[test]
    fn empty_selection_is_invalid() {
        let tree = setup();
        let error = cleanup(request(&tree, Vec::new(), true)).unwrap_err();
        assert_eq!(error, "cleanup_invalid_request");
    }

    #[test]
    fn missing_target_is_reported_as_invalid() {
        let tree = setup();
        let id = display_path(&tree.project.join("node_modules").join("missing"));
        let result = cleanup(request(&tree, vec![id], true)).unwrap();

        assert_eq!(result.failures.len(), 1);
        assert_eq!(result.failures[0].code, "cleanup_invalid_target");
    }
}
