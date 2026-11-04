//! Adaptadores IPC do scanner: aceita definições da interface, emite progresso e coordena cancelamento.
//! O percurso do sistema de ficheiros corre numa tarefa bloqueante para não parar o runtime Tauri.
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};

use tauri::{AppHandle, Emitter, State};

use crate::core::scanner;
use crate::models::{ScanOptions, ScanProgress, ScanResult};

/// Mantém apenas uma análise activa e partilha o sinal usado pelo comando de cancelamento.
#[derive(Default)]
pub struct ScanState {
    active: Arc<Mutex<Option<Arc<AtomicBool>>>>,
}

#[tauri::command]
/// Executa o scanner fora do runtime assíncrono e envia progresso à janela Tauri.
pub async fn scan_projects(
    app: AppHandle,
    state: State<'_, ScanState>,
    options: ScanOptions,
) -> Result<ScanResult, String> {
    let cancellation = Arc::new(AtomicBool::new(false));
    {
        let mut active = state
            .active
            .lock()
            .map_err(|_| "scan_state_unavailable".to_owned())?;
        if active.is_some() {
            return Err("scan_already_running".to_owned());
        }
        *active = Some(Arc::clone(&cancellation));
    }

    let active_slot = Arc::clone(&state.active);
    let task_cancellation = Arc::clone(&cancellation);
    let task = tauri::async_runtime::spawn_blocking(move || {
        scanner::scan(options, &task_cancellation, |progress: ScanProgress| {
            let _ = app.emit("scan-progress", progress);
        })
    })
    .await;

    if let Ok(mut active) = active_slot.lock()
        && active
            .as_ref()
            .is_some_and(|current| Arc::ptr_eq(current, &cancellation))
    {
        *active = None;
    }

    task.map_err(|_| "scan_failed".to_owned())?
}

#[tauri::command]
/// Pede o cancelamento da análise activa; não falha quando já não existe uma análise.
pub fn cancel_scan(state: State<'_, ScanState>) -> Result<(), String> {
    let active = state
        .active
        .lock()
        .map_err(|_| "scan_state_unavailable".to_owned())?;
    if let Some(cancellation) = active.as_ref() {
        cancellation.store(true, Ordering::Relaxed);
    }
    Ok(())
}
