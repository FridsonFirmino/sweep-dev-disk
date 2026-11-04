//! Histórico local de limpezas em ficheiro JSON, com retenção limitada.
//! Falhas de I/O nunca abortam a limpeza; são silenciadas ou degradadas.
use std::fs;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::models::{CleanupHistoryEntry, CleanupHistoryFile, CleanupResult};

/// Número máximo de entradas mantidas no histórico.
const MAX_ENTRIES: usize = 200;
/// Número máximo de dias de retenção.
const MAX_AGE_DAYS: i64 = 30;
const HISTORY_VERSION: u32 = 1;

pub struct HistoryStore {
    path: PathBuf,
}

impl HistoryStore {
    pub fn new(directory: impl Into<PathBuf>) -> Self {
        Self {
            path: directory.into().join("cleanup-history.json"),
        }
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    /// Acrescenta uma entrada e aplica a retenção. Devolve `false` se a escrita falhar.
    pub fn append(&self, entry: CleanupHistoryEntry) -> bool {
        let mut file = self.load();
        file.entries.push(entry);
        prune(&mut file.entries);
        self.save(&file)
    }

    /// Lista as entradas mais recentes primeiro.
    pub fn list(&self) -> Vec<CleanupHistoryEntry> {
        let mut file = self.load();
        prune(&mut file.entries);
        file.entries.reverse();
        file.entries
    }

    fn load(&self) -> CleanupHistoryFile {
        let Ok(contents) = fs::read_to_string(&self.path) else {
            return CleanupHistoryFile {
                version: HISTORY_VERSION,
                entries: Vec::new(),
            };
        };
        match serde_json::from_str::<CleanupHistoryFile>(&contents) {
            Ok(file) if file.version == HISTORY_VERSION => file,
            _ => CleanupHistoryFile {
                version: HISTORY_VERSION,
                entries: Vec::new(),
            },
        }
    }

    fn save(&self, file: &CleanupHistoryFile) -> bool {
        if let Some(parent) = self.path.parent()
            && fs::create_dir_all(parent).is_err()
        {
            return false;
        }
        let Ok(contents) = serde_json::to_string_pretty(file) else {
            return false;
        };
        fs::write(&self.path, contents).is_ok()
    }
}

/// Constrói a entrada de histórico a partir do resultado de uma limpeza real.
pub fn entry_from_result(project_id: &str, result: &CleanupResult) -> CleanupHistoryEntry {
    CleanupHistoryEntry {
        id: format!(
            "{}-{}",
            format_timestamp(SystemTime::now()),
            result.removed_artifact_ids.len()
        ),
        finished_at: format_timestamp(SystemTime::now()),
        project_id: project_id.to_owned(),
        removed_artifact_ids: result.removed_artifact_ids.clone(),
        reclaimed_bytes: result.reclaimed_bytes,
        failure_count: result.failures.len(),
        restorable: !result.removed_artifact_ids.is_empty(),
    }
}

/// Remove entradas além do limite de quantidade ou idade.
fn prune(entries: &mut Vec<CleanupHistoryEntry>) {
    entries.sort_by(|left, right| left.finished_at.cmp(&right.finished_at));
    let cutoff = format_timestamp(
        SystemTime::now()
            .checked_sub(std::time::Duration::from_secs(
                (MAX_AGE_DAYS as u64) * 86_400,
            ))
            .unwrap_or(UNIX_EPOCH),
    );
    entries.retain(|entry| entry.finished_at.as_str() >= cutoff.as_str());
    if entries.len() > MAX_ENTRIES {
        let excess = entries.len() - MAX_ENTRIES;
        entries.drain(0..excess);
    }
}

/// Restaura do lixo os artefactos de uma entrada quando a plataforma o permite.
pub fn restore_entry(entry: &CleanupHistoryEntry) -> Result<usize, String> {
    if entry.removed_artifact_ids.is_empty() {
        return Err("cleanup_invalid_request".to_owned());
    }
    let targets: Vec<PathBuf> = entry
        .removed_artifact_ids
        .iter()
        .map(PathBuf::from)
        .collect();

    let items = trash::os_limited::list().map_err(|_| "cleanup_trash_unavailable".to_owned())?;
    let selected: Vec<_> = items
        .into_iter()
        .filter(|item| targets.contains(&item.original_path()))
        .collect();

    if selected.is_empty() {
        return Err("cleanup_failed".to_owned());
    }

    let restored = selected.len();
    trash::os_limited::restore_all(selected).map_err(|_| "cleanup_failed".to_owned())?;
    Ok(restored)
}

fn format_timestamp(time: SystemTime) -> String {
    let seconds = time
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs() as i64;
    let days = seconds.div_euclid(86_400);
    let day_seconds = seconds.rem_euclid(86_400);
    let shifted_days = days + 719_468;
    let era = if shifted_days >= 0 {
        shifted_days
    } else {
        shifted_days - 146_096
    } / 146_097;
    let day_of_era = shifted_days - era * 146_097;
    let year_of_era =
        (day_of_era - day_of_era / 1_460 + day_of_era / 36_524 - day_of_era / 146_096) / 365;
    let mut year = year_of_era + era * 400;
    let day_of_year = day_of_era - (365 * year_of_era + year_of_era / 4 - year_of_era / 100);
    let month_prime = (2 * day_of_year + 2) / 153;
    let day = day_of_year - (153 * month_prime + 2) / 5 + 1;
    let month = month_prime + if month_prime < 10 { 3 } else { -9 };
    year += i64::from(month <= 2);
    let hour = day_seconds / 3_600;
    let minute = day_seconds % 3_600 / 60;
    let second = day_seconds % 60;
    format!("{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}Z")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::{CleanupFailure, CleanupResult};

    fn sample_result(removed: Vec<String>) -> CleanupResult {
        CleanupResult {
            dry_run: false,
            removed_artifact_ids: removed,
            would_remove_artifact_ids: Vec::new(),
            reclaimed_bytes: 1024,
            failures: vec![CleanupFailure {
                artifact_id: "/tmp/x".to_owned(),
                code: "cleanup_failed".to_owned(),
                message: None,
            }],
        }
    }

    #[test]
    fn append_and_list_roundtrip() {
        let dir = tempfile::tempdir().unwrap();
        let store = HistoryStore::new(dir.path());
        let entry = entry_from_result(
            "/projects/a",
            &sample_result(vec!["/projects/a/node_modules".into()]),
        );
        assert!(store.append(entry));

        let listed = store.list();
        assert_eq!(listed.len(), 1);
        assert_eq!(listed[0].project_id, "/projects/a");
        assert_eq!(listed[0].failure_count, 1);
        assert!(store.path().exists());
    }

    #[test]
    fn corrupted_file_degrades_to_empty() {
        let dir = tempfile::tempdir().unwrap();
        let store = HistoryStore::new(dir.path());
        fs::write(store.path(), "{ not json").unwrap();
        assert!(store.list().is_empty());

        let entry = entry_from_result("/p", &sample_result(vec!["/p/node_modules".into()]));
        assert!(store.append(entry));
        assert_eq!(store.list().len(), 1);
    }

    #[test]
    fn prune_limits_entry_count() {
        let dir = tempfile::tempdir().unwrap();
        let store = HistoryStore::new(dir.path());
        for index in 0..(MAX_ENTRIES + 10) {
            let mut entry = entry_from_result(
                &format!("/p{index}"),
                &sample_result(vec!["/p/node_modules".into()]),
            );
            // Datas ascendentas estáveis para ordenar de forma determinística.
            entry.finished_at = format!("2026-01-01T00:{:02}:00Z", index % 60);
            entry.id = format!("entry-{index}");
            assert!(store.append(entry));
        }
        let listed = store.list();
        assert!(listed.len() <= MAX_ENTRIES);
    }

    #[test]
    fn restore_without_trash_items_fails() {
        let entry = CleanupHistoryEntry {
            id: "e".into(),
            finished_at: "2026-01-01T00:00:00Z".into(),
            project_id: "/p".into(),
            removed_artifact_ids: vec!["/definitely/not/in/trash".into()],
            reclaimed_bytes: 0,
            failure_count: 0,
            restorable: false,
        };
        let result = restore_entry(&entry);
        assert!(result.is_err());
    }
}
