//! Adaptadores IPC da limpeza: validam o pedido, coordenam a remoção e gravam o histórico.
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use tauri::{AppHandle, Manager, State};

use crate::core::cleanup;
use crate::core::history::{self, HistoryStore};
use crate::models::{CleanupHistoryEntry, CleanupRequest, CleanupResult};

/// Mantém apenas uma limpeza activa por aplicação.
#[derive(Default)]
pub struct CleanupState {
    active: Arc<Mutex<Option<Arc<AtomicBool>>>>,
}

#[tauri::command]
/// Executa a limpeza ou a simulação fora do runtime assíncrono e devolve o resultado.
pub async fn cleanup_artifacts(
    app: AppHandle,
    state: State<'_, CleanupState>,
    request: CleanupRequest,
) -> Result<CleanupResult, String> {
    let cancellation = Arc::new(AtomicBool::new(false));
    {
        let mut active = state
            .active
            .lock()
            .map_err(|_| "cleanup_state_unavailable".to_owned())?;
        if active.is_some() {
            return Err("cleanup_already_running".to_owned());
        }
        *active = Some(Arc::clone(&cancellation));
    }

    let active_slot = Arc::clone(&state.active);
    let task_cancellation = Arc::clone(&cancellation);
    let project_id = request.selection.project_id.clone();
    let dry_run = request.dry_run;

    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "cleanup_state_unavailable".to_owned())?;

    let task = tauri::async_runtime::spawn_blocking(move || {
        if task_cancellation.load(Ordering::Relaxed) {
            return Err("cleanup_failed".to_owned());
        }
        let result = cleanup::cleanup(request)?;
        Ok((result, project_id, dry_run, data_dir))
    })
    .await;

    if let Ok(mut active) = active_slot.lock()
        && active
            .as_ref()
            .is_some_and(|current| Arc::ptr_eq(current, &cancellation))
    {
        *active = None;
    }

    let (result, project_id, dry_run, data_dir) =
        task.map_err(|_| "cleanup_failed".to_owned())??;

    if !dry_run && !result.removed_artifact_ids.is_empty() {
        let store = HistoryStore::new(data_dir);
        let entry = history::entry_from_result(&project_id, &result);
        // Falhas de histórico não falham a limpeza já executada.
        let _ = store.append(entry);
    }

    Ok(result)
}

#[tauri::command]
/// Devolve as entradas do histórico local de limpezas, mais recentes primeiro.
pub fn list_cleanup_history(app: AppHandle) -> Result<Vec<CleanupHistoryEntry>, String> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|_| "cleanup_state_unavailable".to_owned())?;
    Ok(HistoryStore::new(data_dir).list())
}

#[tauri::command]
/// Restaura do lixo os artefactos de uma entrada do histórico, quando possível.
pub async fn restore_cleanup_entry(entry: CleanupHistoryEntry) -> Result<usize, String> {
    tauri::async_runtime::spawn_blocking(move || history::restore_entry(&entry))
        .await
        .map_err(|_| "cleanup_failed".to_owned())?
}
